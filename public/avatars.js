import * as THREE from 'three';

const CAPACITY = 160;
const JACKETS = ['#986957', '#547e78', '#5c6989', '#a4724b', '#8c606f', '#657557'];
const SCARVES = ['#d38a65', '#e9bf79', '#b97166', '#95b4ab', '#d5a0a0', '#bbc8d2'];
const SKIN = ['#c88e70', '#e1ab88', '#e9b99d', '#b98063', '#dca182'];
const HAIR = ['#382d2c', '#40322e', '#302d31', '#55403a'];
const TRIM = '#e4d8c1';

function hashId(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

function lathe(points) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 14);
}

function makeShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(33,37,64,0.44)');
  gradient.addColorStop(0.65, 'rgba(33,37,64,0.25)');
  gradient.addColorStop(1, 'rgba(33,37,64,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createAvatars(scene) {
  const cloth = new THREE.MeshStandardMaterial({ roughness: 0.93 });
  const softShadow = makeShadowTexture();
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: softShadow, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const shapes = {};
  const color = new THREE.Color();
  function batch(key, geometry, perPerson, material = cloth) {
    const mesh = new THREE.InstancedMesh(geometry, material, CAPACITY * perPerson);
    mesh.name = 'Winter avatars / ' + key;
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (material === cloth) {
      mesh.setColorAt(0, color.set('#ffffff'));
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    scene.add(mesh);
    shapes[key] = mesh;
  }
  batch('shadow', new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), 1, shadowMaterial);
  batch('round', new THREE.SphereGeometry(1, 12, 9), 23);
  batch('fold', new THREE.BoxGeometry(1, 1, 1), 7);
  batch('parka', lathe([[0, 0], [.255, 0], [.272, .035], [.258, .26],
    [.23, .48], [.19, .52], [.10, .53], [0, .53]]), 1);
  batch('beanie', lathe([[0, 0], [.203, 0], [.209, .045], [.196, .11],
    [.157, .173], [.093, .204], [.024, .215], [0, .215]]), 1);
  batch('collar', lathe([[0, 0], [.19, 0], [.207, .032], [.201, .092],
    [.168, .113], [0, .113]]), 1);

  const local = new THREE.Object3D();
  const root = new THREE.Object3D();
  const transform = new THREE.Matrix4();
  const states = new Map();
  let frame = 0;

  function piece(key, x, y, z, sx, sy, sz, tone, rx = 0, ry = 0, rz = 0) {
    const mesh = shapes[key];
    const slot = mesh.count++;
    local.position.set(x, y, z);
    local.rotation.set(rx, ry, rz, 'XYZ');
    local.scale.set(sx, sy, sz);
    local.updateMatrix();
    transform.multiplyMatrices(root.matrix, local.matrix);
    mesh.setMatrixAt(slot, transform);
    if (tone !== null) mesh.setColorAt(slot, color.set(tone));
  }

  function render(players, dt = 0.016) {
    frame++;
    for (const mesh of Object.values(shapes)) mesh.count = 0;
    const seconds = Math.min(0.1, Math.max(0, dt));
    for (let i = 0; i < players.length && i < CAPACITY; i++) {
      const p = players[i];
      let s = states.get(p.id);
      if (!s) {
        const hash = hashId(p.id);
        s = { hash, phase: (hash % 4096) / 650, gait: 0 };
        states.set(p.id, s);
      }
      s.frame = frame;
      s.gait += ((p.moving ? 1 : 0) - s.gait) * (1 - Math.exp(-13 * seconds));
      s.phase = (s.phase + seconds * 9.4 * s.gait) % (Math.PI * 2);
      const stride = Math.sin(s.phase) * s.gait;
      const bounce = Math.abs(Math.cos(s.phase)) * s.gait * .034;
      const jacket = p.color ?? JACKETS[s.hash % JACKETS.length];
      const scarf = SCARVES[(s.hash >>> 7) % SCARVES.length];
      const skin = SKIN[(s.hash >>> 13) % SKIN.length];
      const hair = HAIR[(s.hash >>> 18) % HAIR.length];
      const size = .96 + ((s.hash >>> 23) % 10) * .008;
      root.position.set(p.x, 0, p.z);
      root.rotation.set(0, p.yaw || 0, 0);
      root.scale.setScalar(size);
      root.updateMatrix();

      piece('shadow', 0, .023, .012, .87, 1, .66, null);
      for (const side of [-1, 1]) {
        const swing = stride * .47 * side;
        const lx = side * .105;
        piece('round', lx, .336 + bounce * .35, -.15 * Math.sin(swing),
          .084, .225, .082, '#364456', swing);
        piece('round', lx, .096 + .22 * (1 - Math.cos(swing)), -.06 - .32 * Math.sin(swing),
          .1, .101, .151, '#483a38', swing * .16);
        const arm = -swing * .85;
        const shoulder = 1.00 + bounce;
        piece('round', side * .245, shoulder - .115 * Math.cos(arm),
          -.115 * Math.sin(arm), .091, .195, .092, jacket, arm, 0, side * .085);
        piece('round', side * .273, shoulder - .285 * Math.cos(arm),
          -.285 * Math.sin(arm), .068, .085, .069, scarf, arm);
      }

      piece('parka', 0, .535 + bounce, 0, 1, 1, .78, jacket);
      piece('fold', 0, .797 + bounce, -.197, .014, .44, .009, '#534746');
      for (const side of [-1, 1]) {
        piece('fold', side * .159, .743 + bounce, -.157, .082, .02, .018, jacket, 0, side * -.48, side * .18);
      }
      piece('round', 0, 1.043 + bounce, .076, .213, .106, .156, jacket);
      piece('fold', -.104, .964 + bounce, .152, .103, .24, .032, scarf, -.14, 0, -.14);
      piece('collar', 0, 1.041 + bounce, -.004, 1, 1, .86, scarf);
      piece('fold', .104, .987 + bounce, -.151, .09, .174, .034, scarf, -.16, 0, -.15);
      piece('round', 0, 1.265 + bounce, -.006, .173, .186, .158, skin);
      piece('round', 0, 1.319 + bounce, .032, .181, .153, .149, hair);
      for (const side of [-1, 1]) {
        piece('round', side * .155, 1.254 + bounce, -.013, .038, .051, .027, skin);
        piece('round', side * .064, 1.270 + bounce, -.153, .011, .014, .008, '#352d2e');
      }
      piece('round', 0, 1.242 + bounce, -.162, .025, .025, .032, skin);
      piece('beanie', 0, 1.337 + bounce, .005, 1, .94, .91, scarf);
      piece('round', 0, 1.354 + bounce, .005, .210, .054, .193, scarf);
      piece('round', 0, 1.537 + bounce, .022, .063, .061, .062, TRIM);
    }
    for (const [id, s] of states) if (s.frame !== frame) states.delete(id);
    for (const mesh of Object.values(shapes)) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  function dispose() {
    for (const mesh of Object.values(shapes)) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.dispose();
    }
    softShadow.dispose();
    cloth.dispose();
    shadowMaterial.dispose();
    states.clear();
  }
  return { render, dispose };
}
