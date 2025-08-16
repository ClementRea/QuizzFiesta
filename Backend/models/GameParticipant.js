const mongoose = require("mongoose");

const gameParticipantSchema = new mongoose.Schema(
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
    // Ces champs sont maintenant gérés au niveau de la GameSession
    // On les garde pour le state individuel du participant
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    lastQuestionAnsweredAt: {
      type: Date,
      default: null,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        questionIndex: {
          type: Number,
          required: true,
        },
        answer: mongoose.Schema.Types.Mixed, // Number, Array, String selon le type
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        points: {
          type: Number,
          default: 0,
        },
        timeSpent: {
          type: Number, // en millisecondes
          default: 0,
        },
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    gameStatus: {
      type: String,
      enum: ["playing", "waiting", "finished", "disconnected"],
      default: "playing",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index unique par session (un user peut jouer plusieurs fois au même quiz dans des sessions différentes)
gameParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

// Index pour retrouver les participants d'une session
gameParticipantSchema.index({ sessionId: 1, gameStatus: 1 });

// Index pour le leaderboard de session
gameParticipantSchema.index({ sessionId: 1, totalScore: -1 });

// Nettoyer les sessions inactives (2 heures)
gameParticipantSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 7200 });

const GameParticipant = mongoose.model(
  "GameParticipant",
  gameParticipantSchema,
);

module.exports = GameParticipant;
