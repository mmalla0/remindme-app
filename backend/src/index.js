const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db'); // ← Verbindung prüfen (keine API-Aufrufe)

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Nur eine Statusroute (optional)
app.get('/api/message', (req, res) => {
    res.json({ message: 'Backend läuft. Datenbankverbindung wurde geprüft.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});