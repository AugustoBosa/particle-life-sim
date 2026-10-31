import { createState, randomMatrix, step } from './physics.js';
import { createRenderer } from './render.js';
import { createUI } from './ui.js';
import { createMatrixEditor } from './matrix-editor.js';

const dims = new URLSearchParams(window.location.search).has('3d') ? 3 : 2;
const params = {
  count: 5000, colors: 6, rMax: dims === 3 ? 0.1 : 0.05, frictionHalfLife: 0.04, forceFactor: 10, dt: 0.02, paused: false,
};
params.matrix = randomMatrix(params.colors);
let state = createState(params.count, params.colors, dims);
const renderer = createRenderer(document.getElementById('sim'), dims);
const mode = document.getElementById('mode');
mode.href = dims === 3 ? './' : '?3d';
mode.textContent = dims === 3 ? '← 2D' : '3D →';
const editor = createMatrixEditor(document.getElementById('matrix'), params);

const actions = {
  reset() {
    if (params.matrix.length !== params.colors ** 2) params.matrix = randomMatrix(params.colors);
    state = createState(params.count, params.colors, dims);
    editor.draw();
  },
  randomize() {
    params.matrix = randomMatrix(params.colors);
    editor.draw();
  },
  stepOnce() {
    params.paused = true;
    step(state, params);
  },
};
createUI(params, actions);

function frame() {
  if (!params.paused) step(state, params);
  renderer.draw(state);
  requestAnimationFrame(frame);
}
frame();
