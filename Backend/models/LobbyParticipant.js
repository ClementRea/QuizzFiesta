const mongoose = require('mongoose');

const lobbyParticipantSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  isReady: {
    type: Boolean,
    default: false
  },
  isOrganizer: {
    type: Boolean,
    default: false
  },
  connectionStatus: {
    type: String,
    enum: ['connected', 'connecting', 'disconnected'],
    default: 'connected'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons
lobbyParticipantSchema.index({ quizId: 1, userId: 1 }, { unique: true });

// Index pour nettoyer les participants inactifs
lobbyParticipantSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 }); // 1 heure

const LobbyParticipant = mongoose.model('LobbyParticipant', lobbyParticipantSchema);

module.exports = LobbyParticipant;
