const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db'); // Datenbankverbindung initialisieren

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Reminder-Routen einbinden
const remindersRouter = require('./routes/reminders');
app.use('/api/reminders', remindersRouter);

// Test-/Status-Route
app.get('/api/message', (req, res) => {
    res.json({ message: '✅ Backend läuft. Datenbankverbindung geprüft.' });
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
