# StElli Ragdoll Web

Moderní statický web chovatelské stanice StElli vytvořený s HTML, CSS a JavaScript.

## Nasazení

1. Push na GitHub: `git push`
2. Na Vercel klikni "Import Project"
3. Vyber `stelli-website` repo
4. Hotovo!

## Větve a vývoj

| Větev  | Kam se nasadí                    | K čemu je              |
| ------ | -------------------------------- | ---------------------- |
| `main` | produkce (ostrá doména)          | jen odladěné změny     |
| `dev`  | Vercel preview URL (vlastní link)| vývoj a testování      |

Produkční doména se mění **výhradně** pushem do `main`. Push do `dev` (ani do
jakékoli jiné větve) na ni nesáhne — Vercel z ní udělá samostatný preview
deployment na vlastní adrese, kterou najdeš v Vercel dashboardu u dané větve
nebo v komentáři u pull requestu.

Postup:

```bash
git checkout dev
git pull origin dev
# ... úpravy ...
git commit -am "popis změny"
git push origin dev          # nasadí se jen preview, produkce beze změny
```

Až je změna odladěná, otevři pull request `dev` → `main` a po mergi se nasadí
produkce.

Než začneš na `dev` pracovat, stáhni si do ní aktuální `main`
(`git checkout dev && git merge main`), ať nevznikají zbytečné konflikty.

### Admin (CMS) na vývojové větvi

`admin/config.yml` má na každé větvi nastavený `backend.branch` na tu svou:
na `main` je to `main`, na `dev` je to `dev`. Admin otevřený na preview URL
tedy commituje obsah do `dev` a **nezmění živý web**; pro reálné úpravy obsahu
používej admin na produkční doméně.

Kvůli tomu při mergi `dev` → `main` **nikdy nepřenášej řádek
`branch: dev`** do `main`. Hlídá to workflow `cms-branch-guard`, které takový
pull request neprojde.

### Automatické překlady

Workflow `auto-translate.yml` (překlady + prerender do statického HTML) běží
jen nad `main`. Na `dev` se změny v `data/*.json` samy nepřeloží ani
nepředrenderují — na preview je proto uvidíš až po ručním spuštění
`node scripts/auto-translate.js` a `node scripts/prerender.js`, nebo až po
mergi do `main`.

## Soubory

- `index.html` - Úvod
- `o-nas.html` - O nás
- `nase-prace.html` - Naše práce
- `kotatka.html` - Koťátka
- `informace-ke-koupi.html` - Info ke koupi
- `tym.html` - Chovné kočky
- `kontakty.html` - Kontakty
- `styles.css` - Styly a animace
- `script.js` - Interaktivita

© 2026 StElli Ragdoll
