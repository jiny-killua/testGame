class UI {
  constructor() {
    this.hudEl        = document.getElementById('hud');
    this.overlayEl    = document.getElementById('overlay');
    this.scoreEl      = document.getElementById('score-val');
    this.bestEl       = document.getElementById('best-val');
    this.levelEl      = document.getElementById('level-val');
    this.fishEl       = document.getElementById('fish-gauge');
    this.magnetStatus = document.getElementById('magnet-status');
    this.magnetTimer  = document.getElementById('magnet-timer');
    this.superStatus  = document.getElementById('super-status');
    this.superTimerEl = document.getElementById('super-timer');
    this.mobileBtns   = document.getElementById('mobile-btns');
    this.pauseBtn     = document.getElementById('pause-btn');

    this._callbacks = {};

    // Detect touch device → show mobile buttons
    this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this._showTitle();
  }

  // ── Callbacks (set by Game) ───────────────────────────────────────────
  on(event, fn) { this._callbacks[event] = fn; }
  _emit(event)  { this._callbacks[event]?.(); }

  // ── Screen transitions ────────────────────────────────────────────────

  _showTitle() {
    this.hudEl.style.display     = 'none';
    this.mobileBtns.style.display = 'none';
    this.pauseBtn.style.display  = 'none';
    this.overlayEl.style.display = 'flex';
    this.overlayEl.innerHTML = `
      <div class="screen">
        <div class="big-emoji">🐧</div>
        <div class="title">Jiny펭귄 3D</div>
        <div class="subtitle">프리 무브 엔드리스 러너</div>
        <button class="overlay-btn" id="ov-start">게임 시작</button>
        <div class="controls-hint">
          ← → (A / D) &nbsp;·&nbsp; 좌우 이동 (누른 만큼)<br>
          Space / ↑ &nbsp;·&nbsp; 점프 &nbsp;(공중에서 한 번 더 → 2단점프)<br>
          ↓ / S &nbsp;·&nbsp; 슬라이드<br>
          P / ESC &nbsp;·&nbsp; 일시정지
        </div>
      </div>`;
    document.getElementById('ov-start')
      .addEventListener('click', () => this._emit('start'));
  }

  showGame() {
    this.overlayEl.style.display  = 'none';
    this.hudEl.style.display      = 'flex';
    this.pauseBtn.style.display   = 'block';
    if (this._isTouchDevice) {
      this.mobileBtns.style.display = 'flex';
    }
  }

  showPause() {
    this.overlayEl.style.display = 'flex';
    this.overlayEl.innerHTML = `
      <div class="screen">
        <div class="pause-title">일시정지</div>
        <div class="pause-hint">P / ESC 키로 재개</div>
        <br>
        <button class="overlay-btn" id="ov-resume">계속하기</button>
      </div>`;
    document.getElementById('ov-resume')
      .addEventListener('click', () => this._emit('resume'));
  }

  hidePause() {
    this.overlayEl.style.display = 'none';
  }

  showGameOver(score, best, isNewBest) {
    this.hudEl.style.display      = 'none';
    this.mobileBtns.style.display = 'none';
    this.pauseBtn.style.display   = 'none';
    this.overlayEl.style.display  = 'flex';
    this.overlayEl.innerHTML = `
      <div class="screen">
        <div class="game-over-title">GAME OVER</div>
        <div class="big-emoji">🐧</div>
        ${isNewBest ? '<div class="new-best">🎉 신기록!</div>' : ''}
        <div class="score-row">
          <div><div class="lbl">점수</div><div class="val">${score.toLocaleString()}</div></div>
          <div><div class="lbl">최고 기록</div><div class="val best-val">${best.toLocaleString()}</div></div>
        </div>
        <button class="overlay-btn" id="ov-restart">다시 시작</button>
        <button class="overlay-btn secondary" id="ov-title">메인으로</button>
        <div class="controls-hint" style="margin-top:14px">Space / Enter 키로 재시작</div>
      </div>`;
    document.getElementById('ov-restart')
      .addEventListener('click', () => this._emit('restart'));
    document.getElementById('ov-title')
      .addEventListener('click', () => { this._emit('toTitle'); this._showTitle(); });
  }

  // ── HUD update ────────────────────────────────────────────────────────

  update(score, best, level, fishCount, superMode, superTimer, magnetActive, magnetTimer) {
    this.scoreEl.textContent = score.toLocaleString();
    this.bestEl.textContent  = best.toLocaleString();
    this.levelEl.textContent = level;

    // Fish gauge
    if (superMode) {
      const pct = Math.max(0, superTimer / 5 * 100).toFixed(0);
      this.fishEl.innerHTML =
        `<div class="super-bar-wrap"><div class="super-bar-fill" style="width:${pct}%"></div></div>`;
    } else {
      let html = '';
      for (let i = 0; i < 5; i++) {
        html += `<span style="opacity:${i < fishCount ? 1 : 0.2}">🐟</span>`;
      }
      this.fishEl.innerHTML = html;
    }

    // Status badges
    if (magnetActive) {
      this.magnetStatus.style.display = 'inline';
      this.magnetTimer.textContent    = magnetTimer.toFixed(1);
    } else {
      this.magnetStatus.style.display = 'none';
    }
    if (superMode) {
      this.superStatus.style.display  = 'inline';
      this.superTimerEl.textContent   = superTimer.toFixed(1);
    } else {
      this.superStatus.style.display  = 'none';
    }
  }

  // ── Touch button wiring ───────────────────────────────────────────────

  bindTouchButtons({ onLeftStart, onLeftEnd, onRightStart, onRightEnd, onJump, onSlide }) {
    const btnL = document.getElementById('btn-left');
    const btnR = document.getElementById('btn-right');
    const btnJ = document.getElementById('btn-jump');
    let jumpStartMs = 0;

    const prevent = e => e.preventDefault();

    btnL.addEventListener('touchstart', e => { prevent(e); onLeftStart();  }, { passive: false });
    btnL.addEventListener('touchend',   e => { prevent(e); onLeftEnd();    }, { passive: false });
    btnL.addEventListener('touchcancel',e => { prevent(e); onLeftEnd();    }, { passive: false });

    btnR.addEventListener('touchstart', e => { prevent(e); onRightStart(); }, { passive: false });
    btnR.addEventListener('touchend',   e => { prevent(e); onRightEnd();   }, { passive: false });
    btnR.addEventListener('touchcancel',e => { prevent(e); onRightEnd();   }, { passive: false });

    btnJ.addEventListener('touchstart', e => {
      prevent(e);
      jumpStartMs = performance.now();
    }, { passive: false });
    btnJ.addEventListener('touchend', e => {
      prevent(e);
      const held = performance.now() - jumpStartMs;
      if (held >= 300) onSlide();
      else             onJump();
    }, { passive: false });

    // Pause button
    this.pauseBtn.addEventListener('click', () => this._emit('pause'));
  }
}
