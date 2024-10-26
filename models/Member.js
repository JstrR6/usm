const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  discordUsername: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  }
  // Add other fields as needed
});

module.exports = mongoose.model('Member', MemberSchema);