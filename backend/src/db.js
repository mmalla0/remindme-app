const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/remindme.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('✅ Verbindung zur SQLite-Datenbank hergestellt.');
    }
});

// Fremdschlüssel-Unterstützung aktivieren
db.run('PRAGMA foreign_keys = ON');

db.serialize(() => {
    // Tabelle "categories"
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
                        console.log(`✅ Kategorie "${cat.name}" hinzugefügt oder bereits vorhanden.`);
                    }
                });
            });
        }
    });

    // Tabelle "repeat_rules"
    db.run(`
        CREATE TABLE IF NOT EXISTS repeat_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) {
            console.error('⚠️ Fehler beim Erstellen der Tabelle "repeat_rules":', err.message);
        } else {
            console.log('🔁 Tabelle "repeat_rules" wurde überprüft oder erstellt.');

            const defaultRepeatRules = ['none', 'daily', 'weekly'];

            defaultRepeatRules.forEach(rule => {
                db.run(`
                    INSERT OR IGNORE INTO repeat_rules (name)
                    VALUES (?)
                `, [rule], (err) => {
                    if (err) {
                        console.error(`⚠️ Fehler beim Einfügen der Wiederholungsregel "${rule}":`, err.message);
                    } else {
                        console.log(`✅ Wiederholungsregel "${rule}" hinzugefügt oder bereits vorhanden.`);
                    }
                });
            });
        }
    });

    // Tabelle "reminders" mit Beziehungen zu categories + repeat_rules
    db.run(`
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            time TEXT NOT NULL,
            done INTEGER DEFAULT 0,
            date TEXT,
            category_id INTEGER,
            repeat_rule_id INTEGER DEFAULT 1, -- ID 1 = "none"
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
            FOREIGN KEY (repeat_rule_id) REFERENCES repeat_rules(id) ON DELETE SET DEFAULT ON UPDATE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('⚠️ Fehler beim Erstellen der Tabelle "reminders":', err.message);
        } else {
            console.log('📦 Tabelle "reminders" wurde überprüft oder erstellt.');
        }
    });
});

module.exports = db;
