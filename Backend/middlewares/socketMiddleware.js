// Middleware pour rendre Socket.IO accessible dans les controllers
const socketMiddleware = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

module.exports = socketMiddleware;