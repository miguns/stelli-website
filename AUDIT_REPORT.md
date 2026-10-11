# Audit webu stelliragdoll.cz

Datum auditu: 11. 10. 2026 · Zdroj: větev `main` (commit 6a1545b) + produkční nasazení https://stelli-website.vercel.app

> Legenda: ✅ OK · ⚠️ částečně · ❌ chybí · ➖ nelze ověřit z kódu
> Náročnost oprav: **S** = do hodiny · **M** = pár hodin · **L** = den a víc

---

## 0. Co web ve skutečnosti je (oproti zadání)

Zadání počítá s Next.js, Airtable a Gmailem. Repozitář je ale jiný, proto jsem kontroly přizpůsobil:

| Zadání předpokládá | Skutečnost v repu |
|---|---|
| Next.js (App Router) | **Statický web**: čisté HTML + CSS + `script.js`, žádný build (`vercel.json:2` `"buildCommand": ""`), žádný `package.json` |
| i18n v Next.js | 4 jazyky jako složky: `cs` v kořeni, `/en`, `/de`, `/pl`; hreflang ručně v `<head>` |
| Blog v MDX/CMS | 3 články jako ručně psané HTML stránky (`poznejte-ragdoll`, `proc-se-ragdolli-kotata-rodi-bila`, `rana-kastrace-kotatek`) |
| CMS | Sveltia CMS (`admin/`) edituje `data/*.json`; GitHub Action přeloží (DeepL) a předgeneruje HTML (`scripts/prerender.js`) |
| Formulář → Airtable → Gmail | Formulář `dotaznik.html` → **Web3Forms** (posílá přímo z prohlížeče) → e-mail. **Airtable se nepoužívá.** |
| Routing, hlavičky | `vercel.json` (legacy `routes`), čisté URL bez `.html` řešené přesměrováním |
| Správce balíčků | žádný; `node_modules/` obsahuje jen Playwright pro lokální testy (je v `.gitignore`) |

Body, které se týkají jen Next.js (`next/image`, `next/font`, `"use client"`, ISR, `poweredByHeader`, `tsc`), jsou označené jako ➖ nerelevantní, nebo převedené na ekvivalent pro statický web.

---

## 1. SEO – technické

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 1.1 | Sitemap | ✅ | `sitemap.xml`: 48 URL = 12 stránek × 4 jazyky, s hreflang alternativami a `x-default` | ⚠️ `lastmod` je ručně a zastaralé (40× `2026-09-20`, změny jsou z 11. 10.). Generovat sitemap v `prerender.js`, nebo `lastmod` vynechat. **S** |
| 1.2 | robots.txt | ✅ | `robots.txt`: `Allow: /`, `Disallow: /admin/`, `Sitemap: https://www.stelliragdoll.cz/sitemap.xml`, CSS/JS/obrázky neblokuje | — |
| 1.3 | Unikátní title a description | ⚠️ | Skript nad 56 HTML: žádné duplicitní title ani description. Title max. 61 znaků (`en/informace-ke-koupi.html`). **12 description je delších než 160 znaků**, např. `de/rana-kastrace-kotatek.html` (196), `de/proc-se-…` (186), `de/dotaznik.html` (185), `pl/zasady-…` (181), `en/proc-se-…` (175) | Zkrátit na ~150–155 znaků. **S** |
| 1.4 | metadataBase / absolutní URL | ✅ | Canonical, og:image i JSON-LD používají absolutní `https://www.stelliragdoll.cz/…` | — |
| 1.5 | Canonical | ✅ | Všechny indexované stránky mají `<link rel="canonical">` na www bez lomítka a bez `.html`; `vercel.json` 301 přesměruje `.html`, koncové `/` a `index` | — |
| 1.6 | Hreflang + x-default | ✅ | Každá stránka má cs/en/de/pl + `x-default` (→ EN), konzistentní i v sitemapě | — |
| 1.7 | `<html lang>` | ✅ | cs/en/de/pl odpovídá složce na všech 56 stránkách | — |
| 1.8 | Jedno H1, hierarchie | ⚠️ | Všude právě jedno `<h1>`. Články ale skáčou z H1 rovnou na H3: `rana-kastrace-kotatek.html:105` (h1) → `:115` (h3); Lighthouse a11y hlásí `heading-order` | V článcích změnit první úroveň nadpisů na `<h2>` (vizuálně stejné přes CSS). **S** |
| 1.9 | Open Graph / Twitter | ⚠️ | og:title/description/image a `twitter:card` na všech indexovaných stránkách. **og:url chybí** všude kromě úvodních stránek. U článků není og:image 1200×630: `poznejte-ragdoll.html:12` používá `face-baileys.jpg` (1400×1867, na výšku), takže se náhled ořízne. Zásady a dotazník nemají twitter:card | Doplnit og:url; pro 3 články udělat obrázky 1200×630 do `images/og/`. **S** |
| 1.10 | Favicon, apple-touch-icon, manifest | ✅ | `kotatka.html:22-25`: favicon 32 px, `favicon.ico`, `apple-touch-icon` 180 px, `site.webmanifest` | — |
| 1.11 | 404 stránka se skutečným 404 | ✅ | `curl /neexistuje` → **404**, `/en/neexistuje` → 404 s anglickou stránkou (`vercel.json` konec `routes`), 404 stránky mají `noindex` | — |
| 1.12 | noindex správně | ✅ | `noindex` jen na `404.html` (4×), `dotaznik.html` (4×, `noindex, follow`) a `admin/index.html`. Ostatní indexovatelné | Drobnost: dotazník má zároveň canonical + hreflang, což je s noindex rozporné, ale neškodí |
| 1.13 | Preview deploymenty neindexovatelné | ✅ | Preview větve vrací `302` na Vercel SSO + `x-robots-tag: noindex` | ⚠️ Produkční alias `stelli-website.vercel.app` je veřejný a indexovatelný. Po přepnutí domény nastavit ve Vercelu přesměrování vercel.app → www.stelliragdoll.cz. **S** |
| 1.14 | Rozbité odkazy | ✅ | Kontrola všech `href`/`src`/`srcset` v 56 HTML: žádný rozbitý interní odkaz (`/_vercel/insights/script.js` poskytuje Vercel, `200`). Externí odkazy: 200, PubMed 203, `pawpeds.com` a `web3forms.com` vrací 403 kvůli ochraně proti botům | ➖ PawPeds odkazy ověřit ručně v prohlížeči |
| 1.15 | Interní prolinkování | ⚠️ | Články se odkazují jen navzájem (sekce „Přečtěte si také“). Z textu článků nevede odkaz na Koťátka/Dotazník/Kontakt a stránky webu (Koťátka, Info ke koupi, O nás…) neodkazují na články | Doplnit kontextové odkazy (např. Info ke koupi → Raná kastrace, Koťátka → Proč se rodí bílá) a CTA na konci článku. **S** |
| 1.16 | Automatické přesměrování podle IP | ✅ (záměr, opraveno pro roboty) | Přesměrování podle země je **záměr majitelky**: návštěvník z DE/AT/LI → `/de/`, z PL → `/pl/`, odjinud mimo CZ → `/en/` (`script.js:46-83`). Původní nález: roboti vyhledávačů (Googlebot prochází převážně z USA) byli přesměrováni taky. Lighthouse z US IP skončil na `/en/` místo `/`, takže hrozilo, že česká verze bude vypadat jako přesměrovaná na anglickou. **Opraveno**: roboti (`bot`, `crawler`, `spider`, `slurp`, Google Inspection Tool, Lighthouse, headless prohlížeče) se nepřesměrovávají. Ověřeno v Chromiu: Googlebot, bingbot, SeznamBot → zůstanou na `/kotatka`; běžný Chrome s DE → `/de/kotatka` | — |

## 2. SEO – migrace z Webnode

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 2.1 | 301 ze starých URL | ✅ | Stará sitemap Webnode (`https://www.stelliragdoll.cz/sitemap.xml`) má 8 URL: `/`, `/sluzby/`, `/nase-prace/`, `/fotogalerie/`, `/tym/`, `/informace-ke-koupi/`, `/kontakty/`, `/kotatka/`. Na novém webu všechny skončí na `200` přes **max. 1 přesměrování**; `/sluzby/` → `/nase-prace` (`vercel.json` pravidlo `^/sluzby/?$`) | — |
| 2.2 | Řetězy a smyčky | ✅ | Žádná stará URL nemá víc než 1 hop (`curl -L` `num_redirects=1`) | — |
| 2.3 | www ↔ apex | ➖ | Dnes řeší Webnode (`stelliragdoll.cz` → 301 → `https://www.stelliragdoll.cz/`). Po přepnutí to musí řešit Vercel | Ve Vercelu přidat obě domény, `stelliragdoll.cz` nastavit jako Redirect → `www` (308/301). **S** |
| 2.4 | HTTP → HTTPS | ✅ | `http://stelli-website.vercel.app/` → 308 na https; HSTS `max-age=63072000; includeSubDomains` (`vercel.json`) | — |
| 2.5 | Checklist pro přepnutí domény | ⚠️ | `admin/config.yml:6-7`: `base_url: https://stelli-website.vercel.app` s poznámkou „TEMP… revert before going live“ | Při přepnutí: (1) `base_url` → `https://www.stelliragdoll.cz` + upravit callback URL v GitHub OAuth App; (2) přesměrovat vercel.app → doména; (3) **MX záznam dnes míří na Webnode** (`10 imap.mail.webnode.com`), takže pokud se používá nějaká adresa `@stelliragdoll.cz`, musí se pošta přesunout, jinak přestane chodit; (4) SPF `include:spfuser.webnode.com` a DMARC odkazují na Webnode, upravit; (5) zachovat TXT `google-site-verification` (Search Console); (6) odeslat sitemapu v GSC. **S** |

## 3. Strukturovaná data (JSON-LD)

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 3.1 | Organization/LocalBusiness | ⚠️ | `LocalBusiness` s `@id`, name, url, logo, email, adresa (obec + kraj), `sameAs` IG + FB na všech stránkách (`index.html` @graph). Chybí `telephone` a `geo`; Google u LocalBusiness doporučuje i `streetAddress` | Doplnit telefon (pokud ho chcete zveřejnit) a `geo`; ulici jen pokud ji chcete ukázat. Případně změnit typ na `Organization`, když nejde o provozovnu s adresou. **S** |
| 3.2 | BlogPosting | ✅ | Všech 12 článků: headline, description, image, inLanguage, datePublished `2026-09-16`, dateModified, author + publisher → `#business` | ⚠️ Datum se na stránce nikde viditelně nezobrazuje (`grep` „datum/time“ = 0); doplnit „Publikováno …“. **S** |
| 3.3 | BreadcrumbList | ✅ | Na všech podstránkách | — |
| 3.4 | FAQPage | ✅ | `informace-ke-koupi.html` (všechny jazyky) | — |
| 3.5 | Product/Offer pro koťata | ➖ | Neimplementováno; vrhy nemají cenu na webu | Nedoporučuji (bez ceny a dostupnosti by šlo o neúplná data). — |
| 3.6 | Validita JSON-LD | ✅ | Všechny bloky se parsují (Python `json`), povinná pole BlogPosting a BreadcrumbList přítomna | ➖ Doporučuji jednou projet Rich Results Test po přepnutí domény |

## 4. Obsah a struktura

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 4.1 | Klíčové stránky | ⚠️ | O nás ✅, Naše kočky (`tym`) ✅, Koťátka ✅, Info ke koupi (postup) ✅, FAQ ✅ (v Info ke koupi), Kontakt ✅, články ✅. **Samostatná stránka „Blog“ (výpis článků) chybí**, články jsou jen na úvodní stránce. Stránka `tym` nemá zmínku o **zdravotních testech** rodičů (HCM, PKD, FeLV/FIV…); jsou tam jen odkazy na PawPeds | Přidat výpis článků (M) a ke každé chovné kočce výsledky testů (S, obsah dodáte vy) |
| 4.2 | Identifikace provozovatele a zásady | ⚠️ | Zásady ✅ (`zasady-ochrany-osobnich-udaju.html`), jméno správce ✅, obec ✅, e-mail ✅. **IČO chybí**: `TODO: az bude ICO zalozene…` v patičce 56 stránek a v zásadách řádek 97. Číslo/registrace chovatelské stanice uvedeno jen jako „registrovaná ve FIFe“ (`index.html:98`) | Až bude IČO, doplnit (S). Doporučuji uvést i název klubu a registraci stanice |
| 4.3 | Blog: kategorie, data, autor, související, RSS | ⚠️ | Související články ✅, autor ✅ (jen v JSON-LD). Kategorie ❌ (u 3 článků zbytečné), viditelné datum ❌, RSS ❌ | RSS a kategorie až s víc články. Viditelné datum viz 3.2. **S/M** |
| 4.4 | Placeholdery | ✅ | `grep lorem/ipsum/webnode/picsum`: nic ve veřejném obsahu. Jediné „TODO“ jsou komentáře k IČO (neviditelné) | — |
| 4.5 | Úplnost jazyků | ✅ | Všech 14 stránek × 4 jazyky; `data/*.json` má všechny `_en/_de/_pl` texty i alt texty (skript: „complete“ u všech 6 souborů); formulář je ve 4 jazycích | — |
| 4.6 | Partnerské/affiliate odkazy | ⚠️ | `nase-prace.html:195` `ekomazlicek.cz/action/Affiliate/…`, `:202` `skrabadla-rufi.cz/?s=…` mají jen `rel="noopener"` | Přidat `rel="sponsored noopener"` (Google to u placených/affiliate odkazů vyžaduje). **S** |

## 5. Výkon

Lighthouse 12, mobil, produkce (měřeno přes proxy prostředí a z US IP, takže se kvůli přesměrování podle země skutečně měřila `/en/` verze a časy jsou spíš horší než u reálného českého návštěvníka; měřeno před opravou 1.16):

| Stránka | Perf | A11y | Best Pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 77 | 100 | 100 | 100 | 4,2 s | 0 | 20 ms |
| `/kotatka` | 85 | 100 | 100 | 100 | 3,4 s | 0 | 20 ms |
| `/rana-kastrace-kotatek` | 87 | 98 | 100 | 100 | 3,3 s | 0 | 10 ms |

INP Lighthouse v laboratoři neměří (TBT 10–20 ms naznačuje, že problém nebude) ➖ ověřit ve Vercel Speed Insights / CrUX.

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 5.1 | Obrázky: rozměry, `sizes`, alt | ⚠️ | Alt mají všechny `<img>` (0 bez alt, dekorativní mají `alt=""`). `unsized-images`: `hero-photo.webp`, `logo-icon-cat-bold*.webp` bez width/height (CLS je přesto 0). `uses-responsive-images`: úspora ~220 KB na úvodní stránce, chybí `srcset` s menšími variantami | Přidat width/height (S); vygenerovat 2–3 velikosti a `srcset` (M) |
| 5.2 | Priorita LCP obrázku | ⚠️ | `prioritize-lcp-image` / `lcp-discovery-insight`: hero foto není přednačtené | `<link rel="preload" as="image">` + `fetchpriority="high"` na hero. **S** |
| 5.3 | Velikost obrázků v repu | ✅ | `images/` = 43 MB / 428 souborů; **nad 1 MB: 0**, nad 500 KB: 1 (`images/team/kevin.jpg` 647 KB) | Kevin zmenšit. **S** |
| 5.4 | Fonty | ⚠️ | Google Fonts z CDN: `<link href="https://fonts.googleapis.com/css2?family=Manrope…">` na každé stránce. Lighthouse `render-blocking`: úspora ~1,2 s | Stáhnout Manrope (woff2) a servírovat z vlastní domény s `font-display: swap`: zrychlí a vyřeší GDPR (bod 9.4). **S–M** |
| 5.5 | Klientský JS | ✅ | Jeden `script.js` (37 KB nemin.), žádné frameworky; TBT 10–20 ms | Minifikace by ušetřila ~4 KB, nestojí za build krok |
| 5.6 | CSS | ⚠️ | `styles.css` 54 KB + `concept.css` 69 KB, oba blokují vykreslení; `unused-css-rules` ~92 KB | Dlouhodobě sloučit a pročistit. **M** |
| 5.7 | Statické generování | ✅ | Vše předgenerované (`prerender.js`), nic se nenačítá za běhu | — |
| 5.8 | Layout shifty | ✅ | CLS = 0 na všech 3 stránkách, cookie lišta neexistuje | — |
| 5.9 | Cache | ⚠️ | `images/*` 30 dní (`vercel.json:9`), CSS/JS bez dlouhé cache (nemají v názvu hash) | OK pro tento typ webu; volitelně verzovat `?v=` a dát 1 rok. **S** |

## 6. Formulář (Vstupní dotazník)

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 6.1 | Odesílání přes server | ⚠️ | `script.js:438` posílá JSON přímo z prohlížeče na `https://api.web3forms.com/submit`; vlastní server/route není | Pro tuto návštěvnost přijatelné (Web3Forms je navržené pro statické weby). Vlastní endpoint `api/form.js` by umožnil validaci, rate-limit a zálohu. **M** |
| 6.2 | Validace na serveru | ➖ | Jen klientská (`script.js:373-388`: povinná pole, regex e-mailu); serverovou dělá Web3Forms, z kódu neověřitelné | Viz 6.1 |
| 6.3 | Anti-spam | ⚠️ | Honeypot ✅ (`dotaznik.html:81` `name="botcheck"`, Web3Forms ho vyhodnocuje). Captcha ❌ | hCaptcha/Turnstile jen pokud začne chodit spam. — |
| 6.4 | Rate limiting | ➖ | V kódu není; Web3Forms má limity na účet (z kódu neověřitelné) | — |
| 6.5 | Klíče jen v env | ✅ | `WEB3FORMS_ACCESS_KEY` je veřejně v `script.js:356`, **což je u Web3Forms záměr** (klíč umí jen poslat zprávu na předem nastavený e-mail). Tajné klíče (`OAUTH_CLIENT_SECRET`, `DEEPL_API_KEY`) jsou jen v env/GitHub Secrets (`api/callback.js:24`, `auto-translate.yml:30`) | V nastavení Web3Forms zapnout omezení na doménu, pokud to plán umožňuje. ➖ |
| 6.6 | Žádná tajemství v Gitu | ✅ | `.gitignore`: `node_modules/`, `.DS_Store`, `.vercel/`. Prohledání historie (`git log --all -p` na `ghp_`, `github_pat_`, `sk-`, `AKIA`, `-----BEGIN`, `client_secret=`…): nic. Nikdy necommitnutý `.env`. ⚠️ Klon je mělký (`--is-shallow-repository` = true, 82 commitů) | Pro úplnost spustit `gitleaks` na plném klonu. **S** |
| 6.7 | Souhlas a odkaz na zásady | ✅ | `dotaznik.html:258-262`: povinný checkbox s odkazem na zásady; hodnota „Ano, souhlasím“ odchází v e-mailu, takže je zdokumentovaný | — |
| 6.8 | Ošetření chyb | ✅ | `script.js:410-417`: srozumitelná hláška ve 4 jazycích s náhradním e-mailem, `role="alert"`, žádné technické detaily | — |
| 6.9 | Potvrzení a spolehlivost | ⚠️ | Po úspěchu se zobrazí poděkování. Jediná cesta doručení: když Web3Forms vrátí OK, ale e-mail neodejde (spam, limit), zpráva se ztratí; žádná záloha ani kopie odesílateli | Zapnout v Web3Forms autoodpověď / kopii, případně druhý cíl (webhook do Google Sheets). ➖ ověřit nastavení účtu. **S** |
| 6.10 | Injekce do hlaviček / open relay | ✅ | Příjemce je pevně daný klíčem, uživatel nemůže určit adresu; subject je pevný z `data-subject` | — |
| 6.11 | Přístupnost formuláře | ⚠️ | Všechna pole mají `<label for>` (24 labelů / 25 polí, chybějící je honeypot) ✅, `aria-invalid` ✅, focus na první chybné pole ✅. Ale chybové `<span class="form-error">` nejsou svázané přes `aria-describedby` (0 výskytů), takže čtečka chybu u pole nepřečte | Přidat `id` na chyby a `aria-describedby` na pole. **S** |

## 7. Zabezpečení

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 7.1 | Bezpečnostní hlavičky | ✅ | Produkce: CSP (`script-src 'self'`), HSTS, `X-Content-Type-Options: nosniff`, `frame-ancestors 'self'` (admin `'none'`), `Referrer-Policy`, `Permissions-Policy` (od PR #15) | — |
| 7.2 | npm audit | ➖ | Žádný `package.json`, web nemá runtime závislosti | — |
| 7.3 | Aktuálnost závislostí | ⚠️ | Jediná závislost je vendorovaná **Sveltia CMS v0.172.2** (`admin/index.html`, z 21. 7. 2026); aktuální je **0.233.1** (npm, 10. 10. 2026). GitHub Actions `checkout@v4`, `setup-node@v4` | Aktualizovat `admin/sveltia-cms.js` a vyzkoušet CMS. **S–M** |
| 7.4 | Dependabot | ❌ | `.github/dependabot.yml` neexistuje | Přidat Dependabot pro `github-actions` (Sveltia je vendorovaná, tu musí hlídat člověk). **S** |
| 7.5 | Nebezpečné vkládání HTML | ✅ | `script.js:475` a `:747` `innerHTML` jen se statickým SVG/kódem; obsah z CMS se escapuje při prerenderu (`escapeHtml(` 32× v `render-templates.js`) | — |
| 7.6 | Externí skripty a iframy | ⚠️ | Skripty: jen vlastní + `/_vercel/insights` (stejný původ). Spojení: `ipapi.co`, `api.web3forms.com`, Google Fonts; iframe Google Maps (`kontakty.html:129`). Vše v CSP | Viz 1.16, 5.4, 9.3 |
| 7.7 | Admin/API chráněné | ✅ | `/admin` je jen statická aplikace, přístup přes GitHub OAuth (`repo` scope). `/api/callback` ověřuje `state` (CSRF) a od PR #15 posílá token jen na povolené domény (`api/callback.js:16-20`) | ⚠️ Scope `repo` dává CMS přístup ke všem repozitářům účtu; to je omezení Sveltia/Decap GitHub backendu. Alternativa: GitHub App s přístupem jen k tomuto repu. **M** |
| 7.8 | Prozrazování verzí | ✅ | Hlavička `server: Vercel`, žádné `x-powered-by` | — |
| 7.9 | Source mapy | ✅ | `sveltia-cms.js` nemá `sourceMappingURL` | — |
| 7.10 | Vercel nastavení | ➖ | Preview chráněné SSO ✅ (ověřeno). Oprávnění týmu a rozdělení env proměnných na Production/Preview z kódu neověřím | Zkontrolovat ve Vercel → Settings → Environment Variables, že `OAUTH_CLIENT_SECRET` je jen v Production |
| 7.11 | Účty a doména | ➖ | DNS dnes: NS `register.it` (Webnode), **DNSSEC není aktivní** (žádný DS záznam), **CAA chybí**, SPF `-all` přes Webnode, DMARC `p=none` | Ručně: **2FA** na GitHubu, Vercelu, WEDOSu, Web3Forms, Gmailu, DeepL; zámek domény u registrátora; po přenosu na WEDOS zapnout DNSSEC (s DNS, které doménu skutečně obsluhuje); přidat CAA `letsencrypt.org`; upravit SPF/DMARC podle toho, odkud bude chodit pošta |
| 7.12 | GitHub workflow | ⚠️ | `auto-translate.yml` má `permissions: contents: write` a commituje do `main`; při souběhu dvou uložení z CMS může `git push` selhat (bez `pull --rebase`) | Přidat `git pull --rebase` před push a `concurrency` skupinu. **S** |

## 8. Přístupnost (WCAG 2.1/2.2 AA)

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 8.1 | Sémantika, skip link | ✅ | `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>` u karet; skip link `index.html:65` „Přeskočit na obsah“ | — |
| 8.2 | Alt texty | ✅ | 0 obrázků bez `alt`; popisné alty u koťat, týmu, galerie (generované s názvem vrhu); dekorativní `alt=""` | — |
| 8.3 | Kontrast | ✅ | Lighthouse `color-contrast` prošel na všech 3 stránkách (a11y 100/100/98) | ➖ Text přes fotky v hero ověřit ručně na mobilu |
| 8.4 | Focus a klávesnice | ⚠️ | Pravidla `:focus`/`:focus-visible` existují (4× v každém CSS). `styles.css:851` dává polím formuláře `outline: none`, ale nahrazuje ho rámečkem + stínem (OK) | ➖ Projít web ručně tabulátorem (menu na mobilu, lightbox galerie) |
| 8.5 | Přepínač jazyků | ✅ | `index.html:79`: `<a class="lang-link" hreflang="en" aria-label="English">` | Volitelně doplnit `lang="en"` na odkaz. **S** |
| 8.6 | prefers-reduced-motion | ✅ | `styles.css:1132` globálně vypíná animace; `script.js:470` vypíná maskota | — |
| 8.7 | Chyby formuláře pro čtečky | ⚠️ | viz 6.11 | **S** |
| 8.8 | Automatický test | ✅ | Lighthouse a11y: 100 / 100 / 98; jediná chyba `heading-order` (bod 1.8) | — |

## 9. GDPR a cookies

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 9.1 | Seznam úložišť a trackerů | ✅ | `localStorage.stelli_lang` (zvolený jazyk, `script.js:41`), `sessionStorage.stelli_autorouted` (`script.js:48`), cookie `oauth_state` jen v adminu (`api/auth.js:20`). Třetí strany: ipapi.co (IP → země), Google Fonts, Google Maps (iframe), Web3Forms, Vercel Web Analytics (bez cookies) | — |
| 9.2 | Analytika | ✅ | Jen Vercel Web Analytics (cookieless), není potřeba cookie lišta | — |
| 9.3 | **Google Maps bez souhlasu** | ❌ **kritické** | `kontakty.html:129`: iframe `google.com/maps/embed` se načte automaticky (jen `loading="lazy"`). Google při tom nastavuje cookies (NID…) a dostává IP, a to bez souhlasu. Zásady to sice zmiňují, ale ePrivacy pravidla vyžadují souhlas předem | Nahradit statickým obrázkem mapy s tlačítkem „Zobrazit mapu“ (načte iframe až po kliknutí), nebo jen odkazem „Otevřít v Mapách“. ➖ Navíc embed URL vypadá jako ručně složená (`!2d15.0!3d50.5`, `4v1700000000000`), ověřit, že ukazuje správné místo. **S** |
| 9.4 | Google Fonts z CDN | ⚠️ | viz 5.4; IP návštěvníka jde Googlu při každé stránce. Zásady to uvádějí, ale v EU je to známý předmět stížností (rozsudek LG München 2022) | Self-host fontu vyřeší GDPR i výkon. **S–M** |
| 9.5 | ipapi.co | ⚠️ | IP se posílá třetí straně při první návštěvě; zásady to popisují (`zasady-ochrany-osobnich-udaju.html:101`). Jde o záměrnou funkci (výběr jazyka podle země) | Ponechat; volitelně zvážit `navigator.language` místo IP, které nic neposílá ven. — |
| 9.6 | Obsah zásad | ⚠️ | Správce ✅, účel ✅, doba uchování ✅ (do 2 let), práva ✅ + ÚOOÚ ✅, příjemci: Web3Forms ✅, Google Fonts/Maps ✅, ipapi ✅, Vercel Analytics ✅. **Chybí**: Vercel jako hosting (zpracovatel logů/IP), Gmail/Google jako poskytovatel e-mailu, kde zprávy končí, **předání mimo EU** (Web3Forms, Vercel, Google jsou z USA, takže je potřeba zmínit EU-US Data Privacy Framework nebo SCC), u formuláře je jako právní základ jen „souhlas“, přesnější je čl. 6 odst. 1 písm. b) (jednání o smlouvě) | Doplnit odstavec o hostingu, e-mailu a předání do USA. **S** |

## 10. Kvalita kódu a provoz

| # | Položka | Stav | Důkaz | Oprava |
|---|---|---|---|---|
| 10.1 | Build/lint/tsc | ➖ | Není build ani TypeScript. `node -e "require('./api/callback.js')"` a parsování všech JSON-LD i `vercel.json` projde | — |
| 10.2 | TypeScript strict | ➖ | Nepoužívá se | — |
| 10.3 | Mrtvý kód | ⚠️ | `styles.css` + `concept.css`: ~92 KB nepoužitých pravidel (Lighthouse); v `script.js:422` větev pro neexistující placeholder klíč `YOUR_WEB3FORMS_ACCESS_KEY` | Úklid CSS (M), odstranit placeholder větev (S) |
| 10.4 | README a env | ⚠️ | `README.md` popisuje nasazení a větve, ale: zmiňuje workflow přes `dev` (dnes se pracuje přímo přes `main`), **nepopisuje env proměnné** (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `DEEPL_API_KEY`) ani lokální spuštění; `.env.example` není | Doplnit sekci „Proměnné prostředí“ a „Lokální spuštění“ (`python3 -m http.server`). **S** |
| 10.5 | .gitignore | ✅ | `node_modules/`, `.DS_Store`, `.vercel/`; `.env` v projektu není | Preventivně přidat `.env*`. **S** |
| 10.6 | Monitoring | ⚠️ | Vercel Web Analytics ✅ (`/_vercel/insights` na všech stránkách). Speed Insights skript na serveru existuje (`200`), ale stránky ho nenačítají. Uptime monitor ➖ | Zapnout Speed Insights (S); UptimeRobot zdarma na `/` a `/kotatka` (S, ručně) |
| 10.7 | Zálohy | ✅ | Veškerý obsah (texty, `data/*.json`, obrázky) je v Gitu na GitHubu, tedy plná historie. Odeslané formuláře se ukládají jen v e-mailu | ➖ Ověřit, že Gmail se zprávami je zálohovaný / nemaže se |

## 11. Viditelnost (úkoly pro vás, mimo kód)

- **Google Search Console**: doména už má TXT `google-site-verification` (DNS), takže je pravděpodobně ověřená. Po přepnutí odeslat `https://www.stelliragdoll.cz/sitemap.xml` a sledovat „Stránky“ a „Přesměrování“ (hlavně bod 1.16).
- **Bing Webmaster Tools**: import z GSC jedním klikem.
- **Google Business Profile**: pro chovatelskou stanici bez kamenné provozovny jde nastavit jako „firma s oblastí působnosti“ (adresa skrytá). **Firmy.cz** (Seznam je v ČR podstatný), profil na **ifauna.cz** s odkazem na web.
- **Návrh článků** (záměr vyhledávání):
  1. *Kolik stojí ragdoll koťátko a co je v ceně* – „ragdoll cena“ (komerční/informační, nejvyšší potenciál)
  2. *Ragdoll koťata ke koupi – jak poznat dobrou chovatelskou stanici* – „ragdoll koťata prodej“ (komerční)
  3. *Péče o ragdolla: srst, krmení, zdraví* – „péče o ragdoll“ (informační)
  4. *Ragdoll vs. britská krátkosrstá kočka* – „ragdoll nebo britská kočka“ (srovnání před koupí)
  5. *Barvy a vzory ragdollů (seal, blue, mitted, bicolor)* – „ragdoll barvy“ (informační, navazuje na článek o bílých koťatech)
  6. *Ragdoll a děti / ragdoll do bytu* – „je ragdoll vhodný do bytu“ (informační)
  7. *Zdravotní testy u ragdollů (HCM, PKD)* – „ragdoll HCM“ (důvěra, podpoří stránku Naše kočky)
  8. *Příprava domácnosti na příchod koťátka – checklist* – „co koupit pro kotě“ (informační, prostor pro partnerské odkazy)
- **Struktura prolinkování (pilíře)**:
  - Pilíř **„Koupě koťátka Ragdoll“** = stránka Info ke koupi ← články 1, 2, 8 + Raná kastrace
  - Pilíř **„Plemeno Ragdoll“** = Poznejte Ragdoll ← články 3, 4, 5, 6 + Proč se rodí bílá
  - Pilíř **„Zdraví“** = stránka Naše kočky ← článek 7 + Raná kastrace
  - Každý článek končí CTA na Koťátka / Dotazník.

---

## Priority

### Kritické
1. ~~**1.16 Automatické přesměrování podle IP**~~: ✅ vyřešeno. Přesměrování je záměr, roboti vyhledávačů se od teď nepřesměrovávají.
2. **9.3 Google Maps bez souhlasu**: cookies třetí strany před souhlasem. (S)
3. **2.5 Checklist přepnutí domény**: `base_url` v CMS, přesměrování vercel.app, **MX záznam na Webnode** (riziko ztráty pošty na doméně), SPF/DMARC. (S)
4. **7.11 2FA na všech účtech** (GitHub, Vercel, WEDOS, Gmail, Web3Forms, DeepL) + zámek domény. (ručně)

### Důležité
5. 5.4 / 9.4 Self-host fontu Manrope (GDPR + −1 s vykreslení)
6. 9.6 Doplnit zásady (hosting Vercel, Gmail, předání do USA, právní základ)
7. 4.6 `rel="sponsored"` u affiliate odkazů
8. 1.8 Hierarchie nadpisů v článcích (H1 → H2)
9. 6.11 / 8.7 `aria-describedby` u chyb formuláře
10. 7.3 / 7.4 Aktualizace Sveltia CMS + Dependabot pro Actions
11. 1.3 Zkrátit 12 meta descriptions
12. 1.9 og:url + OG obrázky 1200×630 pro články
13. 7.12 Bezpečnější push v auto-translate workflow
14. 4.2 IČO, až bude

### Vylepšení
15. 1.15 Kontextové prolinkování stránek ↔ články
16. 5.1 / 5.2 `srcset`, width/height, preload hero obrázku
17. 4.1 Výpis blogu, zdravotní testy u koček
18. 3.2 Viditelné datum u článků; 3.1 telefon/geo v LocalBusiness
19. 1.1 Automatická sitemap s aktuálním `lastmod`
20. 10.4 README s env proměnnými; 10.6 Speed Insights + uptime monitor
21. 6.9 Kopie/záloha odeslaných formulářů

---

## Top 10 oprav podle poměru dopad / náročnost

| Pořadí | Oprava | Dopad | Náročnost |
|---|---|---|---|
| 1 | ✅ **Hotovo**: přesměrování podle země vynechává roboty vyhledávačů – 1.16 | SEO české verze | S |
| 2 | Google Maps načíst až po kliknutí – 9.3 | GDPR | S |
| 3 | Připravit a odškrtat checklist přepnutí domény – 2.3, 2.5, 1.13 | Bez ztráty SEO a pošty při migraci | S |
| 4 | 2FA + zámek domény (vy) – 7.11 | Bezpečnost celého webu | S (ručně) |
| 5 | Self-host fontu – 5.4, 9.4 | GDPR + rychlost | S–M |
| 6 | `rel="sponsored"` u partnerských odkazů – 4.6 | Soulad s pravidly Google | S |
| 7 | Doplnit zásady o hosting, e-mail, USA – 9.6 | GDPR | S |
| 8 | H2 v článcích + `aria-describedby` ve formuláři – 1.8, 6.11 | SEO struktura + přístupnost | S |
| 9 | Zkrátit dlouhé descriptions + og:url + OG obrázky článků – 1.3, 1.9 | CTR ve výsledcích a sdílení | S |
| 10 | Aktualizovat Sveltia CMS + Dependabot pro Actions – 7.3, 7.4 | Bezpečnost CMS (drží GitHub token) | S–M |

*Provedeno: 1.16 (roboti vynecháni z přesměrování). Ostatní body čekají na schválení.*
