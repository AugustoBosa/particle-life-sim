# Particle Life Sim

Simulador de particle life no navegador: 2D primeiro, depois 3D. Hospedado no GitHub Pages.

Spec e decisões: [docs/brainstorm.md](docs/brainstorm.md).

## Rodar local

```bash
npm install
npm run dev
npm test
```

## Publicar

Push na `main` roda `.github/workflows/deploy.yml`. Uma vez só, no GitHub: Settings → Pages → Source = **GitHub Actions**.
