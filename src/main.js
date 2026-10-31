import { createState, randomMatrix, step } from './physics.js';
import { createRenderer } from './render.js';
import { createUI } from './ui.js';

const dims = Number(document.body.dataset.dims);
const params = {
  count: 5000, colors: 6, rMax: 0.05, frictionHalfLife: 0.04, forceFactor: 10, dt: 0.02, paused: false,
};
params.matrix = randomMatrix(params.colors);
let state = createState(params.count, params.colors, dims);
const renderer = createRenderer(document.getElementById('sim'));

const actions = {
  reset() {
    if (params.matrix.length !== params.colors ** 2) params.matrix = randomMatrix(params.colors);
    state = createState(params.count, params.colors, dims);
  },
  randomize() {
    params.matrix = randomMatrix(params.colors);
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
