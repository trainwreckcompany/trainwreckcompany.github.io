# trainwreckcompany.github.io

Official site for **BREACHPUNK**, an indie game in development by Train Wreck Company.

Live at **https://trainwreckcompany.github.io/**

## Files

| File | What it is |
|------|------------|
| `index.html` | The whole homepage: hero, world/lore, features, devlog, follow links |
| `style.css` | All styling and the colour palette (top of the file, `:root`) |
| `main.js` | Lore typewriter, title glitch, HEINDE eye + observer counter |
| `404.html` | Page shown for any broken link |
| `README.md` | This file |

## Common edits

- **Change the lore text** — edit the `LORE` array at the top of `main.js`.
- **Add a devlog post** — in `index.html`, copy a `<li class="log-entry">` block and paste it at the top of the `<ol class="log">` list.
- **Change colours** — edit the variables in `:root` in `style.css`.
- **Add the Steam link** — in the Follow section of `index.html`, set the `href` and remove `disabled` / `aria-disabled`.
- **Add images** — make an `assets/` folder, drop files in, and reference them as `assets/name.png`.

## Publishing

1. Push to `main`.
2. Repo **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** (usually already set for `*.github.io` repos).
3. Changes go live within a minute or two.

## Preview locally

```sh
python -m http.server 8000
# open http://localhost:8000
```
