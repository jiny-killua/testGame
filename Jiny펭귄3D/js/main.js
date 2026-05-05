class Game {
  constructor() {
    this.state    = STATE.TITLE;
    this.score    = 0;
    this.best     = parseInt(localStorage.getItem('jiny3DBest') || '0');
    this.distance = 0;
    this.speed    = 5;
    this.level    = 1;
    this.isNewBest = false;
    this.lastTime  = null;

    // ── Three.js setup ───────────────────────────────────────────────
    const canvas   = document.getElementById('canvas');
    this.renderer  = createRenderer(canvas);
    this.scene     = createScene();
    this.camera    = createCamera();
    createLights(this.scene);
    this.camCtrl   = new CameraController(this.camera);

    // ── Game objects ──────────────────────────────────────────────────
    this.track  = new Track(this.scene);
    this.player = null;   // created on game start
    this.snow   = createSnow(this.scene);

    // ── UI ────────────────────────────────────────────────────────────
    this.ui = new UI();
    this.ui.on('start',   () => this._startGame());
    this.ui.on('restart', () => this._startGame());
    this.ui.on('toTitle', () => { this.state = STATE.TITLE; });
    this.ui.on('pause',   () => this._togglePause());
    this.ui.on('resume',  () => this._togglePause());

    // ── Input ─────────────────────────────────────────────────────────
    this._bindKeyboard();
    this.ui.bindTouchButtons({
      onLeftStart:  () => this.player?.moveLeft(),
      onLeftEnd:    () => this.player?.stopLeft(),
      onRightStart: () => this.player?.moveRight(),
      onRightEnd:   () => this.player?.stopRight(),
      onJump:       () => {
        if (this.state === STATE.PLAYING) this.player?.jump();
        else if (this.state === STATE.TITLE || this.state === STATE.GAMEOVER) this._startGame();
      },
      onSlide: () => this.player?.slide(),
    });

    // ── Resize ────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // ── Begin render loop ────────────────────────────────────────────
    requestAnimationFrame(ts => this._loop(ts));
  }

  // ── Difficulty ───────────────────────────────────────────────────────
  get difficulty() {
    return clamp((this.distance - 100) / 1400, 0, 1);
  }

  // ── Keyboard ─────────────────────────────────────────────────────────
  _bindKeyboard() {
    const held = {};

    document.addEventListener('keydown', e => {
      if (held[e.code]) return;
      held[e.code] = true;

      // Title / GameOver: any key starts game
      if (this.state === STATE.TITLE || this.state === STATE.GAMEOVER) {
        if (['Space','Enter','KeyZ'].includes(e.code)) { this._startGame(); return; }
      }

      if (['KeyP','Escape'].includes(e.code)) { this._togglePause(); return; }

      if (this.state !== STATE.PLAYING) return;

      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { this.player?.moveLeft();  e.preventDefault(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.player?.moveRight(); e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.player?.jump(); e.preventDefault();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.player?.slide(); e.preventDefault();
      }
    });

    document.addEventListener('keyup', e => {
      held[e.code] = false;
      if (this.state !== STATE.PLAYING) return;
      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') this.player?.stopLeft();
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.player?.stopRight();
    });
  }

  // ── Game state transitions ────────────────────────────────────────────
  _startGame() {
    // Clean up previous player
    if (this.player) this.player.dispose();

    this.state     = STATE.PLAYING;
    this.score     = 0;
    this.distance  = 0;
    this.speed     = 5;
    this.level     = 1;
    this.isNewBest = false;

    this.player = new Player(this.scene);
    this.ui.showGame();
  }

  _togglePause() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      this.ui.showPause();
    } else if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      this.ui.hidePause();
    }
  }

  // ── Update ───────────────────────────────────────────────────────────
  _update(dt) {
    // Always update snow & camera even on title
    updateSnow(this.snow, dt, this.state === STATE.PLAYING ? this.speed : 3);

    if (this.state === STATE.TITLE) {
      // Slow drift on title screen
      this.track.update(dt, 3);
      this.camCtrl.update(dt, 0, 0);
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    // ── Gameplay ────────────────────────────────────────────────────
    this.distance += this.speed * dt;
    this.speed     = clamp(5 + this.distance * 0.006, 5, 13);
    this.level     = Math.floor(this.distance / 300) + 1;
    this.score    += Math.floor(this.speed * dt * 3);

    this.track.update(dt, this.speed);
    this.player.update(dt);
    this.camCtrl.update(dt, this.player.x, this.player.jumpH);

    this.ui.update(
      this.score, this.best, this.level,
      this.player.fishCount,
      this.player.superMode, this.player.superTimer,
      false, 0  // magnet: Phase 3
    );

    // ── Phase 2 placeholder: collision / obstacles ─────────────────
    // TODO: ObstacleManager, ItemManager

    // ── Death sequence ──────────────────────────────────────────────
    if (this.player.dead) {
      if (this.player.deadTimer > 1.6) {
        if (this.score > this.best) {
          this.best      = this.score;
          this.isNewBest = true;
          localStorage.setItem('jiny3DBest', this.best);
        }
        this.state = STATE.GAMEOVER;
        this.ui.showGameOver(this.score, this.best, this.isNewBest);
      }
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  _draw() {
    this.renderer.render(this.scene, this.camera);
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

// ── Entry point ──────────────────────────────────────────────────────────
window.addEventListener('load', () => new Game());
