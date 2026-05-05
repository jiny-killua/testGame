class Background {
  constructor() {
    // 5 columns give a natural brick/tile texture without lane semantics
    this.colCount = 5;
    this.colW     = CANVAS_W / this.colCount;  // 96
    this.tileH    = 90;
    this.tiles    = [];
    this.particles = [];
    this.offsetY  = 0;

    const rows = Math.ceil(CANVAS_H / this.tileH) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < this.colCount; c++) {
        this.tiles.push({ col: c, row: r, y: (r-1) * this.tileH });
      }
    }

    for (let i = 0; i < 70; i++) this.particles.push(this._newParticle(true));
  }

  _newParticle(randomY = false) {
    return {
      x:     Math.random() * CANVAS_W,
      y:     randomY ? Math.random() * CANVAS_H : -6,
      r:     Math.random() * 2.5 + 0.5,
      speed: Math.random() * 50 + 30,
      alpha: Math.random() * 0.5 + 0.2,
    };
  }

  update(dt, speed) {
    this.offsetY += speed * dt;
    const totalRows = Math.ceil(CANVAS_H / this.tileH) + 2;

    for (const t of this.tiles) {
      t.y = ((t.row * this.tileH - this.tileH + this.offsetY) % (totalRows * this.tileH));
      if (t.y < -this.tileH) t.y += totalRows * this.tileH;
    }

    for (const p of this.particles) {
      p.y += (p.speed + speed * 0.25) * dt;
      if (p.y > CANVAS_H + 5) Object.assign(p, this._newParticle(false));
    }
  }

  draw(ctx) {
    // Base sky
    ctx.fillStyle = '#c0e4f5';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Ice tiles — alternating subtle shades across 5 columns (no lane dividers)
    const palettes = [
      ['#d8f0fa', '#cce9f6'],
      ['#d2ecf8', '#c6e5f3'],
      ['#daf2fc', '#cdeaf7'],
      ['#cce8f5', '#c0e2f2'],
      ['#d6eef9', '#caebf6'],
    ];
    for (const t of this.tiles) {
      const [c1, c2] = palettes[t.col % palettes.length];
      const g = ctx.createLinearGradient(t.col*this.colW, t.y, t.col*this.colW, t.y+this.tileH);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.fillRect(t.col*this.colW, t.y, this.colW, this.tileH);

      // Subtle crack texture
      ctx.strokeStyle = 'rgba(180,220,240,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(t.col*this.colW + 14, t.y + 18);
      ctx.lineTo(t.col*this.colW + 44, t.y + 42);
      ctx.stroke();
    }

    // Field border walls (left / right edges)
    ctx.strokeStyle = 'rgba(80,150,200,0.85)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 0, CANVAS_W-4, CANVAS_H);

    // Snow particles
    ctx.fillStyle = '#ffffff';
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
