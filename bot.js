// bot.js

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

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
const Member = mongoose.model('Member', memberSchema);

// Discord client setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('Connected to MongoDB.');

    // Fetch all members in the guild
    const guild = client.guilds.cache.first(); // Fetches the first guild the bot is in

    if (guild) {
        const members = await guild.members.fetch(); // Fetch all members

        members.forEach(async (member) => {
            try {
                // Get all role IDs
                const roleIds = member.roles.cache.map(role => role.id);
                
                // Get the highest role (excluding @everyone)
                const highestRole = member.roles.highest.id === guild.id ? null : member.roles.highest.id;

                await Member.findOneAndUpdate(
                    { discordId: member.user.id, guildId: guild.id },
                    {
                        discordId: member.user.id,
                        guildId: guild.id,
                        username: member.user.tag,
                        joinedAt: member.joinedAt,
                        roles: roleIds,
                        highestRole: highestRole
                    },
                    { upsert: true, new: true }
                );
                console.log(`Stored/Updated ${member.user.tag} in MongoDB with roles.`);
            } catch (error) {
                console.error(`Failed to store/update member ${member.user.tag}: ${error.message}`);
            }
        });
    } else {
        console.error("Bot is not in any guilds.");
    }
});

client.login(token);
