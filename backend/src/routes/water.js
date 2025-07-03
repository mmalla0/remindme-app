const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/water – Ziel definieren
router.post('/', (req, res) => {
    const { date, target_amount } = req.body;

    if (!date || !target_amount) {
        return res.status(400).json({ error: 'Datum und Zielmenge erforderlich.' });
    }

    const sql = `
        INSERT INTO water_intake (date, target_amount)
        VALUES (?, ?)
    `;
    db.run(sql, [date, target_amount], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// PUT /api/water/:id/add – ein Glas hinzufügen
router.put('/:id/add', (req, res) => {
    const id = req.params.id;

    const sql = `
        UPDATE water_intake
        SET current_amount = current_amount + 1
        WHERE id = ?
    `;
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ updated: true });
    });
});

// GET /api/water/:date – Status für ein Datum abrufen
router.get('/:date', (req, res) => {
    const date = req.params.date;

    const sql = `SELECT * FROM water_intake WHERE date = ?`;

    db.get(sql, [date], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Kein Eintrag gefunden.' });
        }
        res.json(row);
    });
});

module.exports = router;