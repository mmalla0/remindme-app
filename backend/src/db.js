const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Datenbank-Datei im Hauptprojektordner (remindme-app/data/remindme.db)
const dbPath = path.resolve(__dirname, '../../data/remindme.db');

// Verbindung öffnen oder Datei erzeugen
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('✅ Verbindung zur SQLite-Datenbank hergestellt.');
    }
});

// Tabelle erstellen (falls nicht vorhanden)
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      done INTEGER DEFAULT 0
    )
  `, (err) => {
        if (err) {
            console.error('⚠️ Fehler beim Erstellen der Tabelle:', err.message);
        } else {
            console.log('📦 Tabelle "reminders" wurde überprüft oder erstellt.');
        }
    });
});

module.exports = db;