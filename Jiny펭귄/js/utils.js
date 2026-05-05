const CANVAS_W = 480;
const CANVAS_H = 720;

// Free-move field boundaries (player center x clamp)
const FIELD_LEFT   = 50;
const FIELD_RIGHT  = 430;
const FIELD_CENTER = 240;

const STATE = { TITLE: 'TITLE', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };

function lerp(a, b, t)   { return a + (b - a) * t; }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function easeInOut(t)    { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

function randInt(min, max)    { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr)        { return arr[Math.floor(Math.random() * arr.length)]; }
function randFloat(min, max)  { return Math.random() * (max - min) + min; }
