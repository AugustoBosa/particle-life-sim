import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const PALETTE = [0xff4d4d, 0x4dff88, 0x4d8cff, 0xffd24d, 0xd24dff, 0x4dffff, 0xff8c4d, 0xffffff];

// sprite redondo com borda suave para os pontos 3D
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createRenderer(canvas, dims) {
  const is3d = dims === 3;
  // rastro: em vez de limpar, cada frame pinta um preto semitransparente por cima do anterior
  const renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true });
  renderer.autoClear = false;
  const fadeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthTest: false, depthWrite: false });
  const fadeScene = new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial));
  const fadeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  const scene = new THREE.Scene();
  const camera = is3d ? new THREE.PerspectiveCamera(50, 1, 0.01, 20) : new THREE.OrthographicCamera();
  const material = is3d
    ? new THREE.PointsMaterial({ size: 0.018, vertexColors: true, map: dotTexture(), transparent: true, depthWrite: false })
    : new THREE.PointsMaterial({ size: 3, vertexColors: true, sizeAttenuation: false });

  // 2D: o mundo é um toro, 3×3 cópias do mesmo geometry preenchem telas não quadradas sem distorcer.
  // 3D: uma cópia só, dentro do cubo.
  const offsets = is3d ? [[0, 0]] : [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => [x, y]));
  const tiles = offsets.map(([x, y]) => {
    const t = new THREE.Points(new THREE.BufferGeometry(), material);
    t.position.set(x, y, 0);
    t.frustumCulled = false; // as posições mudam todo frame; bounding sphere ficaria velha
    scene.add(t);
    return t;
  });

  let controls = null;
  if (is3d) {
    camera.position.set(0.5, 0.5, 2.8);
    controls = new OrbitControls(camera, canvas);
    controls.target.set(0.5, 0.5, 0.5);
    controls.enableDamping = true;
    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0x444444 }),
    );
    box.position.set(0.5, 0.5, 0.5);
    scene.add(box);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h);
    if (is3d) {
      camera.aspect = a;
      // em tela vertical, mantém o campo horizontal de 50° para o cubo caber na largura
      camera.fov = a < 1 ? (2 * Math.atan(Math.tan((25 * Math.PI) / 180) / a) * 180) / Math.PI : 50;
    } else {
      // mostra o quadrado [0,1]² inteiro, centralizado, sem distorcer
      const sx = Math.max(a, 1) / 2, sy = Math.max(1 / a, 1) / 2;
      Object.assign(camera, { left: 0.5 - sx, right: 0.5 + sx, top: 0.5 + sy, bottom: 0.5 - sy, near: -1, far: 1 });
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const col = new THREE.Color();
  return {
    draw(state, { trail = 0, glow = false } = {}) {
      let geo = tiles[0].geometry;
      if (geo.attributes.position?.count !== state.count) {
        geo.dispose();
        geo = new THREE.BufferGeometry();
        for (const t of tiles) t.geometry = geo;
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(state.count * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(state.count * 3), 3));
      }
      const p = geo.attributes.position.array, c = geo.attributes.color.array, { dims } = state;
      for (let i = 0; i < state.count; i++) {
        for (let d = 0; d < dims; d++) p[i * 3 + d] = state.pos[i * dims + d];
        col.setHex(PALETTE[state.color[i]]).toArray(c, i * 3);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      controls?.update();
      material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending;
      fadeMaterial.opacity = 1 - trail; // trail 0 = limpa tudo
      renderer.render(fadeScene, fadeCamera);
      renderer.clearDepth();
      renderer.render(scene, camera);
    },
  };
}
