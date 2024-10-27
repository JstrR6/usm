const { Client, GatewayIntentBits } = require('discord.js'); // Assuming you have a Role model
const Member = require('./models/Member');
require('dotenv').config(); // Ensure environment variables are loaded

const token = process.env.BOT_TOKEN; // Ensure your bot token is set in the environment variables

// Discord client setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds]
});

let roleMap = new Map();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Replace 'YOUR_GUILD_ID' with the actual guild ID you want to access
    const guildId = process.env.GUILD_ID; // Use environment variable for guild ID
    const guild = client.guilds.cache.get(guildId);

    if (guild) {
        console.log(`Connected to guild: ${guild.name}`);
        
        try {
            // Fetch all roles in the guild
            const roles = await guild.roles.fetch();

            // Populate the roleMap with role IDs and names
            roles.forEach(role => {
                roleMap.set(role.id, role.name);
            });

            console.log('Role map populated:', roleMap);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    } else {
        console.error("Guild not found. Please check the guild ID.");
    }

    // Optionally, you can log out the client after fetching the roles
    client.destroy();
});

// Function to get role names by IDs
async function getRoleNamesByIds(roleIds) {
    return roleIds.map(roleId => roleMap.get(roleId) || 'Role not found');
}

// Export functions for use in other scripts
module.exports = {
    getRoleNamesByIds
};

// Log in to Discord
client.login(token).catch(error => console.error('Error logging in:', error));
