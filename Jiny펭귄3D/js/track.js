class Track {
  constructor(scene) {
    this.scene     = scene;
    this.tileLen   = 20;   // Z length per tile
    this.tileCount = 9;    // pool size → covers 180 units
    this.fieldW    = 9.4;  // X width of track
    this.tiles     = [];

    // Two alternating ice colors
    const mat = [
      new THREE.MeshLambertMaterial({ color: 0xc4e2f4 }),
      new THREE.MeshLambertMaterial({ color: 0xb8d9f0 }),
    ];
    const geo = new THREE.BoxGeometry(this.fieldW, 0.28, this.tileLen);

    for (let i = 0; i < this.tileCount; i++) {
      const mesh = new THREE.Mesh(geo, mat[i % 2]);
      // Start: tile 0 at z = +tileLen (behind camera), rest spread forward
      mesh.position.set(0, -0.14, -(i - 1) * this.tileLen);
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.tiles.push(mesh);
    }

    // Edge markers (thin raised strips on both sides)
    this._buildEdges(scene, mat[0]);

    // Distant background mountain silhouettes
    this._buildBackground(scene);
  }

  _buildEdges(scene, mat) {
    const edgeGeo = new THREE.BoxGeometry(0.18, 0.32, this.tileLen);
    const edgeMat = new THREE.MeshLambertMaterial({ color: 0x90c4e0 });
    this.edges = [];

    for (let i = 0; i < this.tileCount; i++) {
      const zBase = -(i - 1) * this.tileLen;
      [-1, 1].forEach(side => {
        const e = new THREE.Mesh(edgeGeo, edgeMat);
        e.position.set(side * this.fieldW / 2, 0.02, zBase);
        scene.add(e);
        this.edges.push({ mesh: e, side });
      });
    }
  }

  _buildBackground(scene) {
    // Simple distant iceberg/mountain shapes for depth
    const iceMat = new THREE.MeshLambertMaterial({ color: 0xd0eef8 });
    const positions = [
      [-12, 3, -55], [14, 5, -65], [-16, 4, -70],
      [12, 2, -45],  [-8, 6, -80], [18, 3, -50],
    ];
    positions.forEach(([x, h, z]) => {
      const geo  = new THREE.ConeGeometry(2.5 + Math.random(), h, 5);
      const mesh = new THREE.Mesh(geo, iceMat);
      mesh.position.set(x, h / 2 - 0.14, z);
      scene.add(mesh);
    });
  }

  update(dt, speed) {
    const move  = speed * dt;
    const total = this.tileLen * this.tileCount;
    const wrap  = this.tileLen * 1.6; // wrap threshold

    for (const tile of this.tiles) {
      tile.position.z += move;
      if (tile.position.z > wrap) tile.position.z -= total;
    }

    for (const { mesh } of this.edges) {
      mesh.position.z += move;
      if (mesh.position.z > wrap) mesh.position.z -= total;
    }
  }
}
