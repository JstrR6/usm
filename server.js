const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ discordUsername: username });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.password) {
      // New user, set password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      return res.status(200).json({ message: 'Password set successfully. Please login again.' });
    }

    // Existing user, check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Login successful
    // Here you would typically create a session or JWT token
    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/status', (req, res) => {
  res.json({ status: 'ready' });
});

// Function to start bot.js
function startBot() {
  const bot = spawn('node', [path.join(__dirname, 'bot.js')]);

  bot.stdout.on('data', (data) => {
    console.log(`Bot output: ${data}`);
  });

  bot.stderr.on('data', (data) => {
    console.error(`Bot error: ${data}`);
  });

  bot.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
  });
}

// Start the bot when the server starts
startBot();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
