// Mobile button layout constants (canvas coords)
const BTN_Y  = CANVAS_H - 118;  // top of button row
const BTN_H  = 110;
const BTN_W  = CANVAS_W / 3 - 10;

class UI {
  constructor() {
    this.particles = [];  // score pop-ups
    this.titleAnim = 0;
    this.goAnim    = 0;
  }

  addScorePop(x, y, text, color = '#ffdd00') {
    this.particles.push({ x, y, text, color, vy: -60, life: 1.0, alpha: 1 });
  }

  update(dt) {
    this.titleAnim += dt;
    this.goAnim    += dt;
    for (const p of this.particles) {
      p.y    += p.vy * dt;
      p.life -= dt * 1.5;
      p.alpha = Math.max(0, p.life);
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  // ── HUD ──────────────────────────────────────────────────────────────

  drawHUD(ctx, score, best, level, fishCount, superMode, superTimer, magnetActive, magnetTimer) {
    // Top bar
    ctx.fillStyle = 'rgba(10,20,40,0.75)';
    this._roundRect(ctx, 8, 8, CANVAS_W-16, 64, 10); ctx.fill();

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    ctx.fillText('SCORE', 22, 28);
    ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ffdd44';
    ctx.fillText(score.toLocaleString(), 22, 52);

    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#aaaacc'; ctx.textAlign = 'center';
    ctx.fillText('BEST', CANVAS_W/2, 28);
    ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#66eebb';
    ctx.fillText(best.toLocaleString(), CANVAS_W/2, 52);

    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#aaaacc'; ctx.textAlign = 'right';
    ctx.fillText('LEVEL', CANVAS_W-22, 28);
    ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ff9966';
    ctx.fillText(level, CANVAS_W-22, 52);

    // Fish gauge (above mobile buttons area)
    this._drawFishGauge(ctx, fishCount, superMode, superTimer);

    // Active item timers
    const timerY = BTN_Y - 16;
    if (magnetActive) {
      ctx.fillStyle = '#ff44aa'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`🧲 ${magnetTimer.toFixed(1)}s`, 12, timerY);
    }
    if (superMode) {
      ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`⭐ SUPER ${superTimer.toFixed(1)}s`, CANVAS_W-12, timerY);
    }

    // Score pop-ups
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }

    // Mobile buttons (always visible — keyboard works regardless)
    this._drawMobileButtons(ctx);
  }

  _drawFishGauge(ctx, count, superMode, superTimer) {
    const gx = 12, gy = BTN_Y - 48;
    ctx.fillStyle = 'rgba(10,20,40,0.7)';
    this._roundRect(ctx, gx, gy, 132, 34, 8); ctx.fill();

    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('🐟 게이지', gx+8, gy+13);

    if (superMode) {
      const prog = superTimer / 5;
      ctx.fillStyle = '#333';
      this._roundRect(ctx, gx+8, gy+18, 112, 10, 4); ctx.fill();
      const g = ctx.createLinearGradient(gx+8,0,gx+120,0);
      g.addColorStop(0,'#ffdd00'); g.addColorStop(1,'#ff8800');
      ctx.fillStyle = g;
      this._roundRect(ctx, gx+8, gy+18, 112*prog, 10, 4); ctx.fill();
    } else {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < count ? '#ff8844' : 'rgba(255,255,255,0.15)';
        ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('🐟', gx+10+i*22, gy+28);
      }
    }
  }

  _drawMobileButtons(ctx) {
    const btnAlpha = 0.55;
    ctx.save();
    ctx.globalAlpha = btnAlpha;

    // Shared background strip
    ctx.fillStyle = 'rgba(5,15,35,0.45)';
    ctx.fillRect(0, BTN_Y - 4, CANVAS_W, BTN_H + 8);

    // ◀ Left
    ctx.fillStyle = 'rgba(68,180,255,0.25)';
    this._roundRect(ctx, 5, BTN_Y, BTN_W, BTN_H, 12); ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ccecff';
    ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◀', CANVAS_W/6, BTN_Y + BTN_H/2);

    // ▶ Right
    ctx.globalAlpha = btnAlpha;
    ctx.fillStyle = 'rgba(68,180,255,0.25)';
    this._roundRect(ctx, CANVAS_W*2/3+5, BTN_Y, BTN_W, BTN_H, 12); ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ccecff';
    ctx.fillText('▶', CANVAS_W*5/6, BTN_Y + BTN_H/2);

    // ↑ Jump / Slide
    ctx.globalAlpha = btnAlpha;
    ctx.fillStyle = 'rgba(80,220,80,0.22)';
    this._roundRect(ctx, CANVAS_W/3+5, BTN_Y, BTN_W, BTN_H, 12); ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ccffcc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('JUMP', CANVAS_W/2, BTN_Y + BTN_H/2 - 10);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#aaddaa'; ctx.font = '11px sans-serif';
    ctx.fillText('길게 → 슬라이드', CANVAS_W/2, BTN_Y + BTN_H/2 + 18);

    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  // ── Screens ───────────────────────────────────────────────────────────

  drawTitle(ctx) {
    const t = this.titleAnim;
    ctx.fillStyle = 'rgba(5,15,35,0.88)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Drifting snowflakes
    ctx.fillStyle = 'rgba(200,230,255,0.25)';
    for (let i = 0; i < 20; i++) {
      const x = (i*71 + t*20) % CANVAS_W;
      const y = (i*53 + t*15) % CANVAS_H;
      ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('❄', x, y);
    }

    // Logo
    const pulse = Math.sin(t*2)*3;
    ctx.save();
    ctx.shadowColor = '#66eeff'; ctx.shadowBlur = 20+pulse;
    ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🐧', CANVAS_W/2, 200+Math.sin(t*1.5)*8);
    ctx.restore();

    ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#eef8ff';
    ctx.fillText('Jiny펭귄', CANVAS_W/2, 280);
    ctx.restore();

    ctx.font = '16px sans-serif'; ctx.fillStyle = '#88ccee';
    ctx.fillText('프리 무브 엔드리스 러너', CANVAS_W/2, 310);

    // Start button
    const btnAlpha = (Math.sin(t*3)+1)/2*0.4+0.6;
    ctx.save();
    ctx.globalAlpha = btnAlpha;
    ctx.fillStyle = '#44ccff';
    this._roundRect(ctx, CANVAS_W/2-100, 360, 200, 52, 12); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#003344';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('게임 시작', CANVAS_W/2, 393);
    ctx.restore();

    // Controls guide
    ctx.fillStyle = 'rgba(200,220,240,0.7)';
    ctx.font = '14px sans-serif';
    const controls = [
      '← → (또는 A/D) : 좌우 이동 (누른 만큼)',
      '↑ / Space : 점프   (공중에서 한 번 더 → 2단점프)',
      '↓ / S : 슬라이드',
    ];
    controls.forEach((c, i) => ctx.fillText(c, CANVAS_W/2, 455+i*26));

    ctx.fillStyle = 'rgba(150,190,220,0.5)'; ctx.font = '12px sans-serif';
    ctx.fillText('물고기 5개 수집 → 슈퍼 Jiny 변신!', CANVAS_W/2, 548);
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(5,15,35,0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('일시정지', CANVAS_W/2, CANVAS_H/2-30);
    ctx.font = '18px sans-serif'; ctx.fillStyle = '#88ccee';
    ctx.fillText('P / ESC 키로 재개', CANVAS_W/2, CANVAS_H/2+20);
  }

  drawGameOver(ctx, score, best, isNewBest) {
    const t = this.goAnim;
    ctx.fillStyle = 'rgba(5,10,25,0.9)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = 'rgba(20,40,80,0.95)'; ctx.strokeStyle = '#336699'; ctx.lineWidth = 2;
    this._roundRect(ctx, 60, 180, CANVAS_W-120, 320, 18); ctx.fill(); ctx.stroke();

    ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6666';
    ctx.save(); ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 12;
    ctx.fillText('GAME OVER', CANVAS_W/2, 240);
    ctx.restore();

    ctx.font = '52px sans-serif';
    ctx.fillText('🐧', CANVAS_W/2, 300);

    if (isNewBest) {
      ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🎉 신기록!', CANVAS_W/2, 340);
    }
    ctx.fillStyle = '#aaccee'; ctx.font = '16px sans-serif';
    ctx.fillText('점수',    CANVAS_W/2-70, 368);
    ctx.fillText('최고 기록', CANVAS_W/2+70, 368);

    ctx.fillStyle = '#ffdd44'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(score.toLocaleString(), CANVAS_W/2-70, 398);
    ctx.fillStyle = '#66eebb';
    ctx.fillText(best.toLocaleString(), CANVAS_W/2+70, 398);

    this._drawButton(ctx, CANVAS_W/2-90, 440, 160, 48, '다시 시작', '#44ccff', '#003344');
    this._drawButton(ctx, CANVAS_W/2+80, 440, 100, 48, '메인으로',  '#667799', '#eef0f5');

    ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(150,180,210,0.6)';
    ctx.fillText('Space / Enter 키로 재시작', CANVAS_W/2, 510);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  _drawButton(ctx, x, y, w, h, label, bg, fg) {
    ctx.fillStyle = bg;
    this._roundRect(ctx, x-w/2, y, w, h, 10); ctx.fill();
    ctx.fillStyle = fg; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x, y+h/2+6);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y,   x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);   ctx.quadraticCurveTo(x,   y+h, x,   y+h-r);
    ctx.lineTo(x, y+r);     ctx.quadraticCurveTo(x,   y,   x+r, y);
    ctx.closePath();
  }

  getGameOverClick(mx, my) {
    const rx=CANVAS_W/2-90, ry=440, rw=160, rh=48;
    if (mx>=rx-rw/2 && mx<=rx+rw/2 && my>=ry && my<=ry+rh) return 'restart';
    const mx2=CANVAS_W/2+80, my2=440, mw=100, mh=48;
    if (mx>=mx2-mw/2 && mx<=mx2+mw/2 && my>=my2 && my<=my2+mh) return 'title';
    return null;
  }

  getTitleClick(mx, my) {
    if (mx>=CANVAS_W/2-100 && mx<=CANVAS_W/2+100 && my>=360 && my<=412) return 'start';
    return null;
  }
}
