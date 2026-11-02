# Particle Life Sim — Spec e registro do projeto

Criado: 2026-10-31 · Atualizado: 2026-11-02 · Status: **em stand-by desde 2026-11-02.** 2D v1, 3D v1 e extras no ar. Antes de retomar, leia "Em aberto".

Site: https://augustobosa.github.io/particle-life-sim/ (3D: `?3d`)
Repo: https://github.com/AugustoBosa/particle-life-sim

## Objetivo

Página web com um simulador de *particle life*: partículas de N cores se atraem ou se
repelem segundo uma matriz N×N, gerando padrões emergentes (aglomerados, cobras, órbitas).
2D e 3D na mesma página. Hospedado no GitHub Pages.

## Decisões técnicas

| Tema | Decisão | Por quê |
|---|---|---|
| Build/deploy | Vite + GitHub Actions publicando `dist/` no Pages; `base: './'` | caminhos relativos funcionam com qualquer nome de repo |
| Física | CPU, single-thread, grid espacial (WebGPU é a próxima fase) | fácil de depurar; 5k partículas a ≥ 50 FPS |
| Render | Three.js `Points`. 2D: câmera ortográfica + 3×3 cópias do toro (tela cheia sem distorcer). 3D: perspectiva + `OrbitControls` + cubo wireframe | um renderer só para os dois modos |
| Modo 3D | mesma página com `?3d` na URL (em vez de `3d.html`) | sem CSS duplicado nem config multi-page |
| Controles | lil-gui + editor de matriz próprio em `<canvas>` | lil-gui cobre sliders; a matriz precisa ser clicável |
| Velocidade | 60 passos/s em tempo real, no máx. 2 por frame | igual em telas de 60, 120 ou 144 Hz |
| Compartilhar | configuração no `#` da URL (`c`, `r`, `f`, `k`, `m` = matriz ×100 separada por `_`), validada e limitada à faixa dos sliders | link vem de qualquer pessoa |
| Testes | `node --test` (runner nativo) | zero dependência de teste |

## Física

Estado em typed arrays: posições e velocidades (`Float32Array`), cores (`Uint8Array`).
Uma única função `step(state, params)` serve 2D e 3D (`state.dims` = 2 ou 3).

Força entre duas partículas, com `r` = distância / `rMax` e `a` = `matrix[corA * n + corB]` (−1..1):

```
r < β        →  r/β − 1                          (repulsão universal de perto)
β ≤ r < 1    →  a · (1 − |2r − 1 − β| / (1 − β))  (atração/repulsão da matriz)
r ≥ 1        →  0
```

`β` = 0.3. Por passo: `v = v · atrito + F · rMax · força · dt`, `p += v · dt`, depois wrap
(espaço toroidal [0,1)^dims: sai de um lado, entra no oposto).

Vizinhança: grid com célula ≥ `rMax` (mín. 3 células por eixo), posições copiadas em ordem
de célula para os vizinhos ficarem contíguos na memória. 2D usa o mesmo kernel com uma camada em z.

Fase GPU: compute shader WebGPU. As posições devem ficar na GPU e o render precisa ler o mesmo
buffer (ex.: `WebGPURenderer` do Three.js com storage buffer), então `render.js` muda e `step`
pode virar assíncrono. A UI e o formato de `params` não mudam. O teste de força bruta em
`physics.test.js` serve de oráculo para a versão GPU.

## Escopo

### Feito

- **2D v1:** N cores (2–8), matriz aleatória clicável, sliders (partículas, cores, raio, atrito,
  força), wrap nas bordas, pausar / passo / resetar.
- **3D v1:** mesma física com `dims = 3`, pontos redondos suaves, câmera orbital, cubo wireframe,
  link entre 2D e 3D.
- **Celular:** painel começa fechado, matriz menor no canto inferior, tela cheia via cópias do toro,
  opção "toque diminui" (toque não tem botão direito).
- **Presets** (select): aglomerados, cobras, órbitas.
- **Link compartilhável:** botão "copiar link".
- **Visual:** rastro (0–0.9) e brilho (mistura aditiva).

### Depois

- Física em WebGPU (100k+ partículas)
- Mouse/toque atraindo ou repelindo partículas
- Neblina de profundidade e auto-rotação no 3D
- Contador de FPS e screenshot
- VR/WebXR

## Estrutura

```
particle_life_sim/
├── index.html              # página única; ?3d = modo 3D
├── src/
│   ├── main.js             # params, modo 2D/3D, loop de passo fixo, ações
│   ├── physics.js          # force(), step(), grid espacial
│   ├── physics.test.js     # curva de força, atração/repulsão, wrap, força bruta 2D/3D
│   ├── render.js           # Three.js: 2D (orto + tiles) ou 3D (perspectiva + orbit); rastro e brilho
│   ├── matrix-editor.js    # canvas N×N clicável
│   ├── ui.js               # painel lil-gui
│   ├── presets.js          # matrizes dos presets
│   ├── share.js            # encode/decode do link
│   └── share.test.js
├── .github/workflows/deploy.yml
├── vite.config.js          # base './'
├── package.json            # dev, build, test, deploy
└── docs/
    ├── brainstorm.md       # este arquivo
    └── superpowers/plans/  # planos de implementação do 2D e do 3D
```

## Critérios de pronto

| Critério | Resultado |
|---|---|
| 2D: 5k partículas a ≥ 50 FPS | ✅ física ≈ 11 ms/passo no navegador |
| 3D: 5k partículas a ≥ 50 FPS | ✅ física ≈ 9.7 ms/passo |
| `npm test` passa | ✅ 9/9 |
| push na `main` publica sozinho | ⚠️ não — ver "Problemas conhecidos" |

O critério original de 10k partículas a ≥ 50 FPS no 2D foi rebaixado para 5k em 2026-10-31:
no navegador, 10k gastam 44–82 ms/passo (varia com a matriz). 10k fica para a fase GPU.

## Problemas conhecidos

- **Push não dispara o deploy.** O GitHub registra o push, o workflow está ativo e o YAML é válido,
  mas nenhum run com `event=push` é criado (testado 3×, inclusive com a credencial do `gh`).
  O disparo manual funciona. Contorno: `npm run deploy` depois do push. O repo `trebuchet`, com
  workflow quase igual, disparava por push até 2026-10-27. Se ele também parar, o problema é da conta.
- **Rastro longo deixa fantasma:** por isso o slider vai só até 0.9.
- **Copiar link** depende da API de clipboard; se o navegador bloquear, o botão avisa que o link está
  na barra de endereço.

## Em aberto (para retomar)

### Problemas sem resolver
1. **Deploy automático não funciona** (ver "Problemas conhecidos"). Teste pendente: dar push no repo
   `trebuchet` e ver se a aba Actions roda sozinha. Se não rodar, o problema é da conta (abrir chamado
   no suporte do GitHub). Se rodar, o problema é só deste repo.
2. **10k partículas abaixo de 50 FPS no 2D** (44–82 ms/passo). Critério rebaixado para 5k; 10k depende da fase GPU.

### Nunca verificado em navegador visível
A verificação foi feita no painel do navegador do app, que ficava oculto e pausava o `requestAnimationFrame`.
1. FPS real da página no 2D e no 3D (só a física isolada foi medida).
2. Velocidade fixa de 60 passos/s rodando de verdade.

(Copiar link: confirmado pelo usuário no celular.)

### Funcionalidades (ordem sugerida)
1. Física em WebGPU para 100k+ partículas (~1 dia; ver seção "Física").
2. Mouse/toque atraindo ou repelindo partículas.
3. Neblina de profundidade e auto-rotação no 3D.
4. Contador de FPS e screenshot.
5. VR/WebXR.

### Polimento pequeno (das revisões de código; nada quebrado)
1. Slider de partículas vai até 20k, mas acima de ~5k a simulação fica lenta.
2. Versões das actions (`checkout@v4`, `setup-node@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4`) não conferidas contra as mais recentes.
3. Buffers da física (`cellOf`, `start`, `sorted`, `sp`, `sc`) recriados a cada passo; dá para reaproveitar por `count`/`nCells`.
4. Cores das partículas reenviadas à GPU a cada frame; só precisam mudar no reset (usar flag "dirty", não só o tamanho do buffer).
5. Tooltip da matriz usa "+0.2" em vez de "+0,2"; editor sem teclado; canvas da matriz sem ajuste de devicePixelRatio.

### Limpeza
- Branches `feat/2d-v1`, `feat/3d-v1` e `feat/extras` no GitHub já estão na `main` e podem ser apagadas.
- Commit vazio `c834b94` (teste de diagnóstico do deploy) ficou no histórico; inofensivo.

## Riscos

- `base` errado no Vite → página em branco no Pages (assets 404).
- CPU 3D com raio grande explode o nº de vizinhos → `rMax` limitado a 0.3 no slider.
- FPS na CPU (medido 2026-10-31, após as partículas agruparem): versão ingênua 10k 2D = 88 ms/passo;
  com kernel único + posições ordenadas por célula: 18.6 ms no Node e 44–82 ms no navegador (10k 2D),
  5.2 ms (5k 2D), 9.6 ms (5k 3D).

## Histórico

| Data | O que mudou |
|---|---|
| 2026-10-31 | Brainstorm, spec, plano 2D, implementação 2D v1 (5 tasks com subagentes + revisão), deploy no Pages |
| 2026-10-31 | Layout no celular; investigação do gatilho de push; script `npm run deploy` |
| 2026-10-31 | Plano e implementação do 3D v1 |
| 2026-11-02 | Velocidade fixa, "toque diminui", presets, link compartilhável, rastro e brilho; presets em select |
| 2026-11-02 | Documentação final e lista "Em aberto"; projeto em stand-by |
