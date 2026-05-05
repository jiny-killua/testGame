class Player {
  constructor() {
    this.x  = FIELD_CENTER;
    this.y  = 555;

    // Horizontal free movement
    this.vx         = 0;
    this.moveSpeed  = 400;   // px/s target
    this.friction   = 14;    // lerp factor (higher = snappier stop)
    this.movingLeft  = false;
    this.movingRight = false;

    // Jump
    this.jumping        = false;
    this.jumpT          = 0;
    this.jumpDur        = 0.50;
    this.jumpH          = 0;
    this.doubleJumpUsed = false;

    // Slide
    this.sliding  = false;
    this.slideT   = 0;
    this.slideDur = 0.42;

    // Super mode
    this.superMode  = false;
    this.superTimer = 0;
    this.superDur   = 5;
    this.superFlash = 0;

    // Fish gauge (0-5)
    this.fishCount = 0;

    this.dead      = false;
    this.deadTimer = 0;
    this.deathAnim = 0;

    this.hw = 28;  // hitbox half-width (tighter than sprite for fair play)
    this.hh = 36;
  }

  getHitbox() {
    const hw = this.sliding ? this.hw * 1.15 : this.hw;
    const hh = this.sliding ? this.hh * 0.5  : this.hh;
    return { x: this.x - hw, y: this.y - hh, w: hw * 2, h: hh * 2 };
  }

  moveLeft()  { this.movingLeft  = true; }
  moveRight() { this.movingRight = true; }
  stopLeft()  { this.movingLeft  = false; }
  stopRight() { this.movingRight = false; }

  jump() {
    if (this.dead) return;
    if (!this.jumping) {
      this.jumping = true;
      this.jumpT   = 0;
      this.doubleJumpUsed = false;
    } else if (!this.doubleJumpUsed) {
      // Air jump: restart arc at reduced height
      this.jumpT = 0;
      this.doubleJumpUsed = true;
    }
  }

  slide() {
    if (this.dead || this.jumping || this.sliding) return;
    this.sliding = true;
    this.slideT  = 0;
  }

  activateSuper() {
    this.superMode  = true;
    this.superTimer = this.superDur;
  }

  addFish(big) {
    this.fishCount += big ? 2 : 1;
    if (this.fishCount >= 5 && !this.superMode) {
      this.fishCount = 0;
      this.activateSuper();
    }
  }

  die() {
    if (this.superMode || this.dead) return false;
    this.dead      = true;
    this.deathAnim = 0;
    this.movingLeft = this.movingRight = false;
    return true;
  }

  update(dt) {
    if (this.dead) {
      this.deadTimer += dt;
      this.deathAnim  = Math.min(1, this.deathAnim + dt * 3);
      return;
    }

    // Horizontal movement with friction
    let targetVx = 0;
    if (this.movingLeft  && !this.movingRight) targetVx = -this.moveSpeed;
    if (this.movingRight && !this.movingLeft)  targetVx =  this.moveSpeed;

    this.vx = lerp(this.vx, targetVx, Math.min(1, this.friction * dt));
    this.x  = clamp(this.x + this.vx * dt, FIELD_LEFT, FIELD_RIGHT);

    // Jump arc
    if (this.jumping) {
      this.jumpT += dt;
      const p = this.jumpT / this.jumpDur;
      if (p >= 1) {
        this.jumping = this.doubleJumpUsed = false;
        this.jumpT = this.jumpH = 0;
      } else {
        const h = this.doubleJumpUsed ? 38 : 55;
        this.jumpH = Math.sin(p * Math.PI) * h;
      }
    }

    // Slide
    if (this.sliding) {
      this.slideT += dt;
      if (this.slideT >= this.slideDur) {
        this.sliding = false;
        this.slideT  = 0;
      }
    }

    // Super
    if (this.superMode) {
      this.superTimer -= dt;
      this.superFlash += dt * 8;
      if (this.superTimer <= 0) {
        this.superMode  = false;
        this.superTimer = 0;
      }
    }
  }

  draw(ctx) {
    const drawY = this.y - this.jumpH;
    const alive = !this.dead;

    ctx.save();

    // Blob shadow (scales with jump height)
    if (this.jumpH > 4) {
      const sa = 0.35 * (1 - this.jumpH / 55);
      ctx.globalAlpha = sa;
      ctx.fillStyle = '#224';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 10, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.superMode) {
      const pulse = (Math.sin(this.superFlash) + 1) / 2;
      ctx.shadowColor = `rgba(255,220,0,${0.6 + pulse * 0.4})`;
      ctx.shadowBlur  = 18 + pulse * 10;
    }

    if (this.dead) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.deathAnim * Math.PI * 0.6);
      ctx.translate(-this.x, -this.y);
      ctx.globalAlpha = Math.max(0, 1 - this.deathAnim * 0.5);
    }

    // Body lean based on horizontal velocity
    const lean = clamp(this.vx / this.moveSpeed, -1, 1) * 0.22;
    const sY   = this.sliding ? 0.52 : 1;
    const sX   = this.sliding ? 1.38 : 1;

    ctx.translate(this.x, drawY);
    if (lean !== 0) ctx.rotate(lean);
    ctx.scale(sX, sY);

    // Body
    ctx.fillStyle = alive ? (this.superMode ? '#2244aa' : '#1e1e38') : '#666';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = this.superMode ? '#ffe866' : '#eef0f5';
    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (!this.dead) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-8, -11, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( 8, -11, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(-7, -11, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( 9, -11, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-6, -12.5, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -12.5, 1, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      for (const [ex, ey] of [[-8, -11], [8, -11]]) {
        ctx.beginPath(); ctx.moveTo(ex-3, ey-3); ctx.lineTo(ex+3, ey+3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex+3, ey-3); ctx.lineTo(ex-3, ey+3); ctx.stroke();
      }
    }

    // Beak
    ctx.fillStyle = '#ff9500';
    ctx.beginPath();
    ctx.moveTo(-5, -23); ctx.lineTo(5, -23); ctx.lineTo(0, -33);
    ctx.closePath(); ctx.fill();

    // Wings
    ctx.fillStyle = alive ? '#2a2a50' : '#555';
    ctx.beginPath(); ctx.ellipse(-28, 2, 10, 6, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 28, 2, 10, 6,  0.35, 0, Math.PI * 2); ctx.fill();

    // Feet
    if (!this.sliding) {
      ctx.fillStyle = '#ff9500';
      ctx.beginPath(); ctx.ellipse(-10, 24, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 10, 24, 8, 5,  0.3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }
}
