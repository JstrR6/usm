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
  const { username, password } = req.body;

  try {
    let member = await Member.findOne({ username: username });

    if (!member) {
      return res.status(400).json({ message: 'Member not found' });
    }

    if (!member.password) {
      const salt = await bcrypt.genSalt(10);
      member.password = await bcrypt.hash(password, salt);
      await member.save();
      return res.status(200).json({ message: 'Password set successfully. Please login again.' });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Set session or token here
    req.session.user = member; // Example using session

    res.status(200).json({ 
      message: 'Login successful', 
      redirectUrl: '/dashboard'
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
  if (!req.session.user) { // Check if user is authenticated
    return res.redirect('/login');
  }
  res.render('dashboard', { username: req.session.user.username });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await findUser(username, password);
  if (user) {
    res.json({ 
      success: true, 
      redirectUrl: `/dashboard/${username}`
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/dashboard/:username', (req, res) => {
  const { username } = req.params;
  res.render('dashboard', { username: username });
});

async function findUser(username, password) {
  try {
    const user = await Member.findOne({ username: username });
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
