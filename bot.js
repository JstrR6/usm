// bot.js

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const Member = require('./models/Member'); // Ensure this path is correct

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // Enable the GUILD_MEMBERS intent
  ]
});

// Function to fetch and update members
async function fetchAndUpdateMembers() {
  try {
    const guildId = process.env.GUILD_ID; // Ensure this is set in your environment variables
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      console.error('Guild not found. Please check the guild ID.');
      return;
    }

    // Fetch all members in the guild
    const members = await guild.members.fetch();
    console.log(`Fetched ${members.size} members from guild: ${guild.name}`);

    // Iterate over each member and update or insert them into the database
    for (const [memberId, member] of members) {
      const updateData = {
        discordId: memberId,
        guildId: guildId,
        username: member.user.username,
        joinedAt: member.joinedAt,
        roles: member.roles.cache.map(role => role.id),
        highestRole: member.roles.highest.name
      };

      const result = await Member.findOneAndUpdate(
        { discordId: memberId, guildId: guildId },
        updateData,
        { upsert: true, setDefaultsOnInsert: true, new: true }
      );

      // Ensure XP field is initialized
      await Member.updateXpField(memberId, guildId, 0);

      console.log(`Member ${member.user.username} updated/inserted:`, result);
    }

    console.log('All members have been updated in the database.');
  } catch (error) {
    console.error('Error fetching members:', error);
  }
}

// When the client is ready, run this code
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Run the fetch and update function every minute
  fetchAndUpdateMembers(); // Run immediately on start
  setInterval(fetchAndUpdateMembers, 60000); // Run every 60,000 milliseconds (1 minute)
});

// Log in to Discord with your app's token
client.login(process.env.BOT_TOKEN).catch(error => console.error('Error logging in:', error));
