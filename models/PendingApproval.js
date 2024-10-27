const mongoose = require('mongoose');

const PendingApprovalSchema = new mongoose.Schema({
  trainingId: {
    type: String,
    required: true,
    unique: true
  },
  trainerId: {
    type: String,
    required: true
  },
  attendees: [String],
  trainingType: {
    type: String,
    enum: ['Training Session', 'Rally Session', 'Accommodation'],
    required: true
  },
  xpAward: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  needsApproval: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('PendingApproval', PendingApprovalSchema);

