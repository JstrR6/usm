// bot.js

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const Member = require('./models/Member'); // Ensure this path is correct

const token = process.env.BOT_TOKEN;
const mongoUri = process.env.MONGO_URI;

// MongoDB Model
const memberSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: String,
    joinedAt: Date,
    roles: [String],
    highestRole: String
});
memberSchema.index({ discordId: 1, guildId: 1 }, { unique: true });
memberSchema.index({ username: 1 }, { unique: true, sparse: true });
const Member = mongoose.model('Member', memberSchema);

// Discord client setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
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
            const existingMember = await Member.findOne({ discordId: memberId, guildId: guildId });

            // Prepare the update object
            const updateData = {
                discordId: memberId,
                guildId: guildId,
                username: member.user.username,
                joinedAt: member.joinedAt,
                roles: member.roles.cache.map(role => role.id),
                highestRole: member.roles.highest.name
            };

            // If the member exists and has an xp field, don't overwrite it
            if (existingMember && existingMember.xp !== undefined) {
                updateData.xp = existingMember.xp;
            }

            await Member.findOneAndUpdate(
                { discordId: memberId, guildId: guildId },
                updateData,
                { upsert: true, setDefaultsOnInsert: true }
            );
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
client.login(token);
