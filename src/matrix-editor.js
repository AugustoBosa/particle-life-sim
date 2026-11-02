import { PALETTE } from './render.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// linha i = cor que reage, coluna j = cor que influencia; verde atrai, vermelho repele
export function createMatrixEditor(canvas, params) {
  const ctx = canvas.getContext('2d');
  const S = canvas.width;

  function draw() {
    const n = params.colors, cell = S / (n + 1);
    ctx.clearRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = hex(PALETTE[i]);
      ctx.fillRect((i + 1) * cell, 0, cell, cell);
      ctx.fillRect(0, (i + 1) * cell, cell, cell);
      for (let j = 0; j < n; j++) {
        const v = params.matrix[i * n + j];
        ctx.fillStyle = v > 0 ? `rgba(60,220,90,${v})` : `rgba(230,60,60,${-v})`;
        ctx.fillRect((j + 1) * cell + 1, (i + 1) * cell + 1, cell - 2, cell - 2);
      }
    }
  }

  function edit(e, delta) {
    e.preventDefault();
    const n = params.colors, r = canvas.getBoundingClientRect();
    const j = Math.floor(((e.clientX - r.left) / r.width) * (n + 1)) - 1;
    const i = Math.floor(((e.clientY - r.top) / r.height) * (n + 1)) - 1;
    if (i < 0 || j < 0 || i >= n || j >= n) return;
    const k = i * n + j;
    params.matrix[k] = Math.max(-1, Math.min(1, params.matrix[k] + delta));
    draw();
  }

  canvas.addEventListener('click', (e) => edit(e, params.subtract ? -0.2 : 0.2));
  canvas.addEventListener('contextmenu', (e) => edit(e, -0.2));
  draw();
  return { draw };
}
