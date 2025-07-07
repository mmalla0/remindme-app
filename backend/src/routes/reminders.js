// backend/src/routes/reminders.js

const express = require('express');
const router = express.Router();
const db = require('../db'); // Verbindung zur SQLite-Datenbank

// API: Nächster Reminder zur aktuellen Uhrzeit
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
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ message: 'Kein Reminder zur aktuellen Uhrzeit.' });
        } else {
            res.json(row);
        }
    });
});

// GET /api/reminders
router.get('/', (req, res) => {
    db.all(`
        SELECT 
            r.id, r.text, r.time, r.date, r.done,
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

// GET /api/reminders/today – Tagesplan für heute
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(`
    SELECT 
      r.id, r.text, r.time, r.date, r.done,
      c.name AS category,
      c.icon AS icon
    FROM reminders r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.date = ?
    ORDER BY r.time ASC
  `, [today], (err, rows) => {
    if (err) {
      console.error('❌ Fehler beim Abrufen der heutigen Reminder:', err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});


// POST /api/reminders/:id/done
router.post('/:id/done', (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE reminders SET done = 1 WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Reminder nicht gefunden.' });
    }
    res.json({ message: 'Reminder als erledigt markiert.' });
  });
});

// POST /api/reminders
router.post('/', (req, res) => {
    const { text, time, date, category_id, repeat_rule_id } = req.body;

    if (!text || !time) {
        return res.status(400).json({ error: 'Text und Zeit sind erforderlich.' });
    }

    const sql = `
        INSERT INTO reminders (text, time, date, category_id, repeat_rule_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        text,
        time,
        date || null,
        category_id || null,
        repeat_rule_id || 1  // Standard: "none"
    ];

    db.run(sql, values, function (err) {
        if (err) {
            console.error('❌ Fehler beim Einfügen des Reminders:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ id: this.lastID });
    });
});


// PUT /api/reminders/:id
router.put('/:id', (req, res) => {
    const { text, time, date, category_id, repeat_rule_id } = req.body;
    const { id } = req.params;

    if (!text || !time) {
        return res.status(400).json({ error: 'Text und Zeit sind erforderlich.' });
    }

    const sql = `
        UPDATE reminders
        SET text = ?, time = ?, date = ?, category_id = ?, repeat_rule_id = ?
        WHERE id = ?
    `;
    const values = [text, time, date || null, category_id || null, repeat_rule_id || 1, id];

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



// DELETE /api/reminders/:id
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
