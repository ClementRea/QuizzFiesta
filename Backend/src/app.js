const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/usersRoutes');
const quizRoutes = require('../routes/quizRoutes');
const organisationRoutes = require('../routes/organisationRoutes');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de sécurité
app.use(helmet());

//On retire le header Cross-Origin-Resource-Policy pour les avatars
app.use('/avatars', (req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/avatars')));

//On retire le header Cross-Origin-Resource-Policy pour les logos
app.use('/logos', (req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/logos')));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:9000',
    credentials: true
}));

app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '../public')));

// Route test pour vérifier si le serv est correctement lancé
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: "I'm Okay!"
    });
});

//****ROUTES****//
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/organisation', organisationRoutes);
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