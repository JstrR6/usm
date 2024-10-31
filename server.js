const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Member = require('./models/Member');
const Training = require('./models/Training');
const PendingApproval = require('./models/PendingApproval');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { getRoleNamesByIds, getHighestRoleName } = require('./roleManager'); // Import the function
const { v4: uuidv4 } = require('uuid'); // Use UUID for unique training IDs
const Orbat = require('./models/Orbat'); // Import the Orbat model

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
app.use(express.json()); // Ensure this middleware is set up to parse JSON bodies

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

    const isMatch = await bcrypt.compare(password, member.password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      console.log('Invalid credentials');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Fetch and store user roles in session
    const roleNames = await getRoleNamesByIds(member.roles);
    req.session.user = {
      username: member.username,
      roles: roleNames
    };
    console.log(`Session set for user: ${req.session.user.username} with roles: ${roleNames}`);

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
  const highestRoleName = getHighestRoleName(req.session.user.roles); // Pass the user's roles
  res.render('dashboard', { username: req.session.user.username, highestRoleName });
});

app.get('/forms', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const highestRoleName = getHighestRoleName(req.session.user.roles); // Pass the user's roles
  res.render('forms', { username: req.session.user.username, highestRoleName });
});

app.get('/orders', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const highestRoleName = getHighestRoleName(req.session.user.roles); // Pass the user's roles
  res.render('orders', { username: req.session.user.username, highestRoleName });
});

app.get('/orbat', (req, res) => {
  const userRoles = req.session.user ? req.session.user.roles : [];
  res.render('orbat', { userRoles });
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  const highestRoleName = getHighestRoleName(req.session.user.roles); // Pass the user's roles
  res.render('profile', { username: req.session.user.username, highestRoleName });
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

// Function to get the highest role name
async function displayUserRole(user) {
  const highestRole = await getHighestRoleName(user);
  console.log(`Highest role for user ${user.username}: ${highestRole}`);
}

// API endpoint to update XP
app.post('/api/update-xp', async (req, res) => {
  const { discordId, xpChange } = req.body;

  try {
    const member = await Member.updateXpField(discordId, req.body.guildId, xpChange);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.status(200).json({ success: true, message: 'XP updated successfully', xp: member.xp });
  } catch (error) {
    console.error('Error updating XP:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to render the Training Form
app.get('/forms/training', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('training', { username: req.session.user.username });
});

// API endpoint to update XP via Training Form
app.post('/forms/training', async (req, res) => {
  const { trainerUsername, trainingType, xpAward, attendees } = req.body;

  console.log('Request body:', req.body);

  if (!trainerUsername && (!attendees || attendees.length === 0)) {
    console.error('No usernames provided in the request body');
    return res.status(400).json({ success: false, message: 'At least one username is required' });
  }

  try {
    // Array to hold all members updated
    const updatedMembers = [];

    // Update XP for the trainer
    let trainerId;
    if (trainerUsername) {
      const trainer = await Member.findOneAndUpdate(
        { username: trainerUsername.trim() },
        { $inc: { xp: xpAward } }, // Increment XP
        { new: true, upsert: true, setDefaultsOnInsert: true } // Create if not exists
      ).exec();
      if (trainer) {
        trainerId = trainer._id.toString(); // Capture the trainer's ID as a string
        updatedMembers.push(trainerUsername);
        console.log(`XP updated for trainer: ${trainerUsername}`);
      } else {
        console.log(`Trainer not found for username: ${trainerUsername}`);
      }
    }

    // Update XP for each attendee
    if (attendees && attendees.length > 0) {
      for (const attendeeUsername of attendees) {
        const attendee = await Member.findOneAndUpdate(
          { username: attendeeUsername.trim() },
          { $inc: { xp: xpAward } }, // Increment XP
          { new: true, upsert: true, setDefaultsOnInsert: true } // Create if not exists
        ).exec();
        if (attendee) {
          updatedMembers.push(attendeeUsername);
          console.log(`XP updated for attendee: ${attendeeUsername}`);
        } else {
          console.log(`Attendee not found for username: ${attendeeUsername}`);
        }
      }
    }

    // Determine where to log the training session
    if (xpAward >= 10) {
      // Log to PendingApproval
      const pendingApprovalLog = new PendingApproval({
        trainingId: new mongoose.Types.ObjectId().toString(), // Generate a unique ID
        trainerId: trainerId, // Ensure this is set
        attendees: attendees,
        trainingType: trainingType, // Ensure this is set
        xpAward: xpAward // Ensure this is set
      });
      await pendingApprovalLog.save();
      console.log('Training session logged to PendingApproval');
    } else {
      // Log to Training
      const trainingLog = new Training({
        trainingId: new mongoose.Types.ObjectId().toString(), // Generate a unique ID
        trainerId: trainerId, // Ensure this is set
        attendees: attendees,
        trainingType: trainingType, // Ensure this is set
        xpAward: xpAward // Ensure this is set
      });
      await trainingLog.save();
      console.log('Training session logged to Training');
    }

    res.status(200).json({ success: true, message: 'XP updated and training logged successfully', updatedMembers });
  } catch (error) {
    console.error('Error updating XP:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Validate trainer's role
app.post('/api/validate-trainer', async (req, res) => {
  const { username } = req.body;
  console.log(`Received request to validate trainer: ${username}`);
  try {
    const member = await Member.findOne({ username: username });
    if (member) {
      console.log(`Found member: ${member.username}, Roles: ${member.roles}`);
      const roleNames = await getRoleNamesByIds(member.roles); // Ensure this is awaited
      console.log(`Role names for ${username}:`, roleNames);
      if (roleNames.includes('Drill Instructor')) {
        console.log(`Validation successful for ${username}`);
        return res.json({ isValid: true });
      }
    }
    console.log(`Validation failed for ${username}`);
    res.json({ isValid: false });
  } catch (error) {
    console.error('Error validating trainer:', error);
    res.status(500).json({ isValid: false });
  }
});

// Handle training form submission
app.post('/forms/training', async (req, res) => {
  const { trainerUsername, trainingType, xpAward, attendees } = req.body;
  console.log(`Received training form submission from ${trainerUsername}`);
  try {
    const trainer = await Member.findOne({ username: trainerUsername });
    if (!trainer) {
      console.log(`Trainer not found: ${trainerUsername}`);
      return res.status(400).json({ success: false, message: 'Trainer not found' });
    }

    const roleNames = await getRoleNamesByIds(trainer.roles); // Ensure this is awaited
    console.log(`Role names for ${trainerUsername}:`, roleNames);
    if (!roleNames.includes('Drill Instructor')) {
      console.log(`Access denied for ${trainerUsername}: Not a Drill Instructor`);
      return res.status(400).json({ success: false, message: 'Drill Instructor\'s Only' });
    }

    console.log(`Trainer ${trainerUsername} is authorized. Processing training session...`);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSessions = await Training.find({
      attendees: { $in: attendees },
      date: { $gte: fiveMinutesAgo }
    });

    const needsApproval = xpAward >= 10 || recentSessions.length >= 3;
    const trainingId = uuidv4(); // Generate a unique training ID

    if (needsApproval) {
      console.log(`Training session needs approval. Logging to PendingApproval.`);
      const pendingSession = new PendingApproval({
        trainingId,
        trainerId: trainer.discordId,
        attendees,
        trainingType,
        xpAward,
        needsApproval: true
      });
      await pendingSession.save();
      return res.status(200).json({ success: true, message: 'Training session logged for approval.' });
    }

    console.log(`Recording training session for ${trainerUsername}.`);
    const trainingSession = new Training({
      trainingId,
      trainerId: trainer.discordId,
      attendees,
      trainingType,
      xpAward
    });
    await trainingSession.save();

    console.log(`Updating XP for attendees: ${attendees.join(', ')}`);
    for (const attendeeUsername of attendees) {
      const attendee = await Member.findOne({ username: attendeeUsername });
      if (attendee) {
        attendee.xp += xpAward;
        await attendee.save();
        console.log(`Updated XP for ${attendeeUsername}: New XP = ${attendee.xp}`);
      }
    }

    res.status(200).json({ success: true, message: 'Training session recorded and XP updated.' });
  } catch (error) {
    console.error('Error handling training form:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to get Orbat data
app.get('/api/orbat', async (req, res) => {
    try {
        const orbat = await Orbat.findOne(); // Assuming a single Orbat document
        if (!orbat) {
            return res.status(404).json({ success: false, message: 'Orbat not found' });
        }
        res.json({ success: true, boxes: orbat.boxes });
    } catch (error) {
        console.error('Error loading Orbat:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Middleware to check if user has High Command role
function checkHighCommandRole(req, res, next) {
  if (req.session.user && req.session.user.roles.includes('High Command')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}

// Save Orbat data with role check
app.post('/api/orbat', checkHighCommandRole, async (req, res) => {
  try {
    const { boxes } = req.body; // Extract boxes from the request body
    if (!boxes) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    // Assuming you have a single Orbat document
    let orbat = await Orbat.findOne();

    if (!orbat) {
      // If no Orbat document exists, create a new one
      orbat = new Orbat({ boxes });
    } else {
      // Update the existing Orbat document
      orbat.boxes = boxes;
    }

    await orbat.save();

    res.status(200).json({ success: true, message: 'Orbat saved successfully' });
  } catch (error) {
    console.error('Error saving Orbat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Function to handle save with retry
async function saveWithRetry(orbatDocument, boxes, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      orbatDocument.boxes = boxes; // Ensure boxes is assigned here
      await orbatDocument.save();
      return;
    } catch (error) {
      if (error.name === 'VersionError' && attempt < retries - 1) {
        // Refetch the document and retry
        orbatDocument = await Orbat.findById(orbatDocument._id);
        if (!orbatDocument) {
          throw new Error('Document not found during retry');
        }
      } else {
        throw error; // Rethrow if not a VersionError or out of retries
      }
    }
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
