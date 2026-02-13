const axios = require('axios');

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "refresh"],
    version: "6.0",
    author: "Light",
    shortDescription: "Restarts the bot and notifies you when online",
    category: "owner",
    role: 4 
  },

  // This triggers as soon as the bot finishes loading all scripts
  onLoad: async function ({ api }) {
    const myID = "100022952830933"; // Your Facebook UID

    console.log("System reboot complete. Initializing online notification...");
    
    // Slight delay to ensure the bot is fully connected to Facebook servers
    setTimeout(() => {
      api.sendMessage("✅ **Bot is Online!**\n\nAll commands and files have been successfully reloaded from GitHub.", myID);
    }, 10000);
  },

  onStart: async function ({ api, event }) {
    const RENDER_API_KEY = process.env.Render_API_TOKEN; 
    const SERVICE_ID = "srv-d6790rp5pdvs73e976hg"; 

    if (!RENDER_API_KEY) {
      return api.sendMessage("❌ Error: 'Render_API_TOKEN' not found. Please manually deploy from Render Dashboard one last time to sync variables.", event.threadID);
    }

    try {
      // Immediate notification before the process starts shutting down
      await api.sendMessage("⏳ **Bot is restarting...**\n\nConnection will be cut shortly. Please wait 2-3 minutes. I will DM you when I am back online.", event.threadID);

      // We use 'clearCache: "clear"' to force Render to pull fresh files from GitHub
      await axios.post(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, 
      { clearCache: "clear" }, 
      {
        headers: {
          Authorization: `Bearer ${RENDER_API_KEY}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log("Redeploy signal sent to Render successfully.");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      api.sendMessage(`❌ Redeploy Error: ${errorMsg}`, event.threadID);
    }
  }
};
