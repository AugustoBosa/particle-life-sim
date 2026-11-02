# Particle Life Sim

Simulador de *particle life* no navegador, em 2D e 3D. Partículas de até 8 cores se atraem ou se
repelem segundo uma matriz de regras, e disso surgem padrões que parecem vivos.

> **Status:** em stand-by. O que ficou pendente está em [docs/brainstorm.md › Em aberto](docs/brainstorm.md#em-aberto-para-retomar).

**Abrir:** https://augustobosa.github.io/particle-life-sim/ · **3D:** https://augustobosa.github.io/particle-life-sim/?3d

## Como usar

- **Matriz** (canto superior esquerdo; no celular, inferior): linha = cor que reage, coluna = cor que
  influencia. Verde atrai, vermelho repele.
  - Clique: +0.2. Botão direito: −0.2.
  - No celular, ligue **"toque diminui"** no painel para o toque tirar 0.2.
- **Painel "Particle Life"** (canto superior direito; no celular começa fechado):

| Controle | O que faz |
|---|---|
| partículas | quantidade (reinicia a simulação) |
| cores | 2 a 8 (reinicia e sorteia nova matriz) |
| raio | alcance da interação |
| atrito (meia-vida) | quanto tempo as partículas levam para perder metade da velocidade |
| força | intensidade das forças |
| rastro | 0 = sem cauda; até 0.9 = cauda longa |
| brilho | sobreposições ficam mais claras |
| toque diminui | toque/clique na matriz tira em vez de somar |
| pausar / passo | congela / avança um passo |
| resetar | novas posições, mesma matriz |
| randomizar matriz | sorteia outra matriz |
| preset | aglomerados, cobras ou órbitas |
| copiar link | grava a configuração na URL e copia; quem abrir vê o mesmo padrão |

- **3D:** link "3D →" no canto inferior direito. Arrastar gira, scroll ou pinça dá zoom.

## Rodar local

```bash
npm install
npm run dev
npm test
```

## Publicar

Push na `main` deveria rodar `.github/workflows/deploy.yml`, mas neste repo o push não está
disparando o workflow (causa desconhecida, ver [docs/brainstorm.md](docs/brainstorm.md)).
Depois do push, publique na mão:

```bash
npm run deploy
```

Configuração única no GitHub (já feita): Settings → Pages → Source = **GitHub Actions**.

## Documentação

- [docs/brainstorm.md](docs/brainstorm.md): spec, decisões, física, estado atual, problemas conhecidos e histórico.
- [docs/superpowers/plans/](docs/superpowers/plans/): planos de implementação do 2D e do 3D.

Stack: Vite, Three.js, lil-gui. Física em JS puro na CPU, com grid espacial.
