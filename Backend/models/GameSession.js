const mongoose = require('mongoose');
const crypto = require('crypto');

const gameSessionSchema = new mongoose.Schema({
  // Référence au quiz template
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  
  // Code unique pour rejoindre cette session de jeu
  sessionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6
  },
  
  // Organisateur de cette session (celui qui l'a créée)
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // État de la session
  status: {
    type: String,
    enum: ['lobby', 'playing', 'finished', 'cancelled'],
    default: 'lobby'
  },
  
  // Indique si cette session est créée automatiquement pour la compatibilité legacy
  isLegacy: {
    type: Boolean,
    default: false
  },
  
  // Configuration de la session
  settings: {
    maxParticipants: {
      type: Number,
      default: 50,
      min: 1,
      max: 100
    },
    timePerQuestion: {
      type: Number,
      default: 30, // secondes
      min: 5,
      max: 300
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    allowLateJoin: {
      type: Boolean,
      default: false
    }
  },
  
  // État du jeu en cours
  gameState: {
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    currentQuestionStartTime: {
      type: Date,
      default: null
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    questionTimeLimit: {
      type: Number,
      default: 30
    }
  },
  
  // Métadonnées de la session
  participantCount: {
    type: Number,
    default: 0
  },
  
  // Dates importantes
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  finishedAt: {
    type: Date,
    default: null
  },
  
  // TTL pour nettoyer les sessions inactives (24h après création)
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
    }
  }
}, {
  timestamps: true
});

// Index pour performance et nettoyage automatique
gameSessionSchema.index({ sessionCode: 1 }, { unique: true });
gameSessionSchema.index({ quizId: 1, status: 1 });
gameSessionSchema.index({ organizerId: 1 });
gameSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthodes statiques
gameSessionSchema.statics.generateSessionCode = function() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

gameSessionSchema.statics.createSession = async function(quizId, organizerId, settings = {}) {
  let sessionCode;
  let attempts = 0;
  const maxAttempts = 10;
  
  // Générer un code unique (avec retry en cas de collision)
  do {
    sessionCode = this.generateSessionCode();
    const existingSession = await this.findOne({ sessionCode });
    if (!existingSession) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Impossible de générer un code de session unique');
  }
  
  const defaultSettings = {
    maxParticipants: 50,
    timePerQuestion: 30,
    showCorrectAnswers: true,
    allowLateJoin: false
  };

  const session = new this({
    quizId,
    organizerId,
    sessionCode,
    settings: {
      ...defaultSettings,
      ...settings
    }
  });
  
  return await session.save();
};

// Méthodes d'instance
gameSessionSchema.methods.canJoin = function() {
  return this.status === 'lobby' && this.participantCount < this.settings.maxParticipants;
};

gameSessionSchema.methods.canLateJoin = function() {
  return this.status === 'playing' && this.settings.allowLateJoin;
};

gameSessionSchema.methods.startGame = async function() {
  if (this.status !== 'lobby') {
    throw new Error('La session doit être en état lobby pour démarrer');
  }
  
  this.status = 'playing';
  this.startedAt = new Date();
  this.gameState.currentQuestionStartTime = new Date();
  
  return await this.save();
};

gameSessionSchema.methods.nextQuestion = async function() {
  if (this.status !== 'playing') {
    throw new Error('La session doit être en état playing');
  }
  
  this.gameState.currentQuestionIndex += 1;
  this.gameState.currentQuestionStartTime = new Date();
  
  // Vérifier si c'est la fin du quiz
  if (this.gameState.currentQuestionIndex >= this.gameState.totalQuestions) {
    this.status = 'finished';
    this.finishedAt = new Date();
  }
  
  return await this.save();
};

gameSessionSchema.methods.endSession = async function() {
  this.status = 'finished';
  this.finishedAt = new Date();
  return await this.save();
};

gameSessionSchema.methods.updateParticipantCount = async function(delta) {
  this.participantCount = Math.max(0, this.participantCount + delta);
  return await this.save();
};

// Populate virtuel pour les informations du quiz
gameSessionSchema.virtual('quiz', {
  ref: 'Quiz',
  localField: 'quizId',
  foreignField: '_id',
  justOne: true
});

// Populate virtuel pour l'organisateur
gameSessionSchema.virtual('organizer', {
  ref: 'User',
  localField: 'organizerId',
  foreignField: '_id',
  justOne: true
});

// S'assurer que les virtuals sont inclus dans JSON
gameSessionSchema.set('toJSON', { virtuals: true });
gameSessionSchema.set('toObject', { virtuals: true });

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;