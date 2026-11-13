# tremechus

Source for [tremech.us](https://tremech.us), a small React site built with [Vite](https://vite.dev).

## Development

```sh
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

## Customising

- `src/data/profile.js`: all personal content (bio, links, hidden repos, career).
- `src/backgrounds/`: swappable background effects, one file each. Pick the
  default with `background` in `profile.js`, or try one per visit with
  `?bg=sparks`, `?bg=constellation` or `?bg=none`.

## Deployment

Every push to `main` is built and deployed to GitHub Pages by
`.github/workflows/deploy.yml`. The custom domain comes from `public/CNAME`.

Built with AI assistance under my guidance.
