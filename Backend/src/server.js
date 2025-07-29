const app = require('./app');
const { createServer } = require('http');
const { Server } = require("socket.io");
const connectToMongo = require('../config/database');
const SocketManager = require('../sockets/socketManager');

connectToMongo();

const PORT = process.env.PORT || 3000;

// Créer le serveur HTTP avec Express
const server = createServer(app);

// Configurer Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:9000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialiser le gestionnaire de sockets
const socketManager = new SocketManager(io);

// Rendre io accessible dans l'app Express si nécessaire
app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket server ready`);
});