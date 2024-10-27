const { Client, GatewayIntentBits } = require('discord.js'); // Assuming you have a Role model
const Member = require('./models/Member');

// Discord client setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds]
});

let roleMap = new Map();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Use environment variables directly from Render.com
    const guildId = process.env.GUILD_ID; // Ensure this is set in Render.com
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

// Log in to Discord using the token from Render.com
client.login(process.env.BOT_TOKEN).catch(error => console.error('Error logging in:', error));
