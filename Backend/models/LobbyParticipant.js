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

lobbyParticipantSchema.index({ quizId: 1, userId: 1 }, { unique: true });

lobbyParticipantSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });

const LobbyParticipant = mongoose.model('LobbyParticipant', lobbyParticipantSchema);

module.exports = LobbyParticipant;
