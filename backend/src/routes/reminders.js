const express = require('express');
const router = express.Router();
const db = require('../db');

// Nächster Reminder zur aktuellen Uhrzeit
router.get('/next', (req, res) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    db.get(`
    SELECT r.text, r.time, c.name AS category, rr.name AS repeat
    FROM reminders r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN repeat_rules rr ON r.repeat_rule_id = rr.id
    WHERE r.time = ?
    LIMIT 1
  `, [currentTime], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Kein Reminder zur aktuellen Uhrzeit.' });
        res.json(row);
    });
});

// GET alle Reminder
router.get('/', (req, res) => {
    db.all(`
        SELECT
            r.id, r.text, r.time, r.date, r.repeat_until, r.done,
            c.name AS category,
            rr.name AS repeat_rule
        FROM reminders r
                 LEFT JOIN categories c ON r.category_id = c.id
                 LEFT JOIN repeat_rules rr ON r.repeat_rule_id = rr.id
        ORDER BY r.time ASC
    `, [], (err, rows) => {
        if (err) {
            console.error('❌ Fehler beim Abrufen der Reminder:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET Tagesplan (alle Wiederholungen berücksichtigt)
router.get('/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    const sql = `
    SELECT
      r.id, r.text, r.time, r.date, r.repeat_until, r.done,
      c.name AS category,
      c.icon AS icon
    FROM reminders r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN repeat_rules rr ON r.repeat_rule_id = rr.id
    WHERE (
      rr.name = 'none' AND r.date = :today
    )
    OR (
      rr.name = 'daily' AND r.date <= :today AND (r.repeat_until IS NULL OR r.repeat_until >= :today)
    )
    OR (
      rr.name = 'weekly' AND r.date <= :today AND (r.repeat_until IS NULL OR r.repeat_until >= :today)
      AND strftime('%w', r.date) = strftime('%w', :today)
    )
    OR (
      rr.name = 'monthly' AND r.date <= :today AND (r.repeat_until IS NULL OR r.repeat_until >= :today)
      AND strftime('%d', r.date) = strftime('%d', :today)
    )
    OR (
      rr.name = 'yearly' AND r.date <= :today AND (r.repeat_until IS NULL OR r.repeat_until >= :today)
      AND strftime('%m-%d', r.date) = strftime('%m-%d', :today)
    )
    ORDER BY r.time ASC
  `;

    db.all(sql, { ':today': today }, (err, rows) => {
        if (err) {
            console.error('❌ Fehler beim Abrufen der heutigen Reminder:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST neuen Reminder erstellen
router.post('/', (req, res) => {
    console.log('➡️ Empfangen:', req.body);
    const { text, time, date, category_id, repeat_rule_id, repeat_until } = req.body;

    if (!text || !time) {
        return res.status(400).json({ error: 'Text und Zeit sind erforderlich.' });
    }

    const sql = `
        INSERT INTO reminders (text, time, date, repeat_until, category_id, repeat_rule_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
        text,
        time,
        date || null,
        repeat_until || null,
        category_id || null,
        repeat_rule_id || 1
    ];

    db.run(sql, values, function (err) {
        if (err) {
            console.error('❌ Fehler beim Einfügen des Reminders:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ id: this.lastID });
    });
});

// PUT Reminder aktualisieren
router.put('/:id', (req, res) => {
    const { text, time, date, category_id, repeat_rule_id, repeat_until } = req.body;
    const { id } = req.params;

    if (!text || !time) {
        return res.status(400).json({ error: 'Text und Zeit sind erforderlich.' });
    }

    const sql = `
    UPDATE reminders
    SET text = ?, time = ?, date = ?, repeat_until = ?, category_id = ?, repeat_rule_id = ?
    WHERE id = ?
  `;
    const values = [
        text,
        time,
        date || null,
        repeat_until || null,
        category_id || null,
        repeat_rule_id || 1,
        id
    ];

    db.run(sql, values, function (err) {
        if (err) {
            console.error('❌ Fehler beim Aktualisieren des Reminders:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Reminder nicht gefunden.' });
        }

        res.json({ message: 'Reminder aktualisiert.' });
    });
});

// POST als erledigt markieren
router.post('/:id/done', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE reminders SET done = 1 WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Reminder nicht gefunden.' });
        res.json({ message: 'Reminder als erledigt markiert.' });
    });
});

// DELETE Reminder
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM reminders WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error('❌ Fehler beim Löschen des Reminders:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Reminder nicht gefunden.' });
        }
        res.json({ message: 'Reminder gelöscht.' });
    });
});

module.exports = router;