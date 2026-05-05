class CameraController {
  constructor(camera) {
    this.cam       = camera;
    this.followX   = 8;   // lerp speed for horizontal tracking
    this.followY   = 4;   // lerp speed for vertical (jump) tracking
    this._lookAt   = new THREE.Vector3();
  }

  update(dt, playerX, jumpH) {
    const targetX = playerX;
    const targetY = 4.5 + jumpH * 0.4;   // camera rises slightly on jump

    this.cam.position.x = lerp(this.cam.position.x, targetX, Math.min(1, this.followX * dt));
    this.cam.position.y = lerp(this.cam.position.y, targetY, Math.min(1, this.followY * dt));
    this.cam.position.z = 9; // fixed depth

    // Look at a point ahead of player (in -Z direction)
    this._lookAt.set(playerX * 0.55, jumpH * 0.2, -3);
    this.cam.lookAt(this._lookAt);
  }
}
