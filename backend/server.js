
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes API de base
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'EcolePro API', timestamp: new Date() });
});

// Endpoint pour les statistiques globales (Simulé)
app.get('/api/stats', (req, res) => {
    res.json({
        totalStudents: 150,
        totalTeachers: 25,
        monthlyRevenue: 2500000,
        currency: 'FCFA'
    });
});

app.listen(PORT, () => {
    console.log(`Backend EcolePro démarré sur http://localhost:${PORT}`);
});
