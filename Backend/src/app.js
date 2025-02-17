const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const authRoutes = require('../routes/authRoutes');


const app = express();

// Middleware pour parser le JSON et les URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de sécurité
app.use(helmet()); 

// Configuration CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:9003',
    credentials: true
}));

app.use(morgan('dev'));

// Route test pour vérifier si le serv est correctement lancé
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is up and running!'
    });
});

//****ROUTES****//
app.use('/api/auth', authRoutes);
// /api/quiz : gestion des quiz
// /api/users : gestion des utilisateurs
// /api/teams : gestion des équipes
// /api/badges : gestion des badges

// Middleware de gestion des routes non trouvées
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;