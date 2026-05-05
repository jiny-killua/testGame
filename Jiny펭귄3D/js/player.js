// ── Penguin mesh (primitive shapes) ───────────────────────────────────
function createPenguinMesh() {
  const group = new THREE.Group();

  // Shared materials (mutable for super mode)
  const M = {
    body:  new THREE.MeshLambertMaterial({ color: 0x1e1e38 }),
    belly: new THREE.MeshLambertMaterial({ color: 0xeef0f5 }),
    eye:   new THREE.MeshLambertMaterial({ color: 0xffffff }),
    pupil: new THREE.MeshLambertMaterial({ color: 0x111111 }),
    beak:  new THREE.MeshLambertMaterial({ color: 0xff9500 }),
    foot:  new THREE.MeshLambertMaterial({ color: 0xff9500 }),
    wing:  new THREE.MeshLambertMaterial({ color: 0x28284a }),
  };

  const add = (geo, mat, px, py, pz, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    group.add(m);
    return m;
  };

  // Body
  const body = add(new THREE.SphereGeometry(0.48, 14, 10), M.body,  0,     0.04,  0,   1, 1.35, 1);

  // Belly (front-facing white patch)
  const belly = add(new THREE.SphereGeometry(0.31, 10, 8),  M.belly, 0,    -0.02, 0.32, 1, 1.15, 0.7);

  // Head
  const head = add(new THREE.SphereGeometry(0.335, 12, 10), M.body,  0,     0.67,  0.04);

  // Eyes
  const eyeL = add(new THREE.SphereGeometry(0.074, 8, 8), M.eye,   -0.145, 0.73,  0.27);
  const eyeR = add(new THREE.SphereGeometry(0.074, 8, 8), M.eye,    0.145, 0.73,  0.27);
  add(new THREE.SphereGeometry(0.043, 6, 6), M.pupil, -0.145, 0.73,  0.33);
  add(new THREE.SphereGeometry(0.043, 6, 6), M.pupil,  0.145, 0.73,  0.33);
  // Eye shines
  add(new THREE.SphereGeometry(0.018, 5, 5), M.eye,   -0.13, 0.76,  0.355);
  add(new THREE.SphereGeometry(0.018, 5, 5), M.eye,    0.16, 0.76,  0.355);

  // Beak (cone pointing +Z toward camera)
  const beak = add(
    new THREE.ConeGeometry(0.075, 0.19, 8), M.beak,
    0, 0.62, 0.44,
    1, 1, 1,
    -Math.PI / 2, 0, 0
  );

  // Wings
  const wingL = add(new THREE.BoxGeometry(0.14, 0.50, 0.22), M.wing, -0.57, 0.02,  0,   1, 1, 1, 0, 0,  0.18);
  const wingR = add(new THREE.BoxGeometry(0.14, 0.50, 0.22), M.wing,  0.57, 0.02,  0,   1, 1, 1, 0, 0, -0.18);

  // Feet
  const footL = add(new THREE.BoxGeometry(0.20, 0.07, 0.26), M.foot, -0.18, -0.58,  0.06);
  const footR = add(new THREE.BoxGeometry(0.20, 0.07, 0.26), M.foot,  0.18, -0.58,  0.06);

  // Tail nub (small white bump at back)
  add(new THREE.SphereGeometry(0.14, 6, 6), M.belly, 0, -0.1, -0.38, 1, 0.7, 0.7);

  group._M     = M;
  group._parts = { body, belly, head, eyeL, eyeR, beak, wingL, wingR, footL, footR };
  return group;
}

// ── Player ─────────────────────────────────────────────────────────────
class Player {
  constructor(scene) {
    this.scene    = scene;

    // Position
    this.x        = FIELD_CENTER;
    this.baseY    = 0.62;  // standing height of group origin above ground
    this.jumpH    = 0;

    // Horizontal free movement
    this.vx         = 0;
    this.moveSpeed  = 7.5;  // units/sec
    this.friction   = 14;
    this.movingLeft  = false;
    this.movingRight = false;

    // Jump
    this.jumping        = false;
    this.jumpT          = 0;
    this.jumpDur        = 0.50;
    this.doubleJumpUsed = false;

    // Slide
    this.sliding  = false;
    this.slideT   = 0;
    this.slideDur = 0.42;

    // Super mode
    this.superMode  = false;
    this.superTimer = 0;
    this.superDur   = 5;

    // Fish gauge
    this.fishCount = 0;

    // Death
    this.dead      = false;
    this.deadTimer = 0;
    this.deathAnim = 0;

    // Running animation clock
    this.runT = 0;

    // Build mesh
    this.mesh  = createPenguinMesh();
    this._M    = this.mesh._M;
    this._parts = this.mesh._parts;
    this.mesh.position.set(0, this.baseY, 0);
    scene.add(this.mesh);

    // Shadow caster (blob under player)
    const blobGeo = new THREE.CircleGeometry(0.4, 12);
    const blobMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false,
    });
    this._blob = new THREE.Mesh(blobGeo, blobMat);
    this._blob.rotation.x = -Math.PI / 2;
    this._blob.position.set(0, 0.01, 0);
    scene.add(this._blob);
  }

  // ── Hitbox (sphere) ──────────────────────────────────────────────────
  getHitbox() {
    const r = this.sliding ? 0.38 : 0.50;
    return { x: this.x, y: this.baseY + this.jumpH, z: 0, r };
  }

  // ── Input ────────────────────────────────────────────────────────────
  moveLeft()  { this.movingLeft  = true; }
  moveRight() { this.movingRight = true; }
  stopLeft()  { this.movingLeft  = false; }
  stopRight() { this.movingRight = false; }

  jump() {
    if (this.dead) return;
    if (!this.jumping) {
      this.jumping = true; this.jumpT = 0; this.doubleJumpUsed = false;
    } else if (!this.doubleJumpUsed) {
      this.jumpT = 0; this.doubleJumpUsed = true;
    }
  }

  slide() {
    if (this.dead || this.jumping || this.sliding) return;
    this.sliding = true; this.slideT = 0;
  }

  // ── Power-ups ────────────────────────────────────────────────────────
  activateSuper() {
    this.superMode  = true;
    this.superTimer = this.superDur;
    this._M.body.color.set(0x2244aa);
    this._M.body.emissive.set(0x00112a);
    this._M.belly.color.set(0xffe866);
    this._M.wing.color.set(0x112266);
  }

  _deactivateSuper() {
    this.superMode = false;
    this._M.body.color.set(0x1e1e38);
    this._M.body.emissive.set(0x000000);
    this._M.belly.color.set(0xeef0f5);
    this._M.wing.color.set(0x28284a);
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
    this.dead = true;
    this.movingLeft = this.movingRight = false;
    return true;
  }

  // ── Update ───────────────────────────────────────────────────────────
  update(dt) {
    if (this.dead) {
      this.deadTimer += dt;
      this.deathAnim  = Math.min(1, this.deathAnim + dt * 2.5);
      this.mesh.rotation.z  = this.deathAnim * Math.PI * 0.75;
      this.mesh.position.y  = this.baseY - this.deathAnim * 0.5;
      this._blob.visible    = false;
      return;
    }

    // Horizontal movement
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
        this.jumpH = Math.sin(p * Math.PI) * (this.doubleJumpUsed ? 1.5 : 2.6);
      }
    }

    // Slide
    if (this.sliding) {
      this.slideT += dt;
      if (this.slideT >= this.slideDur) { this.sliding = false; this.slideT = 0; }
    }

    // Super mode timer
    if (this.superMode) {
      this.superTimer -= dt;
      if (this.superTimer <= 0) this._deactivateSuper();
    }

    // ── Animation ────────────────────────────────────────────────────
    const moveFrac = Math.abs(this.vx) / this.moveSpeed;
    this.runT += dt * (5 + moveFrac * 7);

    const p = this._parts;

    // Body lean (Z rotation based on horizontal velocity)
    const lean = clamp(this.vx / this.moveSpeed, -1, 1) * 0.22;
    this.mesh.rotation.z = lean;

    // Body bob while running
    const bobY = this.sliding ? 0 : Math.abs(Math.sin(this.runT * 2)) * 0.04 * moveFrac;

    // Slide squash
    const sY = this.sliding ? 0.5 : 1.0;
    const sX = this.sliding ? 1.4 : 1.0;
    this.mesh.scale.set(sX, sY, 1);

    // Update world position
    this.mesh.position.set(this.x, this.baseY + this.jumpH + bobY, 0);

    // Feet alternation (X rotation = forward/back step)
    const footAmp = this.sliding ? 0 : 0.45 * (0.3 + moveFrac * 0.7);
    p.footL.rotation.x =  Math.sin(this.runT) * footAmp;
    p.footR.rotation.x = -Math.sin(this.runT) * footAmp;

    // Wing animation
    if (this.jumping) {
      // Spread wings upward on jump
      const wFlap = Math.sin(this.jumpT * 14) * 0.18;
      p.wingL.rotation.z =  0.18 - 0.5 + wFlap;
      p.wingR.rotation.z = -0.18 + 0.5 - wFlap;
    } else {
      // Gentle swing while running
      const wSwing = Math.sin(this.runT) * 0.10 * moveFrac;
      p.wingL.rotation.z =  0.18 + wSwing;
      p.wingR.rotation.z = -0.18 - wSwing;
    }

    // Head bob
    p.head.position.y = 0.67 + Math.sin(this.runT * 2) * 0.015 * moveFrac;

    // Blob shadow (fades as player jumps)
    const shadowAlpha = Math.max(0, 0.22 * (1 - this.jumpH / 2.8));
    this._blob.material.opacity = shadowAlpha;
    this._blob.scale.setScalar(1 - this.jumpH * 0.12);
    this._blob.position.set(this.x, 0.01, 0);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this._blob);
  }
}
