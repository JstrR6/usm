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

// Function to get the highest role name from a list of role IDs
function getHighestRoleName(roleIds) {
    // Assuming roles are ordered by hierarchy, you can sort them or use a predefined order
    const sortedRoles = roleIds
        .map(roleId => ({ id: roleId, name: roleMap.get(roleId) || 'Role not found' }))
        .sort((a, b) => {
            // Define your sorting logic here, e.g., based on a predefined hierarchy
            // For simplicity, let's assume the roleMap keys are ordered by hierarchy
            return roleMap.get(a.id) < roleMap.get(b.id) ? -1 : 1;
        });

    // Return the name of the highest role
    return sortedRoles.length > 0 ? sortedRoles[0].name : 'No roles found';
}

// Export functions for use in other scripts
module.exports = {
    getRoleNamesByIds,
    getHighestRoleName // Export the new function
};

// Log in to Discord using the token from Render.com
client.login(process.env.BOT_TOKEN).catch(error => console.error('Error logging in:', error));
