const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Datenbank-Datei im Hauptprojektordner
const dbPath = path.resolve(__dirname, '../../data/remindme.db');

// Verbindung zur Datenbank herstellen
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('✅ Verbindung zur SQLite-Datenbank hergestellt.');
    }
});

// Tabelle "reminders" erstellen
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
            console.error('⚠️ Fehler beim Erstellen der Tabelle "reminders":', err.message);
        } else {
            console.log('📦 Tabelle "reminders" wurde überprüft oder erstellt.');
        }
    });

    // Zusätzliche Spalten zur Tabelle "reminders"
    const addColumns = [
        { name: 'category', type: 'TEXT DEFAULT "General"' },
        { name: 'repeat', type: 'TEXT DEFAULT "none"' },
        { name: 'date', type: 'TEXT' }
    ];

    addColumns.forEach(col => {
        db.run(`ALTER TABLE reminders ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`⚠️ Fehler beim Hinzufügen der Spalte "${col.name}":`, err.message);
            } else if (!err) {
                console.log(`✅ Spalte "${col.name}" wurde erfolgreich hinzugefügt.`);
            } else {
                console.log(`ℹ️ Spalte "${col.name}" existiert bereits – wird übersprungen.`);
            }
        });
    });

    // Neue Tabelle "categories" erstellen
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            icon TEXT
        )
    `, (err) => {
        if (err) {
            console.error('⚠️ Fehler beim Erstellen der Tabelle "categories":', err.message);
        } else {
            console.log('📁 Tabelle "categories" wurde überprüft oder erstellt.');

            // Standard-Kategorien einfügen (nur wenn sie noch nicht existieren)
            const defaultCategories = [
                { name: 'Trinken', icon: '🥤' },
                { name: 'Medikamente', icon: '💊' },
                { name: 'Tägliche Aufgaben', icon: '📋' }
            ];

            defaultCategories.forEach(cat => {
                db.run(`
                    INSERT OR IGNORE INTO categories (name, icon)
                    VALUES (?, ?)
                `, [cat.name, cat.icon], (err) => {
                    if (err) {
                        console.error(`⚠️ Fehler beim Einfügen der Kategorie "${cat.name}":`, err.message);
                    } else {
                        console.log(`✅ Kategorie "${cat.name}" wurde hinzugefügt (oder war bereits vorhanden).`);
                    }
                });
            });
        }
    });
});

module.exports = db;
