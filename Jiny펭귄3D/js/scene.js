// ── Renderer ───────────────────────────────────────────────────────────
function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xb8dff5);
  return renderer;
}

// ── Scene + Fog ────────────────────────────────────────────────────────
function createScene() {
  const scene = new THREE.Scene();
  scene.fog   = new THREE.Fog(0xb8dff5, 22, 75);
  return scene;
}

// ── Lights ─────────────────────────────────────────────────────────────
function createLights(scene) {
  // Soft sky ambient
  const ambient = new THREE.AmbientLight(0xcce8ff, 0.75);
  scene.add(ambient);

  // Directional sun (with shadow)
  const sun = new THREE.DirectionalLight(0xfff8e8, 1.15);
  sun.position.set(6, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near   =  0.5;
  sun.shadow.camera.far    =  80;
  sun.shadow.camera.left   = -18;
  sun.shadow.camera.right  =  18;
  sun.shadow.camera.top    =  18;
  sun.shadow.camera.bottom = -10;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Subtle fill from opposite side (no shadow)
  const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
  fill.position.set(-6, 5, -8);
  scene.add(fill);

  return { ambient, sun, fill };
}

// ── Camera ─────────────────────────────────────────────────────────────
function createCamera() {
  const cam = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  cam.position.set(0, 4.5, 9);
  cam.lookAt(0, 0.5, -3);
  return cam;
}

// ── Snow particles ─────────────────────────────────────────────────────
function createSnow(scene) {
  const COUNT = 700;
  const pos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   = randFloat(-11, 11);
    pos[i*3+1] = randFloat(0, 18);
    pos[i*3+2] = randFloat(-45, 12);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat  = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.09,
    transparent: true, opacity: 0.72,
    depthWrite: false,
  });
  const snow = new THREE.Points(geo, mat);
  scene.add(snow);
  return snow;
}

function updateSnow(snow, dt, speed) {
  const pos  = snow.geometry.attributes.position.array;
  const fall = (0.8 + speed * 0.04) * dt;

  for (let i = 0; i < pos.length; i += 3) {
    pos[i+1] -= fall;
    pos[i+2] += speed * dt * 0.08;
    pos[i]   += Math.sin(Date.now() * 0.0008 + i) * 0.008;

    if (pos[i+1] < -0.5) {
      pos[i]   = randFloat(-11, 11);
      pos[i+1] = randFloat(14, 20);
      pos[i+2] = randFloat(-45, 12);
    }
    if (pos[i+2] > 13) pos[i+2] -= 58;
  }
  snow.geometry.attributes.position.needsUpdate = true;
}
