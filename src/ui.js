import GUI from 'lil-gui';
import { PRESETS } from './presets.js';

export function createUI(params, actions) {
  const gui = new GUI({ title: 'Particle Life' });
  gui.add(params, 'count', 500, 20000, 500).name('partículas').onFinishChange(actions.reset);
  gui.add(params, 'colors', 2, 8, 1).name('cores').onChange(actions.reset);
  gui.add(params, 'rMax', 0.02, 0.3, 0.01).name('raio');
  gui.add(params, 'frictionHalfLife', 0.005, 0.2, 0.005).name('atrito (meia-vida)');
  gui.add(params, 'forceFactor', 1, 30, 0.5).name('força');
  // ponytail: rastro até 0.9; acima disso o arredondamento de 8 bits deixa um fantasma fraco que nunca some
  gui.add(params, 'trail', 0, 0.9, 0.05).name('rastro');
  gui.add(params, 'glow').name('brilho');
  gui.add(params, 'subtract').name('toque diminui');
  gui.add(params, 'paused').name('pausar').listen();
  gui.add(actions, 'stepOnce').name('passo');
  gui.add(actions, 'reset').name('resetar');
  gui.add(actions, 'randomize').name('randomizar matriz');
  for (const name of Object.keys(PRESETS)) gui.add({ [name]: () => actions.preset(name) }, name).name('preset: ' + name);
  const share = gui.add({ share: async () => {
    share.name((await actions.share()) ? 'link copiado ✓' : 'link na barra de endereço');
    setTimeout(() => share.name('copiar link'), 2000);
  } }, 'share').name('copiar link');
  if (window.innerWidth < 600) gui.close(); // no celular o painel aberto cobre metade da tela
  return gui;
}
