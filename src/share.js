// configuração no # da URL; os limites são os mesmos dos sliders (o link vem de qualquer pessoa)
const KEYS = {
  colors: ['c', 2, 8],
  rMax: ['r', 0.02, 0.3],
  frictionHalfLife: ['f', 0.005, 0.2],
  forceFactor: ['k', 1, 30],
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function encode(params) {
  const q = new URLSearchParams();
  for (const [key, [short]] of Object.entries(KEYS)) q.set(short, params[key]);
  q.set('m', Array.from(params.matrix, (v) => Math.round(v * 100)).join('_'));
  return q.toString();
}

// devolve os parâmetros do link, ou null se o link não tiver uma configuração válida
export function decode(hash) {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  const n = Number(q.get('c'));
  const m = (q.get('m') ?? '').split('_').map(Number);
  if (!Number.isInteger(n) || n < 2 || n > 8 || m.length !== n * n || m.some((v) => !Number.isFinite(v))) return null;
  const out = { matrix: Float32Array.from(m, (v) => clamp(v / 100, -1, 1)) };
  for (const [key, [short, lo, hi]] of Object.entries(KEYS)) {
    const v = Number(q.get(short));
    if (q.has(short) && Number.isFinite(v)) out[key] = clamp(v, lo, hi);
  }
  return out;
}
