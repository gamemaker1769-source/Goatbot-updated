const axios = require('axios');

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "refresh"],
    version: "6.4",
    author: "Light",
    shortDescription: "Restarts the bot and notifies you when online",
    category: "owner",
    role: 4
  },

  // Triggered when bot finishes loading
  onLoad: async function ({ api }) {
    const myID = "100022952830933"; // Your Facebook UID
    setTimeout(() => {
      api.sendMessage("✅ **Bot is Online!**\nAll commands and files have been successfully reloaded from GitHub.", myID);
    }, 10000);
  },

  onStart: async function ({ api, event }) {
    const RENDER_API_KEY = "rnd_xFJvGNwAFA0OFZbV7ComTNu1X1BM"; // Your Render API Key
    const SERVICE_ID = "srv-d67uqop5pdvs73fnmps0"; // Your Render Service ID

    if (!RENDER_API_KEY) return api.sendMessage("❌ Render_API_TOKEN not set.", event.threadID);
    if (!SERVICE_ID) return api.sendMessage("❌ RENDER_SERVICE_ID not set.", event.threadID);

    try {
      await api.sendMessage(
        "⏳ **Bot is restarting...**\nConnection will be cut shortly. Please wait 2-3 minutes. I will DM you when I am back online.",
        event.threadID
      );

      // Correct Render API call
      const response = await axios.post(
        `https://api.render.com/v1/services/${SERVICE_ID}/deploys`,
        { clearCache: true }, // boolean true
        {
          headers: {
            Authorization: `Bearer ${RENDER_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      );

      console.log("✅ Redeploy signal sent:", response.data);
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error("❌ Redeploy failed:", msg);
      api.sendMessage(`❌ Redeploy Error: ${msg}`, event.threadID);
    }
  }
};