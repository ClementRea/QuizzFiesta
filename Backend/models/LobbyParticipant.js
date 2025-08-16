const mongoose = require("mongoose");

const lobbyParticipantSchema = new mongoose.Schema(
  {
    // Référence à la session de jeu (plus au quiz directement)
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameSession",
      required: true,
    },
    // On garde aussi quizId pour compatibilité et requêtes optimisées
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    isReady: {
      type: Boolean,
      default: false,
    },
    isOrganizer: {
      type: Boolean,
      default: false,
    },
    connectionStatus: {
      type: String,
      enum: ["connected", "connecting", "disconnected"],
      default: "connected",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index unique par session (un user peut être dans plusieurs sessions du même quiz)
lobbyParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

// Index pour retrouver les participants d'une session
lobbyParticipantSchema.index({ sessionId: 1, connectionStatus: 1 });

// Index pour nettoyer les participants inactifs (5 minutes)
lobbyParticipantSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });

const LobbyParticipant = mongoose.model(
  "LobbyParticipant",
  lobbyParticipantSchema,
);

module.exports = LobbyParticipant;
