import * as THREE from 'three';

export const PALETTE = [0xff4d4d, 0x4dff88, 0x4d8cff, 0xffd24d, 0xd24dff, 0x4dffff, 0xff8c4d, 0xffffff];

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  const material = new THREE.PointsMaterial({ size: 3, vertexColors: true, sizeAttenuation: false });
  // o mundo é um toro: 3×3 cópias do mesmo geometry preenchem telas não quadradas sem distorcer
  const tiles = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      const t = new THREE.Points(new THREE.BufferGeometry(), material);
      t.position.set(x, y, 0);
      t.frustumCulled = false; // as posições mudam todo frame; bounding sphere ficaria velha
      scene.add(t);
      tiles.push(t);
    }
  }

  // mostra o quadrado [0,1]² inteiro, centralizado, sem distorcer
  function resize() {
    const w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h);
    const sx = Math.max(a, 1) / 2, sy = Math.max(1 / a, 1) / 2;
    Object.assign(camera, { left: 0.5 - sx, right: 0.5 + sx, top: 0.5 + sy, bottom: 0.5 - sy, near: -1, far: 1 });
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const col = new THREE.Color();
  return {
    draw(state) {
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
      renderer.render(scene, camera);
    },
  };
}
