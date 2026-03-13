# 📉📈 Seasonal Trade Optimizer

## Schritt-für-Schritt Anleitung: Auf Vercel deployen

### Was du brauchst
- Einen kostenlosen Account auf vercel.com
- Einen kostenlosen Account auf github.com
- Einen Browser (funktioniert auf iPad und PC)

---

### Schritt 1 – GitHub Account anlegen (falls noch nicht vorhanden)
1. Gehe zu https://github.com
2. Klicke „Sign up" und erstelle einen kostenlosen Account

### Schritt 2 – Neues Repository erstellen
1. Nach dem Login: Klicke das „+" oben rechts → „New repository"
2. Name: `trade-optimizer` (oder beliebig)
3. Sichtbarkeit: „Private" wählen
4. Klicke „Create repository"

### Schritt 3 – Dateien hochladen
1. Im neuen Repository: Klicke „uploading an existing file"
2. Lade alle Dateien aus diesem ZIP-Paket hoch (Ordnerstruktur beachten!)
3. Klicke „Commit changes"

Die Struktur muss so aussehen:
```
trade-optimizer/
├── package.json
├── vercel.json
├── public/
│   └── index.html
├── api/
│   └── marketdata.js
└── src/
    ├── index.js
    └── App.jsx
```

### Schritt 4 – Vercel Account anlegen
1. Gehe zu https://vercel.com
2. Klicke „Sign Up" → „Continue with GitHub"
3. Erlaube Vercel den Zugriff auf GitHub

### Schritt 5 – Projekt deployen
1. Im Vercel Dashboard: Klicke „Add New Project"
2. Wähle dein `trade-optimizer` Repository aus
3. Framework: „Create React App" wird automatisch erkannt
4. Klicke „Deploy"
5. Nach ~2 Minuten: Deine App ist live! Du erhältst eine URL wie:
   `https://trade-optimizer-deinname.vercel.app`

### Schritt 6 – Auf dem iPad als App speichern
1. Öffne die Vercel-URL in Safari auf dem iPad
2. Tippe das Teilen-Symbol (□↑) unten in der Mitte
3. Scrolle und tippe „Zum Home-Bildschirm"
4. Namen vergeben → „Hinzufügen"
5. Die App erscheint jetzt als Icon auf dem iPad-Homescreen!

---

## Live-Daten
Die App lädt automatisch alle 15 Minuten aktuelle Daten von:
- **Yahoo Finance** – Kurse, 200-MA, Tagesperformance (15 Min. verzögert)
- **FRED (Federal Reserve)** – Zinskurve, Leitzins

**COT-Daten** müssen manuell geprüft werden (jeden Freitag auf cotbase.com)

---

## Kosten
- GitHub: kostenlos
- Vercel: kostenlos (Hobby-Plan reicht vollständig)
- Datenquellen: alle kostenlos, kein API-Key nötig
