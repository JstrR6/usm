const { Client, GatewayIntentBits } = require('discord.js');

const token = process.env.BOT_TOKEN; // Ensure your bot token is set in the environment variables

// Discord client setup
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds]
});

let roleMap = new Map();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Replace 'YOUR_GUILD_ID' with the actual guild ID you want to access
    const guildId = '983103502584791120';
    const guild = client.guilds.cache.get(guildId);

    if (guild) {
        console.log(`Connected to guild: ${guild.name}`);
        
        // Fetch all roles in the guild
        const roles = await guild.roles.fetch();

        // Populate the roleMap with role IDs and names
        roles.forEach(role => {
            roleMap.set(role.id, role.name);
        });

        console.log('Role map populated:', roleMap);
    } else {
        console.error("Guild not found. Please check the guild ID.");
    }
});

// Function to get role name by ID
function getRoleNameById(roleId) {
    return roleMap.get(roleId) || 'Role not found';
}

// Function to get role ID by name
function getRoleIdByName(roleName) {
    for (let [id, name] of roleMap.entries()) {
        if (name === roleName) {
            return id;
        }
    }
    return 'Role not found';
}

// Export functions for use in other scripts
module.exports = {
    getRoleNameById,
    getRoleIdByName
};

// Log in to Discord
client.login(token);
