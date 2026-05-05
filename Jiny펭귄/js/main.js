class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.state  = STATE.TITLE;

    this.bg       = new Background();
    this.player   = new Player();
    this.obstMgr  = new ObstacleManager();
    this.itemMgr  = new ItemManager();
    this.ui       = new UI();

    this.score    = 0;
    this.best     = parseInt(localStorage.getItem('jinyBest') || '0');
    this.level    = 1;
    this.distance = 0;
    this.speed    = 300;
    this.isNewBest = false;

    this.lastTime = null;
    this.keys     = {};

    this._bindEvents();
    requestAnimationFrame(ts => this._loop(ts));
  }

  get difficulty() {
    return clamp((this.distance - 100) / 1400, 0, 1);
  }

  // ── Event binding ────────────────────────────────────────────────────

  _bindEvents() {
    // Keyboard — hold left/right for continuous movement
    document.addEventListener('keydown', e => {
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;

      if (this.state === STATE.TITLE || this.state === STATE.GAMEOVER) {
        if (['Space','Enter','KeyZ'].includes(e.code)) { this._startGame(); return; }
      }
      if (['KeyP','Escape'].includes(e.code)) {
        if      (this.state === STATE.PLAYING) this.state = STATE.PAUSED;
        else if (this.state === STATE.PAUSED)  this.state = STATE.PLAYING;
        return;
      }
      if (this.state !== STATE.PLAYING) return;

      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { this.player.moveLeft();  e.preventDefault(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.player.moveRight(); e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.player.jump(); e.preventDefault();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.player.slide(); e.preventDefault();
      }
    });

    document.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (this.state !== STATE.PLAYING) return;
      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') this.player.stopLeft();
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.player.stopRight();
    });

    // Click — for title / gameover button detection
    this.canvas.addEventListener('click', e => {
      const { mx, my } = this._canvasPos(e.clientX, e.clientY);
      if (this.state === STATE.TITLE) {
        if (this.ui.getTitleClick(mx, my) === 'start') this._startGame();
      } else if (this.state === STATE.GAMEOVER) {
        const btn = this.ui.getGameOverClick(mx, my);
        if (btn === 'restart') this._startGame();
        if (btn === 'title')   { this.state = STATE.TITLE; this.ui.goAnim = 0; }
      }
    });

    // Multi-touch — left ◀ / jump (center) / right ▶ buttons
    // touchMeta tracks: zone + start time per touch identifier
    const touchMeta = new Map();

    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const { mx, my } = this._canvasPos(t.clientX, t.clientY);

        if (this.state === STATE.TITLE || this.state === STATE.GAMEOVER) {
          touchMeta.set(t.identifier, { zone: 'ui', startTime: performance.now() });
          continue;
        }
        if (this.state === STATE.PAUSED) continue;
        if (this.state !== STATE.PLAYING) continue;

        const zone = this._touchZone(mx, my);
        touchMeta.set(t.identifier, { zone, startTime: performance.now() });
        if (zone === 'left')  this.player.moveLeft();
        if (zone === 'right') this.player.moveRight();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const meta = touchMeta.get(t.identifier);
        touchMeta.delete(t.identifier);
        if (!meta) continue;

        if (meta.zone === 'ui') {
          if (this.state === STATE.TITLE || this.state === STATE.GAMEOVER) this._startGame();
          continue;
        }
        if (this.state !== STATE.PLAYING) continue;

        if (meta.zone === 'left') {
          const anyLeft = [...touchMeta.values()].some(m => m.zone === 'left');
          if (!anyLeft) this.player.stopLeft();
        }
        if (meta.zone === 'right') {
          const anyRight = [...touchMeta.values()].some(m => m.zone === 'right');
          if (!anyRight) this.player.stopRight();
        }
        if (meta.zone === 'jump') {
          const held = performance.now() - meta.startTime;
          if (held >= 300) this.player.slide();
          else             this.player.jump();
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', e => {
      for (const t of e.changedTouches) {
        const meta = touchMeta.get(t.identifier);
        touchMeta.delete(t.identifier);
        if (!meta || this.state !== STATE.PLAYING) continue;
        if (meta.zone === 'left') {
          const anyLeft = [...touchMeta.values()].some(m => m.zone === 'left');
          if (!anyLeft) this.player.stopLeft();
        }
        if (meta.zone === 'right') {
          const anyRight = [...touchMeta.values()].some(m => m.zone === 'right');
          if (!anyRight) this.player.stopRight();
        }
      }
    }, { passive: false });
  }

  _canvasPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      mx: (clientX - rect.left) * (CANVAS_W / rect.width),
      my: (clientY - rect.top)  * (CANVAS_H / rect.height),
    };
  }

  // Mobile button zones — bottom 120px of canvas
  _touchZone(mx, my) {
    if (my >= CANVAS_H - 120) {
      if (mx < CANVAS_W / 3)       return 'left';
      if (mx > CANVAS_W * 2 / 3)   return 'right';
      return 'jump';
    }
    // Taps in the gameplay area count as jump too
    return 'jump';
  }

  // ── Game state ───────────────────────────────────────────────────────

  _startGame() {
    this.state    = STATE.PLAYING;
    this.score    = 0;
    this.distance = 0;
    this.level    = 1;
    this.speed    = 300;
    this.isNewBest = false;

    this.player  = new Player();
    this.obstMgr.reset();
    this.itemMgr.reset();
    this.ui.particles = [];
    this.ui.goAnim    = 0;
  }

  // ── Update ───────────────────────────────────────────────────────────

  _updateSpeed() {
    this.speed = clamp(300 + this.distance * 0.22, 300, 700);
    this.level = Math.floor(this.distance / 300) + 1;
  }

  _collectItems() {
    const collected = this.itemMgr.checkCollect(this.player);
    for (const type of collected) {
      let pts = 0, label = '', color = '#ffdd00';
      switch (type) {
        case 'fish_s': pts=20; label='+20';       color='#66ccff'; this.player.addFish(false); break;
        case 'fish_l': pts=50; label='+50';       color='#ff8800'; this.player.addFish(true);  break;
        case 'star':   pts=30; label='+30 ⭐';    color='#ffff44'; break;
        case 'magnet':         label='🧲 자석!';  color='#ff44aa'; break;
      }
      this.score += pts;
      this.ui.addScorePop(this.player.x, this.player.y - 50, label, color);
    }
  }

  _update(dt) {
    if (this.state !== STATE.PLAYING) return;

    this.distance += (this.speed * dt) / 60;
    this._updateSpeed();

    this.bg.update(dt, this.speed);
    this.player.update(dt);

    if (!this.player.dead) {
      this.obstMgr.update(dt, this.speed, this.difficulty);
      this.itemMgr.update(dt, this.speed);
      this._collectItems();
      this.score += Math.floor(this.speed * dt * 0.05);

      if (this.obstMgr.checkCollision(this.player)) this.player.die();
    } else {
      this.bg.update(dt, this.speed * 0.3);
      if (this.player.deadTimer > 1.2) {
        if (this.score > this.best) {
          this.best      = this.score;
          this.isNewBest = true;
          localStorage.setItem('jinyBest', this.best);
        }
        this.state     = STATE.GAMEOVER;
        this.ui.goAnim = 0;
      }
    }

    this.ui.update(dt);
  }

  // ── Draw ─────────────────────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (this.state === STATE.TITLE) {
      this.bg.draw(ctx);
      this.ui.drawTitle(ctx);
      return;
    }

    this.bg.draw(ctx);
    this.itemMgr.draw(ctx);
    this.obstMgr.draw(ctx);
    this.player.draw(ctx);

    this.ui.drawHUD(
      ctx, this.score, this.best, this.level,
      this.player.fishCount, this.player.superMode, this.player.superTimer,
      this.itemMgr.magnetActive, this.itemMgr.magnetTimer
    );

    if      (this.state === STATE.PAUSED)   this.ui.drawPause(ctx);
    else if (this.state === STATE.GAMEOVER) this.ui.drawGameOver(ctx, this.score, this.best, this.isNewBest);
  }

  // ── Loop ─────────────────────────────────────────────────────────────

  _loop(timestamp) {
    if (this.lastTime === null) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this._update(dt);
    this._draw();
    requestAnimationFrame(ts => this._loop(ts));
  }
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('canvas');
  new Game(canvas);
});
