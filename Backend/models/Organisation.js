const mongoose = require('mongoose');

const organisationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  logoUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Organisation = mongoose.model('Organisation', organisationSchema);

if (!mongoose.models.Organization) {
  mongoose.model('Organization', organisationSchema);
}
module.exports = Organisation;