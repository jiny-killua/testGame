class Item {
  constructor(type, x, y) {
    this.type  = type;  // 'fish_s' | 'fish_l' | 'star' | 'magnet'
    this.x     = x;
    this.y     = y;
    this.alive = true;
    this.animT = Math.random() * Math.PI * 2;
    this.r     = type === 'fish_l' ? 18 : 15;

    this.collected   = false;
    this.collectAnim = 0;
  }

  update(dt, speed) {
    this.y     += speed * dt;
    this.animT += dt * 4;
    if (this.collected) this.collectAnim += dt * 5;
  }

  draw(ctx) {
    if (this.collected && this.collectAnim > 1) return;
    const bob   = Math.sin(this.animT) * 4;
    const alpha = this.collected ? Math.max(0, 1 - this.collectAnim) : 1;
    const scale = this.collected ? (1 + this.collectAnim * 0.5) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y + bob);
    ctx.scale(scale, scale);

    switch (this.type) {
      case 'fish_s': this._drawFish(ctx, false); break;
      case 'fish_l': this._drawFish(ctx, true);  break;
      case 'star':   this._drawStar(ctx);         break;
      case 'magnet': this._drawMagnet(ctx);       break;
    }
    ctx.restore();
  }

  _drawFish(ctx, big) {
    const s = big ? 1.4 : 1;
    ctx.save(); ctx.scale(s, s);
    ctx.shadowColor = big ? '#ffaa00' : '#66ccff'; ctx.shadowBlur = 10;
    ctx.fillStyle = big ? '#ff8800' : '#4488ff';
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(20,-8); ctx.lineTo(20,8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-6,-2,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-5,-2,1.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(2,0,6,-1,1); ctx.stroke();
    ctx.beginPath(); ctx.arc(8,0,6,-1,1); ctx.stroke();
    ctx.restore();
  }

  _drawStar(ctx) {
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffdd00'; ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 1.5;
    this._starPath(ctx, 0, 0, 16, 8, 5);
    ctx.fill(); ctx.stroke();
  }

  _drawMagnet(ctx) {
    ctx.shadowColor = '#ff44aa'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff44aa'; ctx.strokeStyle = '#cc0088'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0,-4,12,Math.PI,0);
    ctx.lineTo(12,8); ctx.lineTo(7,8); ctx.lineTo(7,-4);
    ctx.arc(0,-4,7,0,Math.PI,true);
    ctx.lineTo(-7,8); ctx.lineTo(-12,8); ctx.lineTo(-12,-4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f00'; ctx.fillRect(-14,6,6,6);
    ctx.fillStyle = '#00f'; ctx.fillRect( 8, 6,6,6);
  }

  _starPath(ctx, x, y, outerR, innerR, pts) {
    ctx.beginPath();
    for (let i = 0; i < pts*2; i++) {
      const r     = i%2===0 ? outerR : innerR;
      const angle = (i*Math.PI)/pts - Math.PI/2;
      i===0 ? ctx.moveTo(x+r*Math.cos(angle), y+r*Math.sin(angle))
            : ctx.lineTo(x+r*Math.cos(angle), y+r*Math.sin(angle));
    }
    ctx.closePath();
  }
}

// ─── ItemManager ────────────────────────────────────────────────────────

class ItemManager {
  constructor() {
    this.items        = [];
    this.timer        = 0;
    this.nextSpawn    = 2.5;
    this.magnetActive = false;
    this.magnetTimer  = 0;
  }

  reset() {
    this.items        = [];
    this.timer        = 0;
    this.nextSpawn    = 2.5;
    this.magnetActive = false;
    this.magnetTimer  = 0;
  }

  _spawnItem() {
    const x    = randFloat(FIELD_LEFT + 20, FIELD_RIGHT - 20);
    const roll = Math.random();
    let type;
    if      (roll < 0.45) type = 'fish_s';
    else if (roll < 0.72) type = 'fish_l';
    else if (roll < 0.88) type = 'star';
    else                  type = 'magnet';
    this.items.push(new Item(type, x, -60));
  }

  update(dt, speed) {
    this.timer += dt;
    if (this.timer >= this.nextSpawn) {
      this.timer     = 0;
      this.nextSpawn = 2.0 + Math.random() * 2.0;
      this._spawnItem();
    }
    if (this.magnetActive) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) this.magnetActive = false;
    }
    for (const item of this.items) item.update(dt, speed);
    this.items = this.items.filter(i => i.y < CANVAS_H + 80 && !(i.collected && i.collectAnim > 1));
  }

  checkCollect(player) {
    const results = [];
    const phb = player.getHitbox();

    for (const item of this.items) {
      if (item.collected) continue;
      let collected = false;

      if (this.magnetActive) {
        const dx = player.x - item.x, dy = player.y - item.y;
        if (dx*dx + dy*dy < 100*100) collected = true;
      }
      if (!collected) {
        const r = item.r;
        if (aabb(phb.x,phb.y,phb.w,phb.h, item.x-r,item.y-r, r*2,r*2)) collected = true;
      }
      if (collected) {
        item.collected = true;
        results.push(item.type);
        if (item.type === 'magnet') { this.magnetActive = true; this.magnetTimer = 5; }
      }
    }
    return results;
  }

  draw(ctx) {
    for (const item of this.items) item.draw(ctx);
  }
}
