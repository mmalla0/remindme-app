// backend/src/routes/categories.js

const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ NEU: GET /api/categories
router.get('/', (req, res) => {
    const sql = `SELECT * FROM categories`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Fehler beim Abrufen der Kategorien:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json(rows);
    });
});

module.exports = router;