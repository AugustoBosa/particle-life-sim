import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BETA, force, createState, step } from './physics.js';

const P = { matrix: new Float32Array([1]), colors: 1, rMax: 0.1, frictionHalfLife: 0.04, forceFactor: 10, dt: 0.02 };

// estado 2D manual, uma cor só
const mk = (pts) => ({
  count: pts.length, dims: 2,
  pos: new Float32Array(pts.flat()), vel: new Float32Array(pts.length * 2), color: new Uint8Array(pts.length),
});

// distância em x com wrap (mínima imagem)
const dx = (s) => { const d = s.pos[2] - s.pos[0]; return Math.abs(d - Math.round(d)); };

test('force: curva nos pontos-chave', () => {
  assert.equal(force(0, 1), -1);
  assert.ok(Math.abs(force(BETA, 1)) < 1e-9);
  assert.ok(Math.abs(force((1 + BETA) / 2, 1) - 1) < 1e-9);
  assert.equal(force(1, 1), 0);
  assert.equal(force(0.6, 0), 0);
  assert.ok(force(0.6, -1) < 0);
});

test('step: atração aproxima', () => {
  const s = mk([[0.5, 0.5], [0.56, 0.5]]); // r = 0.6·rMax
  step(s, P);
  assert.ok(dx(s) < 0.06);
});

test('step: repulsão de perto afasta', () => {
  const s = mk([[0.5, 0.5], [0.51, 0.5]]); // r = 0.1·rMax < β
  step(s, P);
  assert.ok(dx(s) > 0.01);
});

test('step: interage através da borda (wrap)', () => {
  const s = mk([[0.02, 0.5], [0.98, 0.5]]); // distância com wrap = 0.04
  step(s, P);
  assert.ok(dx(s) < 0.04);
});

test('step: 3D mantém posições em [0,1) e finitas', () => {
  const s = createState(500, 4, 3);
  const p = { ...P, colors: 4, matrix: new Float32Array(16).fill(0.5) };
  for (let k = 0; k < 20; k++) step(s, p);
  assert.ok(s.pos.every((x) => Number.isFinite(x) && x >= 0 && x <= 1));
});
