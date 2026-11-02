// padrões conhecidos de particle life; m[i*n + j] = como a cor i reage à cor j
const build = (n, f) => Float32Array.from({ length: n * n }, (_, k) => f(Math.floor(k / n), k % n, n));

export const PRESETS = {
  aglomerados: (n) => build(n, (i, j) => (i === j ? 1 : -0.4)),
  cobras: (n) => build(n, (i, j) => (i === j ? 0.6 : j === (i + 1) % n ? 0.8 : 0)),
  órbitas: (n) => build(n, (i, j) => (j === (i + 1) % n ? 1 : j === (i + n - 1) % n ? -1 : 0)),
};
