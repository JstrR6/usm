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
    type: String
  },
  password: {
    type: String // Add the password field
  },
  joinedAt: Date,
  roles: [String],
  highestRole: String,
  xp: {
    type: Number,
    default: 0
  }
});

// Create a compound index on discordId and guildId
MemberSchema.index({ discordId: 1, guildId: 1 }, { unique: true });

// Create a unique index on username, but allow it to be sparse (not required for all documents)
MemberSchema.index({ username: 1 }, { unique: true, sparse: true });

// Static method to update XP
MemberSchema.statics.updateXpField = async function(discordId, guildId, xpChange) {
  const member = await this.findOne({ discordId, guildId });
  if (member) {
    member.xp = (member.xp || 0) + xpChange; // Initialize xp if it doesn't exist
    await member.save();
    return member;
  }
  return null;
};

module.exports = mongoose.model('Member', MemberSchema);
