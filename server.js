const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Member = require('./models/Member');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { getRoleNameById } = require('./roleManager'); // Import the function

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware setup
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

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

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Render the index page
app.get('/', (req, res) => {
  res.render('index'); // Render the EJS template
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);

  try {
    let member = await Member.findOne({ username: username });
    console.log(`Member found: ${member ? 'Yes' : 'No'}`);

    if (!member) {
      console.log('Member not found');
      return res.status(400).json({ success: false, message: 'Member not found' });
    }

    if (!member.password) {
      console.log('Setting password for the first time');
      const salt = await bcrypt.genSalt(10);
      member.password = await bcrypt.hash(password, salt);
      await member.save();
      return res.status(200).json({ success: false, message: 'Password set successfully. Please login again.' });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      console.log('Invalid credentials');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Set session or token here
    req.session.user = member; // Example using session
    console.log(`Session set for user: ${req.session.user.username}`);

    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      redirectUrl: '/dashboard'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/status', (req, res) => {
  res.json({ status: 'ready' });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('dashboard', { username: req.session.user.username, highestRoleName: getRoleNameById(req.session.user.highestRole) });
});

app.get('/forms', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('forms', { username: req.session.user.username });
});

app.get('/orders', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('orders', { username: req.session.user.username });
});

app.get('/orbat', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('orbat', { username: req.session.user.username });
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('profile', { username: req.session.user.username });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
