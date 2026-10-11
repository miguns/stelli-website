# Audit webu stelliragdoll.cz (Next.js, Vercel)

## Zadání pro Claude Code

Projdi celý repozitář a proveď audit podle checklistu níže. **Zatím nic neměň.** Výstupem je soubor `AUDIT_REPORT.md` v kořeni repa s tímto formátem:

- U každé položky stav: ✅ OK / ⚠️ částečně / ❌ chybí / ➖ nelze ověřit z kódu
- Konkrétní důkaz (cesta k souboru + řádek, nebo výstup příkazu)
- U ⚠️ a ❌ navržená oprava (stručně, s odhadem náročnosti: S / M / L)
- Na konci seznam priorit: **Kritické** (bezpečnost, ztráta SEO, GDPR) → **Důležité** → **Vylepšení**

Pak počkej na mé schválení, které opravy provést.

Kontext: web chovatelské stanice ragdoll koček + blog, Next.js (App Router), hosting Vercel, repo na GitHubu, vícejazyčné verze, formulář pro zájemce o koťata napojený na Airtable a doručení do Gmailu, migrace domény z Webnode přes WEDOS na Vercel. Návštěvnost cca 20–80 denně.

Nejdřív zjisti verzi Next.js, zda se používá App Router nebo Pages Router, způsob i18n, správce balíčků a strukturu blogu (MDX/Markdown/CMS). Podle toho uprav konkrétní kontroly.

---

## 1. SEO – technické

- [ ] `app/sitemap.ts` (nebo `sitemap.xml`) existuje, obsahuje všechny veřejné stránky a články i všechny jazykové verze
- [ ] `app/robots.ts` (nebo `robots.txt`) existuje, odkazuje na sitemapu, neblokuje CSS/JS/obrázky
- [ ] Každá stránka a článek má unikátní `title` a `description` (`generateMetadata` / `metadata`), title do ~60 znaků, description do ~155
- [ ] `metadataBase` je nastaveno na produkční doménu
- [ ] Canonical URL (`alternates.canonical`) na každé stránce, bez duplicit (www vs. bez www, trailing slash, parametry)
- [ ] Hreflang přes `alternates.languages` včetně `x-default`, vzájemně konzistentní mezi jazyky
- [ ] `<html lang>` odpovídá jazyku stránky
- [ ] Právě jedno `<h1>` na stránce, logická hierarchie H2–H3
- [ ] Open Graph a Twitter karty (title, description, obrázek 1200×630) na stránkách i článcích
- [ ] Favicon, `apple-touch-icon`, `manifest`
- [ ] Vlastní `not-found.tsx` (404) a `error.tsx`, 404 vrací skutečný stavový kód 404
- [ ] Žádné `noindex` na stránkách, které se mají indexovat; `noindex` na těch, které ne (děkovné stránky, preview)
- [ ] Preview deploymenty Vercelu nejsou indexovatelné
- [ ] Rozbité interní i externí odkazy (projdi všechny `href` a `Link`)
- [ ] Interní prolinkování: články ↔ stránky koťat ↔ O nás ↔ kontakt

## 2. SEO – migrace z Webnode

- [ ] V `next.config.js` jsou 301 přesměrování ze starých Webnode URL na nové (pokud znáš staré URL, porovnej; jinak vypiš, co chybí a co je potřeba doplnit)
- [ ] Žádné řetězy přesměrování (A→B→C) a smyčky
- [ ] Přesměrování `www` ↔ apex je jednotné
- [ ] Přesměrování HTTP → HTTPS

## 3. Strukturovaná data (JSON-LD)

- [ ] `Organization` / `LocalBusiness` (název, logo, URL, kontakt, sociální profily)
- [ ] `BlogPosting` / `Article` u článků (autor, datePublished, dateModified, obrázek)
- [ ] `BreadcrumbList`
- [ ] `FAQPage` tam, kde je FAQ
- [ ] `Product` + `Offer` nebo jiný vhodný typ pro koťata, jen pokud odpovídá obsahu
- [ ] JSON-LD je validní (zkontroluj strukturu, chybějící povinná pole)

## 4. Obsah a struktura webu

- [ ] Existují stránky: O nás, Naše kočky (rodiče, zdravotní testy), Koťata (aktuální/plánované vrhy), Jak adoptovat / postup, FAQ, Kontakt, Blog
- [ ] Zásady zpracování osobních údajů a identifikace provozovatele (jméno/IČO/sídlo, příp. klub a číslo chovatelské stanice)
- [ ] Blog: kategorie/štítky, datum publikace i aktualizace, autor, související články, RSS feed
- [ ] Žádný placeholder text (lorem ipsum, TODO, „Webnode", staré kontakty)
- [ ] Všechny jazykové verze jsou obsahově kompletní (nechybí přeložené stránky, metadata, alt texty, formulář)

## 5. Výkon

- [ ] Všechny obrázky přes `next/image` se správným `sizes`, `width`/`height`, `alt`
- [ ] `priority` jen na hero/LCP obrázku
- [ ] Velikost zdrojových obrázků v repu (vypiš soubory nad 500 KB a nad 1 MB)
- [ ] Fonty přes `next/font`, žádné blokující externí CSS
- [ ] Minimum `"use client"` komponent; vypiš ty, které by mohly být serverové
- [ ] Velké závislosti na klientovi (spusť analýzu bundle, např. `@next/bundle-analyzer`, pokud to jde)
- [ ] Statické generování / ISR tam, kde to dává smysl, žádné zbytečné dynamické renderování
- [ ] Žádné layout shifty (rozměry médií, fonty, banner s cookie lištou)
- [ ] Pokud je to možné, spusť Lighthouse na produkční build (mobil) a zapiš výsledky (Performance, Accessibility, Best Practices, SEO, LCP, INP, CLS)

## 6. Formulář pro zájemce o koťata

- [ ] Odesílání jde přes Server Action nebo Route Handler, ne přímo z klienta do Airtable
- [ ] Validace na serveru (např. Zod) – typy, délky, e-mail, povinná pole
- [ ] Anti-spam: honeypot a/nebo Turnstile/reCAPTCHA
- [ ] Rate limiting (podle IP)
- [ ] Airtable token, API klíče a e-mailové klíče jsou jen v env proměnných bez `NEXT_PUBLIC_`
- [ ] Žádné tajné hodnoty v repu ani v historii Gitu (`.env*` v `.gitignore`; prohledej historii, např. `gitleaks` nebo `git log -p` na typické vzory klíčů)
- [ ] Souhlas se zpracováním osobních údajů (checkbox + odkaz na zásady), uložený souhlas
- [ ] Ošetření chyb: uživatel vidí srozumitelnou hlášku, nic neunikne do odpovědi (stack trace)
- [ ] Potvrzení po odeslání a doručení do Gmailu; ověř, jak je zajištěna spolehlivost (co se stane, když Airtable nebo e-mail selže)
- [ ] Ochrana před injekcí do hlaviček e-mailu a před zneužitím jako open relay
- [ ] Formulář je přístupný (labely, chybové hlášky přes `aria-describedby`, ovladatelnost klávesnicí)

## 7. Zabezpečení

- [ ] Bezpečnostní hlavičky v `next.config.js` / `middleware`: CSP, HSTS, X-Content-Type-Options, X-Frame-Options nebo `frame-ancestors`, Referrer-Policy, Permissions-Policy
- [ ] `npm audit` (nebo ekvivalent) – vypiš zranitelnosti podle závažnosti
- [ ] Next.js a klíčové závislosti jsou aktuální (porovnej s poslední stabilní verzí a známými bezpečnostními záplatami)
- [ ] Dependabot / Renovate nastaven (`.github/dependabot.yml`)
- [ ] Žádné `dangerouslySetInnerHTML` bez sanitizace; u MDX/Markdown zkontroluj, že se nevykresluje nedůvěryhodný obsah
- [ ] Externí skripty a iframe (analytika, mapy, sociální sítě): seznam, zda jsou nutné a zda jsou v CSP
- [ ] Debug/admin/API trasy nejsou veřejně dostupné bez ochrany
- [ ] `poweredByHeader: false`, žádné zbytečné prozrazování verzí
- [ ] Source mapy v produkci nejsou veřejné, pokud to není záměr
- [ ] Vercel: ochrana preview deploymentů, oprávnění týmu, env proměnné rozdělené na Production/Preview/Development
- [ ] Doména (nelze z kódu, uveď do reportu jako ručně ověřit): 2FA na GitHubu, Vercelu, WEDOSu, Airtable, Gmailu; registrar lock; DNSSEC po přenosu domény odpovídá novému DNS (jinak hrozí nefunkční resoluce); SPF/DKIM/DMARC pro odesílání z domény

## 8. Přístupnost (WCAG 2.1/2.2 AA)

- [ ] Sémantické HTML (`header`, `nav`, `main`, `article`, `footer`), skip link
- [ ] Alt texty u všech obrázků (popisné, ne „image1.jpg"), dekorativní obrázky s prázdným `alt`
- [ ] Kontrast textu (zejména text přes fotky), kontrola barev v CSS
- [ ] Viditelný focus, ovladatelnost celého webu klávesnicí
- [ ] Přepínač jazyků je přístupný a má `lang`/`hreflang` na odkazech
- [ ] Respektování `prefers-reduced-motion` u animací
- [ ] Formulářová pole mají labely, chyby jsou oznamovány čtečkám
- [ ] Spusť automatický test (např. `axe` / `pa11y` / Lighthouse a11y), pokud to jde

## 9. GDPR a cookies

- [ ] Seznam všech cookies/localStorage/trackerů, které web nastavuje (vypiš zdroj)
- [ ] Analytika: pokud je cookieless (Plausible, Umami, Vercel Analytics), cookie lišta nemusí být; pokud GA4 nebo marketingové skripty, musí být souhlas **před** načtením skriptů
- [ ] Cookie lišta (pokud existuje): odmítnutí stejně snadné jako přijetí, skripty se bez souhlasu nenačítají
- [ ] Žádné zbytečné třetí strany (Google Fonts z CDN, YouTube embed bez `youtube-nocookie`, mapy) bez informování nebo souhlasu
- [ ] Zásady zpracování údajů obsahují správce, účel, právní základ, dobu uchování, příjemce (Airtable, Google, Vercel, Resend…), práva subjektů

## 10. Kvalita kódu a provoz

- [ ] `npm run build` projde bez chyb a varování, `npm run lint` a `tsc --noEmit` čisté
- [ ] TypeScript strict mode
- [ ] Žádný mrtvý kód, nepoužívané závislosti (`depcheck` / `knip`)
- [ ] `README` s postupem lokálního spuštění a seznamem env proměnných (bez hodnot), `.env.example`
- [ ] Správné `.gitignore` (žádné `.env`, `.next`, `node_modules`)
- [ ] Monitoring: Vercel Analytics / Speed Insights, upozornění na chyby, uptime monitor (UptimeRobot, Better Stack)
- [ ] Zálohy: obsah blogu a data (Airtable) mají export nebo zálohu

## 11. Viditelnost (mimo kód, jen uveď do reportu jako úkoly pro mě)

- [ ] Google Search Console a Bing Webmaster Tools: ověření domény, odeslaná sitemapa
- [ ] Google Business Profile, Firmy.cz, profily na sociálních sítích s odkazem na web
- [ ] Návrh 5–10 článků na klíčová slova typu „ragdoll cena", „péče o ragdoll", „ragdoll koťata ke koupi", „ragdoll vs. britská kočka", s odhadem záměru vyhledávání
- [ ] Návrh vnitřní prolinkovací struktury blogu (pilíře a podčlánky)

---

## Pravidla pro Claude Code při auditu

1. Nic neměň, nic necommituj. Jen čti, spouštěj analytické příkazy a piš `AUDIT_REPORT.md`.
2. Nevypisuj do reportu hodnoty tajných klíčů, jen kde se nacházejí.
3. Co nejde ověřit z kódu, označ ➖ a napiš, jak to ověřit ručně.
4. Nehádej: u každého zjištění uveď soubor a řádek nebo výstup příkazu.
5. Na konci uveď top 10 oprav seřazených podle poměru dopad / náročnost.
