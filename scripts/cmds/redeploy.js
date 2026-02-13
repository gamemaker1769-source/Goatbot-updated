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

  // বট চালু হওয়ার সাথে সাথে এই অংশটি আপনার আইডিতে মেসেজ পাঠাবে
  onLoad: async function ({ api }) {
    const myID = "100022952830933"; // আপনার দেওয়া আইডি

    console.log("Bot starting up... Checking for online status.");
    
    // বট চালু হওয়ার ৫-৭ সেকেন্ড পর মেসেজ দিবে যেন সংযোগ পুরোপুরি তৈরি হয়
    setTimeout(() => {
      api.sendMessage("✅ **Bot is Online!**\n\nআপনার সার্ভিসটি সফলভাবে রিস্টার্ট হয়েছে এবং সব নতুন ফাইল লোড করা হয়েছে।", myID);
    }, 7000);
  },

  onStart: async function ({ api, event }) {
    const RENDER_API_KEY = process.env.Render_API_TOKEN; 
    const SERVICE_ID = "srv-d6790rp5pdvs73e976hg"; 

    if (!RENDER_API_KEY) {
      return api.sendMessage("❌ Error: 'Render_API_TOKEN' পাওয়া যায়নি। Render ড্যাশবোর্ড থেকে একবার Manual Deploy দিন।", event.threadID);
    }

    try {
      // রিস্টার্ট শুরু হওয়ার মেসেজ
      await api.sendMessage("⏳ **Bot is restarting...**\n\nPlease wait. ২-৩ মিনিট সময় লাগতে পারে। অনলাইনে আসলে আমি আপনাকে পার্সোনালি মেসেজ দিচ্ছি।", event.threadID);

      // Render API-তে ক্লিয়ার ক্যাশ এবং নতুন ডিপ্লয় রিকোয়েস্ট
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
