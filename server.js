const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Member = require('./models/Member');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());
app.use(express.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/login', async (req, res) => {
  console.log('Request body:', req.body);
  const { username, password } = req.body;
  console.log('Attempting login for username:', username);

  try {
    // Find all documents that have a username field
    const allMembers = await Member.find({ username: { $exists: true } }, 'username');
    console.log('All usernames in database:', allMembers.map(m => m.username));

    let member = await Member.findOne({ 
      username: username // Use this instead of discordUsername
    });
    console.log('Member found:', member);

    if (!member) {
      return res.status(400).json({ message: 'Member not found' });
    }

    if (!member.password) {
      // New member, set password
      const salt = await bcrypt.genSalt(10);
      member.password = await bcrypt.hash(password, salt);
      await member.save();
      return res.status(200).json({ message: 'Password set successfully. Please login again.' });
    }

    // Existing member, check password
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Login successful
    // Here you would typically create a session or JWT token
    // For this example, we'll just send a redirect URL
    res.status(200).json({ 
      message: 'Login successful', 
      redirectUrl: '/dashboard',
      username: req.user.username // Add this line
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/status', (req, res) => {
  res.json({ status: 'ready' });
});

app.get('/dashboard', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.redirect('/login');
  }
  // Render the dashboard
  res.render('dashboard', { user: req.user });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
