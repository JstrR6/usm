// bot.js

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Model
const memberSchema = new mongoose.Schema({
    discordId: { type: String, unique: true },
    username: String,
    joinedAt: Date
});
const Member = mongoose.model('Member', memberSchema);

// Discord client setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('Connected to MongoDB.');

    // Fetch all members in the guild
    const guild = client.guilds.cache.first(); // Fetches the first guild the bot is in

    if (guild) {
        const members = await guild.members.fetch(); // Fetch all members

        members.forEach(async (member) => {
            // Store each member in MongoDB
            try {
                await Member.findOneAndUpdate(
                    { discordId: member.user.id },
                    {
                        discordId: member.user.id,
                        username: member.user.tag,
                        joinedAt: member.joinedAt
                    },
                    { upsert: true, new: true }
                );
                console.log(`Stored ${member.user.tag} in MongoDB.`);
            } catch (error) {
                console.error(`Failed to store member ${member.user.tag}: ${error.message}`);
            }
        });
    } else {
        console.error("Bot is not in any guilds.");
    }
});

client.login(process.env.DISCORD_TOKEN);
