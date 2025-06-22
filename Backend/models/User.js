const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  userName: {
      type: String,
  },
  password: {
      type: String,
      minlength: 6,
      select: false
  },
  role: {
      type: String,
      enum: ['admin', 'gestionnaire', 'user'],
      default: 'user'
  },
  avatar: {
      type: String,
      default: getRandomAvatar
  },
  badges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
  }],
  organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
  },
  team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
  },
  refreshTokens: [{
      tokenHash: String, // Hash du token pour sécurité
      family: String,    // Famille de tokens pour détecter la réutilisation
      createdAt: {
          type: Date,
          default: Date.now
      },
      expiresAt: {
          type: Date,
          default: function() { return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); } // 7 jours
      },
      lastUsed: Date,
      userAgent: String,
      ipAddress: String
  }],
  tokenVersion: {
      type: Number,
      default: 0
  },
  suspiciousActivity: {
      detected: { type: Boolean, default: false },
      lastDetection: Date,
      reason: String
  }
}, {
  timestamps: true
});

// Hash du mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (error) {
      next(error);
  }
});

// Comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
      return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
      throw error;
  }
};

// Mettre un avatar aléatoire parmis les deux disponibles, à la création du comtpe
function getRandomAvatar() {
  const avatars = ['avatar1.png', 'avatar2.png'];
  return avatars[Math.floor(Math.random() * avatars.length)]
}

const User = mongoose.model('User', userSchema);

module.exports = User;