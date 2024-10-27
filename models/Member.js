const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  joinedAt: Date,
  roles: [String],
  highestRole: String,
  password: {
    type: String
  }
});

// Create a compound index on discordId and guildId
MemberSchema.index({ discordId: 1, guildId: 1 }, { unique: true });

// Create a unique index on username, but allow it to be sparse (not required for all documents)
MemberSchema.index({ username: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Member', MemberSchema);
