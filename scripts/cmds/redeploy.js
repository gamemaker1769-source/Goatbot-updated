const axios = require('axios');

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "refresh"],
    version: "5.5",
    author: "Light",
    shortDescription: "Restarts the bot and notifies you when online",
    category: "owner",
    role: 4 
  },

  // This function runs automatically when the bot finishes starting up
  onLoad: async function ({ api }) {
    const myID = "100022952830933"; // Your Facebook UID

    console.log("Bot starting up... Checking for online status.");
    
    // Sends a message 7 seconds after startup to ensure connection is stable
    setTimeout(() => {
      api.sendMessage("✅ **Bot is Online!**\n\nYour service has been successfully restarted, and all new files/commands have been loaded.", myID);
    }, 7000);
  },

  onStart: async function ({ api, event }) {
    const RENDER_API_KEY = process.env.Render_API_TOKEN; // Fetches from Render Environment Variables
    const SERVICE_ID = "srv-d6790rp5pdvs73e976hg"; // Your specific Service ID

    if (!RENDER_API_KEY) {
      return api.sendMessage("❌ Error: 'Render_API_TOKEN' not found. Please perform a manual deploy from the Render Dashboard once.", event.threadID);
    }

    try {
      // Pre-restart notification
      await api.sendMessage("⏳ **Bot is restarting...**\n\nPlease wait. This usually takes 2-3 minutes. I will send you a personal message once I am back online.", event.threadID);

      // Sending the request to Render API to clear cache and redeploy
      await axios.post(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, 
      { clearCache: "clear" }, 
      {
        headers: {
          Authorization: `Bearer ${RENDER_API_KEY}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      api.sendMessage(`❌ Redeploy Error: ${errorMsg}`, event.threadID);
    }
  }
};
