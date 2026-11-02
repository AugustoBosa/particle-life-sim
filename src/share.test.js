import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from './share.js';

const params = { colors: 2, rMax: 0.07, frictionHalfLife: 0.04, forceFactor: 12, matrix: new Float32Array([0.5, -1, 0.25, 0.123]) };

test('share: ida e volta preserva os parâmetros (matriz com 2 casas)', () => {
  const out = decode('#' + encode(params));
  assert.equal(out.colors, 2);
  assert.equal(out.rMax, 0.07);
  assert.equal(out.forceFactor, 12);
  assert.deepEqual(Array.from(out.matrix, (v) => Math.round(v * 100)), [50, -100, 25, 12]);
});

test('share: rejeita link inválido e limita valores fora da faixa', () => {
  assert.equal(decode(''), null);
  assert.equal(decode('#c=2&m=1_2_3'), null); // matriz com tamanho errado
  assert.equal(decode('#c=9&m=' + Array(81).fill(0).join('_')), null); // cores fora de 2–8
  assert.equal(decode('#c=2&m=0_x_0_0'), null);
  const out = decode('#c=2&r=5&m=500_0_0_0');
  assert.equal(out.rMax, 0.3);
  assert.equal(out.matrix[0], 1);
});
