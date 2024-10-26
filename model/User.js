const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  discordUsername: String,
  password: String,
  // ... other fields
});

module.exports = mongoose.model('User', UserSchema);
