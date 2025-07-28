const mongoose = require('mongoose');

const gameParticipantSchema = new mongoose.Schema({
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
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Number or Array
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    points: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    }
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  gameStatus: {
    type: String,
    enum: ['playing', 'waiting', 'finished'],
    default: 'playing'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Un seul user pour un seul quiz
gameParticipantSchema.index({ quizId: 1, userId: 1 }, { unique: true });

// Nettoyer les sessions inactives
gameParticipantSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 7200 });

const GameParticipant = mongoose.model('GameParticipant', gameParticipantSchema);

module.exports = GameParticipant;