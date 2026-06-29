# StElli Ragdoll - Statický Web

Toto je modernizovaná verze webu chovatelské stanice StElli, vytvořená jako statický web (vanilla HTML/CSS/JS) na GitHubu a nasazená přes Vercel.

## Struktura projektu

```
stelli-website/
├── index.html                 # Úvod (homepage)
├── o-nas.html                 # O nás
├── nase-prace.html            # Naše práce
├── kotatka.html               # Koťátka
├── informace-ke-koupi.html    # Informace ke koupi
├── tym.html                   # Chovné kočky
├── kontakty.html              # Kontakty
├── styles.css                 # Centrální stylesheet
├── script.js                  # JavaScript pro interaktivitu
├── README.md                  # Tato dokumentace
└── .gitignore                 # Git ignore soubor
```

## Jak nasadit na GitHub a Vercel

### 1. Vytvoření GitHub repozitáře

```bash
# Inicializuj Git v tomto adresáři
git init

# Přidej všechny soubory
git add .

# Vytvoř první commit
git commit -m "Initial commit - StElli website"

# Vytvoř nový repository na GitHub.com (bez README, .gitignore, licence)

# Přidej remote a pushni
git remote add origin https://github.com/TVOJE_UZIVATEL/stelli-website.git
git branch -M main
git push -u origin main
```

### 2. Nasazení na Vercel

#### Varianta A: Přes Vercel web interface (nejjednodušší)

1. Jdi na https://vercel.com a přihlášeníse
2. Klikni na "Add New..." → "Project"
3. Vyber svůj `stelli-website` repozitář
4. Klikni "Import" (výchozí nastavení jsou OK)
5. Počkej na deployment ~1-2 minuty
6. Vercel ti dá veřejnou URL (např. `stelli-website.vercel.app`)

#### Varianta B: Přes Vercel CLI

```bash
# Instaluj Vercel CLI
npm install -g vercel

# Přihlášení
vercel login

# Nasazení z aktuálního adresáře
vercel
```

### 3. Připojení vlastní domény

Pokud chceš použít `stelliragdoll.cz`:

1. V Vercel projektu jdi na "Settings" → "Domains"
2. Přidej svou doménu `stelliragdoll.cz`
3. Updatuj DNS u svého registrátora domény na Vercel nameservery:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

Nebo pokud chceš ponechat svého DNS poskytovatele, přidej CNAME záznam:
```
CNAME  www  cname.vercel-dns.com
```

## Údržba a úpravy

### Editování obsahu

- Edituj přímo HTML soubory (čisté HTML bez frameworku)
- CSS je v `styles.css` (responsive design, mobile-first)
- JavaScript v `script.js` (mobilní menu toggle, formuláře)

### Přidávání fotografií

1. Vytvoř složku `images/` v projektu
2. Vlož tam své fotky
3. V HTML použi: `<img src="images/nazev.jpg" alt="popis">`

### Publikování změn

```bash
# Edituj soubory
# ...

# Commitni
git add .
git commit -m "Popis změn"

# Pushni na GitHub
git push

# Vercel se automaticky nasadí během 30 sekund!
```

## Vlastnosti

✅ **Responzivní design** - funguje na mobilu, tabletu, desktopu  
✅ **Rychlý** - statický obsah, žádné databáze  
✅ **SEO optimalizované** - meta tagy, správná struktura HTML  
✅ **Bez závislostí** - čisté HTML/CSS/JS  
✅ **Snadná údržba** - všechny soubory na jednom místě  
✅ **Automatický deployment** - push na GitHub = live web za 30 sekund  

## Formuláře

Formuláře na webu momentálně zobrazují apenas potvrzovací zprávu. Pokud chceš aby fungovaly:

### Možnost 1: Formspree (doporučuji)

1. Jdi na https://formspree.io
2. Registruj se a vytvoř nový form
3. Dostaneš `form_id`
4. V HTML změň `<form>` na:
```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### Možnost 2: EmailJS

1. Jdi na https://www.emailjs.com
2. Registruj se a nastav email
3. V `script.js` ulož API klíč a změň form handling

## Kontakt a podpora

- Email: stellicattery@gmail.com
- Instagram: @stelliragdoll
- Facebook: StElli Ragdoll

## Licence

© 2026 StElli Ragdoll. Všechna práva vyhrazena.
