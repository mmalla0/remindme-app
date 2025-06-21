# 💡 RemindMe App

Eine einfache, offlinefähige Webanwendung zur Unterstützung von Menschen mit Demenz – z. B. zur Erinnerung an Medikamente, Trinken, Routinen.

## 🚀 Features

- SQLite-Datenbank (lokal, keine Serverinstallation nötig)
- Backend mit Node.js + Express
- Frontend mit Angular (Standalone)
- API-Statusprüfung (`/api/message`)
- Gemeinsamer Start mit `npm start`
- Optional: grafische Datenbankansicht mit DB Browser

---

## 📦 Projektstruktur
remindme-app/
├── backend/          ← Express + SQLite
│   └── src/
│       ├── db.js
│       └── index.js
├── frontend/         ← Angular-App
├── data/             ← Datenbank-Datei (wird automatisch erstellt)
├── package.json      ← Startskript für beide Systeme

---

## 🛠 Voraussetzungen (bei allen Teammitgliedern)

| Tool             | Version        | Beschreibung                      |
|------------------|----------------|-----------------------------------|
| [Node.js](https://nodejs.org) | 18+ empfohlen | Für Backend & Angular |
| [Angular CLI](https://angular.io/cli) | `npm install -g @angular/cli` | Für das Frontend |
| Git              | ✓              | Für GitHub-Zugriff                |
| (Optional) [DB Browser for SQLite](https://sqlitebrowser.org/dl/) | – | Um Datenbank visuell zu sehen |

---

## 🧪 Installation & Start (Schritte für Mitstudierende)

```bash
# 1. Repository klonen
git clone git@github.com:Hivikhalaf7/remindme-app.git
cd remindme-app

# 2. Abhängigkeiten installieren
cd frontend && npm install
cd ../backend && npm install
cd .. && npm install  # Für concurrently im Root

# 3. Datenbankordner erstellen (falls nicht vorhanden)
mkdir data

# 4. Projekt starten
npm start