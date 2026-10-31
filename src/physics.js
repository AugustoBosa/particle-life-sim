export const BETA = 0.3;

export function force(r, a) {
  if (r < BETA) return r / BETA - 1;
  if (r < 1) return a * (1 - Math.abs(2 * r - 1 - BETA) / (1 - BETA));
  return 0;
}

export function randomMatrix(n) {
  return Float32Array.from({ length: n * n }, () => Math.random() * 2 - 1);
}

export function createState(count, colors, dims) {
  return {
    count, dims,
    pos: Float32Array.from({ length: count * dims }, Math.random),
    vel: new Float32Array(count * dims),
    color: Uint8Array.from({ length: count }, () => Math.floor(Math.random() * colors)),
  };
}

// ponytail: CPU single-thread, ~O(n·vizinhos). Teto medido na Task 1; acima dele,
// o caminho é WebGPU compute (fase GPU do spec), não Web Worker.
export function step(state, params) {
  const { count, dims, pos, vel, color } = state;
  const { matrix, colors, rMax, frictionHalfLife, forceFactor, dt } = params;

  // grid: célula ≥ rMax, ≥ 3 células por eixo para o wrap não visitar a mesma célula duas vezes.
  // 2D usa o mesmo kernel com uma camada só em z.
  const cells = Math.max(3, Math.floor(1 / rMax));
  const layers = dims === 3 ? cells : 1;
  const nCells = cells * cells * layers;
  const cellOf = new Int32Array(count);
  const start = new Int32Array(nCells + 1);
  const cellIdx = (v) => Math.min(cells - 1, Math.floor(v * cells));
  for (let i = 0; i < count; i++) {
    const b = i * dims;
    const cz = dims === 3 ? cellIdx(pos[b + 2]) : 0;
    const c = (cz * cells + cellIdx(pos[b + 1])) * cells + cellIdx(pos[b]);
    cellOf[i] = c;
    start[c + 1]++;
  }
  for (let c = 0; c < nCells; c++) start[c + 1] += start[c];

  // cópia ordenada por célula (xyz, z = 0 em 2D): vizinhos ficam contíguos na memória
  const fill = start.slice(0, nCells);
  const sorted = new Int32Array(count);
  const sp = new Float32Array(count * 3);
  const sc = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const s = fill[cellOf[i]]++;
    sorted[s] = i;
    for (let d = 0; d < dims; d++) sp[s * 3 + d] = pos[i * dims + d];
    sc[s] = color[i];
  }

  const rMax2 = rMax * rMax, invR = 1 / rMax, k = rMax * forceFactor * dt;
  const friction = Math.pow(0.5, dt / frictionHalfLife);
  const oz0 = dims === 3 ? -1 : 0, oz1 = dims === 3 ? 1 : 0;

  for (let s = 0; s < count; s++) {
    const x = sp[s * 3], y = sp[s * 3 + 1], z = sp[s * 3 + 2];
    const row = sc[s] * colors;
    let c = cellOf[sorted[s]];
    const cx = c % cells; c = (c / cells) | 0;
    const cy = c % cells;
    const cz = (c / cells) | 0;
    let fx = 0, fy = 0, fz = 0;
    for (let oz = oz0; oz <= oz1; oz++) {
      const nz = (cz + oz + layers) % layers;
      for (let oy = -1; oy <= 1; oy++) {
        const ny = (cy + oy + cells) % cells;
        for (let ox = -1; ox <= 1; ox++) {
          const nc = (nz * cells + ny) * cells + (cx + ox + cells) % cells;
          for (let t = start[nc], end = start[nc + 1]; t < end; t++) {
            if (t === s) continue;
            // mínima imagem no toro
            let dx = sp[t * 3] - x; if (dx > 0.5) dx -= 1; else if (dx < -0.5) dx += 1;
            let dy = sp[t * 3 + 1] - y; if (dy > 0.5) dy -= 1; else if (dy < -0.5) dy += 1;
            let dz = sp[t * 3 + 2] - z; if (dz > 0.5) dz -= 1; else if (dz < -0.5) dz += 1;
            const r2 = dx * dx + dy * dy + dz * dz;
            if (r2 === 0 || r2 >= rMax2) continue;
            const r = Math.sqrt(r2);
            const F = force(r * invR, matrix[row + sc[t]]) / r;
            fx += dx * F; fy += dy * F; fz += dz * F;
          }
        }
      }
    }
    const b = sorted[s] * dims;
    vel[b] = vel[b] * friction + fx * k;
    vel[b + 1] = vel[b + 1] * friction + fy * k;
    if (dims === 3) vel[b + 2] = vel[b + 2] * friction + fz * k;
  }

  // posições só depois de todas as forças: todo mundo usou as posições antigas
  for (let i = 0; i < pos.length; i++) {
    pos[i] += vel[i] * dt;
    pos[i] -= Math.floor(pos[i]);
  }
}
