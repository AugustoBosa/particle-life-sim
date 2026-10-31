# Particle Life Sim — Brainstorm / Spec

Data: 2026-10-31 · Status: aprovado no brainstorm, aguardando plano de implementação.

## Objetivo

Página web com um simulador de *particle life*: partículas de N cores se atraem ou se
repelem segundo uma matriz N×N, gerando padrões emergentes (células, cobras, órbitas).
Primeiro 2D, depois 3D. Hospedado no GitHub Pages.

## Decisões técnicas

| Tema | Decisão | Por quê |
|---|---|---|
| Build/deploy | Vite + GitHub Actions publicando `dist/` no Pages | npm, hot reload; `base` do Vite = nome do repo |
| Física | CPU primeiro (5k–20k partículas), WebGPU numa fase posterior | depurar fácil agora; GPU troca só a física |
| Render | Three.js `Points` nos dois modos (2D = câmera ortográfica, z=0) | um renderer só para 2D e 3D, aguenta 20k pontos fácil |
| Controles | lil-gui + editor de matriz próprio em `<canvas>` | lil-gui cobre sliders/botões; matriz precisa ser clicável |
| Testes | `node --test` (runner nativo) na função de força e no `step()` | zero dependência de teste |

## Física

Estado em typed arrays (`Float32Array`): posições, velocidades, `Uint8Array` de cores.
Uma única função `step(state, params)` serve 2D e 3D via `params.dims` (2 ou 3).

Força entre duas partículas, com `r` = distância / `rMax` e `a` = `matrix[corA][corB]` (−1..1):

```
r < β        →  r/β − 1                          (repulsão universal de perto)
β ≤ r < 1    →  a · (1 − |2r − 1 − β| / (1 − β))  (atração/repulsão da matriz)
r ≥ 1        →  0
```

`β` ≈ 0.3. Por passo: `v *= atrito`, `v += F · rMax · força · dt`, `p += v · dt`,
depois wrap (espaço toroidal: sai de um lado, entra no oposto).

Vizinhança: grid espacial com célula = `rMax`, reconstruído a cada passo. Sem grid seria
O(n²); com grid fica ~O(n·k).

Fase GPU: mesma assinatura `step(state, params)`, implementação WebGPU compute shader.
Render e UI não mudam.

## Escopo

### 2D v1
1. N cores (2–8), matriz N×N aleatória
2. Matriz clicável (clique +/−) e botão randomizar
3. Sliders: nº de partículas, raio `rMax`, atrito, força
4. Bordas com wrap
5. Pausar / passo único / resetar

### 3D v1
1. Mesma física com `dims = 3`, mesma matriz e sliders
2. Three.js `Points` com sprite suave
3. `OrbitControls` (arrastar gira, scroll zoom)
4. Cubo com wrap nas 6 faces + contorno wireframe
5. Página `3d.html`, link entre 2D e 3D

### Depois (fora da v1)
- Presets com nome + link compartilhável (matriz na URL)
- Mouse atraindo/repelindo
- Trails/glow, neblina de profundidade, auto-rotação
- FPS + screenshot
- Mobile/touch
- Física em WebGPU (100k+ partículas)
- VR/WebXR

## Estrutura

```
particle_life_sim/
├── index.html              # 2D  (<body data-dims="2">)
├── 3d.html                 # 3D  (<body data-dims="3">)
├── src/
│   ├── main.js             # lê data-dims, liga sim + render + ui, loop rAF
│   ├── physics.js          # force(), step(), grid espacial
│   ├── physics.test.js     # node --test
│   ├── render.js           # Three.js Points, câmera orto (2D) ou perspectiva+orbit (3D)
│   ├── matrix-editor.js    # canvas N×N clicável
│   └── ui.js               # painel lil-gui
├── .github/workflows/deploy.yml
├── vite.config.js          # base + multi-page (index.html, 3d.html)
├── package.json
└── docs/brainstorm.md
```

## Critérios de pronto

- 2D: 10k partículas a ≥ 50 FPS num notebook comum; mudar a matriz muda o padrão em segundos.
- 3D: 5k partículas a ≥ 50 FPS; orbitar a câmera sem travar.
- `npm test` passa; push na `main` publica no Pages sem passo manual.

## Riscos

- `base` errado no Vite → página em branco no Pages (assets 404). Testar com `npm run preview`.
- CPU 3D com raio grande explode o nº de vizinhos → limitar `rMax` no slider.
- FPS na CPU (medido 2026-10-31, física isolada no Node, após agrupar): versão ingênua 10k 2D = 88 ms/passo;
  com kernel único + posições ordenadas por célula = 18.6 ms (10k 2D, no limite de 50 FPS), 5.2 ms (5k 2D),
  9.6 ms (5k 3D). Acima disso, só a fase GPU resolve.
