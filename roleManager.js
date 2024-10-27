const { Client, GatewayIntentBits } = require('discord.js'); // Assuming you have a Role model
const Member = require('./models/Member');

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

    // Optionally, you can log out the client after fetching the roles
    client.destroy();
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

// Predefined role ID to name mapping
const roleIdToNameMap = {
  '1234567890': 'Drill Instructor',
  '0987654321': 'Member',
  // Add other role mappings as needed
};

async function getRoleNamesByIds(roleIds) {
  // Map role IDs to their names using the predefined mapping
  const roleNames = roleIds.map(roleId => roleIdToNameMap[roleId] || null);
  return roleNames.filter(name => name !== null);
}

// Export functions for use in other scripts
module.exports = {
    getRoleNameById,
    getRoleIdByName,
    getRoleNamesByIds
};

// Log in to Discord
client.login(token);
