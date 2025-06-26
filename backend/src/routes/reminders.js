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

module.exports = router;
