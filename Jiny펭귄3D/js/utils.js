// ── Field boundaries (world X units) ──────────────────────────────────
const FIELD_LEFT   = -4.2;
const FIELD_RIGHT  =  4.2;
const FIELD_CENTER =  0;

// ── Game states ────────────────────────────────────────────────────────
const STATE = {
  TITLE:    'TITLE',
  PLAYING:  'PLAYING',
  PAUSED:   'PAUSED',
  GAMEOVER: 'GAMEOVER',
};

// ── Math helpers ───────────────────────────────────────────────────────
function lerp(a, b, t)     { return a + (b - a) * t; }
function clamp(v, lo, hi)  { return Math.max(lo, Math.min(hi, v)); }
function randFloat(lo, hi) { return Math.random() * (hi - lo) + lo; }
function randInt(lo, hi)   { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
function randItem(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Sphere vs Sphere collision ─────────────────────────────────────────
function sphereVsSphere(ax, ay, az, ar, bx, by, bz, br) {
  const dx = ax-bx, dy = ay-by, dz = az-bz;
  const r  = ar + br;
  return dx*dx + dy*dy + dz*dz < r*r;
}

// ── AABB vs AABB (for obstacle boxes) ─────────────────────────────────
function aabbCheck(aPos, aSize, bPos, bSize) {
  return Math.abs(aPos.x - bPos.x) < (aSize.x + bSize.x) / 2 &&
         Math.abs(aPos.y - bPos.y) < (aSize.y + bSize.y) / 2 &&
         Math.abs(aPos.z - bPos.z) < (aSize.z + bSize.z) / 2;
}
