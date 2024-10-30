const mongoose = require('mongoose');

const RankSchema = new mongoose.Schema({
  title: String,
  usernames: [String] // Array of usernames for each rank
});

const BoxSchema = new mongoose.Schema({
  title: String,
  ranks: [RankSchema], // Array of ranks within the box
  position: {
    x: Number,
    y: Number
  } // Position of the box
});

const OrbatSchema = new mongoose.Schema({
  boxes: [BoxSchema] // Array of boxes
});

module.exports = mongoose.model('Orbat', OrbatSchema);
