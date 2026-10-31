import GUI from 'lil-gui';

export function createUI(params, actions) {
  const gui = new GUI({ title: 'Particle Life' });
  gui.add(params, 'count', 500, 20000, 500).name('partículas').onFinishChange(actions.reset);
  gui.add(params, 'colors', 2, 8, 1).name('cores').onFinishChange(actions.reset);
  gui.add(params, 'rMax', 0.02, 0.3, 0.01).name('raio');
  gui.add(params, 'frictionHalfLife', 0.005, 0.2, 0.005).name('atrito (meia-vida)');
  gui.add(params, 'forceFactor', 1, 30, 0.5).name('força');
  gui.add(params, 'paused').name('pausar').listen();
  gui.add(actions, 'stepOnce').name('passo');
  gui.add(actions, 'reset').name('resetar');
  gui.add(actions, 'randomize').name('randomizar matriz');
  return gui;
}
