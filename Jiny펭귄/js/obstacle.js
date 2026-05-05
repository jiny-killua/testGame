/*
  Obstacle types (free-move, position + width based):
    iceblock  - ground, short     (avoid: move OR jump)
    highwall  - ground, tall      (avoid: move only — too tall to jump)
    icicle    - aerial            (avoid: slide OR move)
    seal      - ground, drifts L/R (avoid: move OR jump)
    polarbear - ground, huge      (avoid: move only)

  Patterns:
    _single       - one obstacle at random x
    _wallSide     - wide block on one side, gap on the other
    _twins        - two blocks with ~120px gap (medium)
    _twinNarrow   - two blocks with ~80px gap (hard, thread the needle)
    _icicleCombo  - ground obstacle + offset icicle
    _hardCombo    - twin narrow walls + icicle in the gap
*/

class Obstacle {
  constructor(type, worldX, y) {
    this.type    = type;
    this.worldX  = worldX;
    this.y       = y;
    this.alive   = true;
    this.animT   = Math.random() * Math.PI * 2;

    this.isAerial   = (type === 'icicle');
    this.isJumpable = (type === 'iceblock' || type === 'seal');

    const BASE = {
      iceblock:  { w: 90,  h: 44 },
      highwall:  { w: 90,  h: 72 },
      icicle:    { w: 80,  h: 38 },
      seal:      { w: 80,  h: 40 },
      polarbear: { w: 100, h: 62 },
    };
    this.w = BASE[type].w;
    this.h = BASE[type].h;

    // Seal drifts horizontally
    this.driftVx = (type === 'seal')
      ? (Math.random() < 0.5 ? 1 : -1) * randFloat(70, 130)
      : 0;
  }

  getHitbox() {
    return { x: this.worldX - this.w/2, y: this.y - this.h/2, w: this.w, h: this.h };
  }

  update(dt, speed) {
    this.y     += speed * dt;
    this.animT += dt * 3;

    if (this.driftVx !== 0) {
      this.worldX += this.driftVx * dt;
      const minX = FIELD_LEFT  + this.w / 2;
      const maxX = FIELD_RIGHT - this.w / 2;
      if (this.worldX <= minX) { this.worldX = minX; this.driftVx =  Math.abs(this.driftVx); }
      if (this.worldX >= maxX) { this.worldX = maxX; this.driftVx = -Math.abs(this.driftVx); }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.worldX, this.y);
    this['_draw_' + this.type](ctx);
    ctx.restore();
  }

  // --- draw helpers ---
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  _draw_iceblock(ctx) {
    const hw = this.w/2, hh = this.h/2;
    // Shadow
    ctx.fillStyle = 'rgba(0,60,100,0.18)';
    ctx.beginPath();
    ctx.ellipse(3, hh+6, hw*0.75, 7, 0, 0, Math.PI*2);
    ctx.fill();
    // Body
    const g = ctx.createLinearGradient(-hw, -hh, hw, hh);
    g.addColorStop(0, '#a8ddf5'); g.addColorStop(0.5, '#6bbee8'); g.addColorStop(1, '#3a8db8');
    ctx.fillStyle = g; ctx.strokeStyle = '#2a6e95'; ctx.lineWidth = 2;
    this._roundRect(ctx, -hw, -hh, this.w, this.h, 6);
    ctx.fill(); ctx.stroke();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    this._roundRect(ctx, -hw+6, -hh+5, Math.min(24, hw*0.55), 9, 3);
    ctx.fill();
    // Emoji
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.max(14, Math.min(20, this.w*0.22))}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🧊', 0, 2);
  }

  _draw_highwall(ctx) {
    const hw = this.w/2, hh = this.h/2;
    const g = ctx.createLinearGradient(-hw, -hh, hw, hh);
    g.addColorStop(0, '#88cce8'); g.addColorStop(1, '#2a7aaa');
    ctx.fillStyle = g; ctx.strokeStyle = '#1a5a88'; ctx.lineWidth = 2;
    this._roundRect(ctx, -hw, -hh, this.w, this.h, 6);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    this._roundRect(ctx, -hw+6, -hh+5, Math.min(20, hw*0.5), 13, 3);
    ctx.fill();
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏔️', 0, 2);
  }

  _draw_icicle(ctx) {
    // Dashed ring indicator
    ctx.save();
    ctx.setLineDash([5,3]);
    ctx.strokeStyle = 'rgba(150,220,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 28, 28, 0, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = 'rgba(180,230,255,0.85)';
    ctx.strokeStyle = '#5ab0d8'; ctx.lineWidth = 1.5;
    // Main spike
    ctx.beginPath();
    ctx.moveTo(-10,-18); ctx.lineTo(10,-18); ctx.lineTo(4,18); ctx.lineTo(-4,18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Side spikes
    ctx.beginPath();
    ctx.moveTo(-18,-14); ctx.lineTo(-6,-14); ctx.lineTo(-10,10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18,-14); ctx.lineTo(6,-14); ctx.lineTo(10,10);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▼ 슬라이드', 0, 28);
  }

  _draw_seal(ctx) {
    const bob = Math.sin(this.animT) * 3;
    ctx.save(); ctx.translate(0, bob);

    ctx.fillStyle = '#4a4a6a';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 20, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.ellipse(0, 4, 15, 12, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-8, -6, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8, -6, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-7, -7, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 9, -7, 1, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s*6,-2); ctx.lineTo(s*20,-5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*6, 0); ctx.lineTo(s*20, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*6, 2); ctx.lineTo(s*20, 4); ctx.stroke();
    }
    ctx.fillStyle = '#ffaaaa';
    ctx.beginPath(); ctx.arc(0,-3,3,0,Math.PI*2); ctx.fill();

    ctx.restore();
  }

  _draw_polarbear(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath(); ctx.ellipse(3, 34, 34, 10, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#e8e8ee';
    ctx.beginPath(); ctx.ellipse(0, 4, 34, 30, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f0f0f5';
    ctx.beginPath(); ctx.ellipse(0,-28, 22, 20, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#dde';
    ctx.beginPath(); ctx.ellipse(-18,-44, 8, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 18,-44, 8, 8, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-8,-30,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8,-30,3,0,Math.PI*2); ctx.fill();

    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.ellipse(0,-20,10,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(0,-22,3,0,Math.PI*2); ctx.fill();

    ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🐾', 0, 20);
  }
}

// ─── ObstacleManager ────────────────────────────────────────────────────

class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.timer     = 0;
    this.nextSpawn = 1.8;
    this.minGap    = 0.9;
    this.maxGap    = 2.8;
  }

  reset() {
    this.obstacles = [];
    this.timer     = 0;
    this.nextSpawn = 1.8;
  }

  // ── Pattern factories ──────────────────────────────────────────────

  _single(type) {
    const x = randFloat(FIELD_LEFT + 55, FIELD_RIGHT - 55);
    this.obstacles.push(new Obstacle(type, x, -80));
  }

  // Wide block on one side wall — player must dodge to opposite side
  _wallSide(type) {
    const blockW  = randFloat(170, 210);
    const onLeft  = Math.random() < 0.5;
    const obs     = new Obstacle(type, 0, -80);
    obs.w         = blockW;
    obs.worldX    = onLeft ? FIELD_LEFT + blockW/2 : FIELD_RIGHT - blockW/2;
    this.obstacles.push(obs);
  }

  // Two obstacles, comfortable gap (~110-140 px) — medium difficulty
  _twins() {
    const gapW      = randFloat(110, 140);
    const gapCenter = randFloat(FIELD_LEFT + 150, FIELD_RIGHT - 150);
    this._pushTwin('iceblock', gapCenter, gapW);
  }

  // Two obstacles, narrow gap (~70-90 px) — hard difficulty
  _twinNarrow() {
    const gapW      = randFloat(70, 92);
    const gapCenter = randFloat(FIELD_LEFT + 130, FIELD_RIGHT - 130);
    this._pushTwin('highwall', gapCenter, gapW);
  }

  _pushTwin(type, gapCenter, gapW) {
    const leftW  = gapCenter - gapW/2 - FIELD_LEFT;
    const rightW = FIELD_RIGHT - (gapCenter + gapW/2);
    if (leftW < 50 || rightW < 50) { this._single('iceblock'); return; }
    const lObs = new Obstacle(type, FIELD_LEFT + leftW/2, -80);
    lObs.w = leftW;
    const rObs = new Obstacle(type, FIELD_RIGHT - rightW/2, -80);
    rObs.w = rightW;
    this.obstacles.push(lObs, rObs);
  }

  // Ground obstacle + icicle at a different x
  _icicleCombo() {
    const x1 = randFloat(FIELD_LEFT+55, FIELD_RIGHT-55);
    let x2;
    do { x2 = randFloat(FIELD_LEFT+55, FIELD_RIGHT-55); }
    while (Math.abs(x2 - x1) < 80);
    this.obstacles.push(new Obstacle('iceblock', x1, -80));
    this.obstacles.push(new Obstacle('icicle',   x2, -80));
  }

  // Twin narrow walls + icicle sitting in the gap
  _hardCombo() {
    const gapW      = randFloat(75, 95);
    const gapCenter = randFloat(FIELD_LEFT+130, FIELD_RIGHT-130);
    this._pushTwin('highwall', gapCenter, gapW);
    this.obstacles.push(new Obstacle('icicle', gapCenter, -80));
  }

  // ── Pattern selector ──────────────────────────────────────────────

  _choosePattern(difficulty) {
    const easy   = [
      () => this._single('iceblock'),
      () => this._single('seal'),
      () => this._single('icicle'),
      () => this._wallSide('iceblock'),
    ];
    const medium = [
      () => this._wallSide('highwall'),
      () => this._wallSide('polarbear'),
      () => this._twins(),
      () => this._icicleCombo(),
    ];
    const hard   = [
      () => this._twinNarrow(),
      () => this._hardCombo(),
      () => this._twins(),           // still in rotation as easier option
    ];

    if (difficulty < 0.35) return randItem(easy);
    if (difficulty < 0.65) return randItem([...easy, ...medium]);
    return randItem([...medium, ...hard]);
  }

  // ── Update / Collision / Draw ──────────────────────────────────────

  update(dt, speed, difficulty) {
    this.timer += dt;
    if (this.timer >= this.nextSpawn) {
      this.timer = 0;
      const gap = lerp(this.maxGap, this.minGap, difficulty);
      this.nextSpawn = gap + (Math.random() - 0.5) * 0.35;
      this._choosePattern(difficulty)();
    }
    for (const obs of this.obstacles) obs.update(dt, speed);
    this.obstacles = this.obstacles.filter(o => o.y < CANVAS_H + 120);
  }

  checkCollision(player) {
    if (player.dead || player.superMode) return false;
    const phb = player.getHitbox();

    for (const obs of this.obstacles) {
      // Z-cull: obstacle well behind player
      if (obs.y > player.y + 80) continue;

      if (obs.isJumpable && player.jumping && player.jumpH > 8) continue;
      if (obs.isAerial   && player.sliding) continue;

      const hb = obs.getHitbox();
      if (aabb(phb.x, phb.y, phb.w, phb.h, hb.x, hb.y, hb.w, hb.h)) return true;
    }
    return false;
  }

  draw(ctx) {
    for (const obs of this.obstacles) obs.draw(ctx);
  }
}
