const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "2.3",
    author: "Light",
    shortDescription: "Upload file to GitHub",
    longDescription: "Directly upload or update a file from the bot's storage to your GitHub repository.",
    category: "owner",
    role: 4 // Owner Only
  },

  onStart: async function ({ api, event, args }) {
    // --- SECURE CONFIGURATION ---
    // Pulls the token you just added to Render Environment Variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    const REPO_OWNER = "gamemaker1769-source"; 
    const REPO_NAME = "Main";                  
    const BRANCH = "main";                     
    // ----------------------------

    if (!GITHUB_TOKEN) {
      return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render Environment Variables.", event.threadID);
    }

    if (args.length < 1) {
      return api.sendMessage("⚠️ Usage: gitup <file_path>\nExample: gitup scripts/cmds/gitup.js", event.threadID);
    }

    const filePath = args[0];
    const commitMessage = args.slice(1).join(" ") || `Upload: ${path.basename(filePath)}`;

    if (!fs.existsSync(filePath)) {
      return api.sendMessage(`❌ Error: File not found at '${filePath}'.`, event.threadID);
    }

    try {
      const waitMsg = await api.sendMessage("⏳ Uploading to GitHub...", event.threadID);

      const fileContent = fs.readFileSync(filePath, 'base64');
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

      let sha = "";
      try {
        const { data } = await axios.get(url, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        sha = data.sha;
      } catch (err) {
        // File doesn't exist yet, proceeding without SHA
      }

      await axios.put(url, {
        message: commitMessage,
        content: fileContent,
        sha: sha || undefined,
        branch: BRANCH
      }, {
        headers: { 
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      api.unsendMessage(waitMsg.messageID); 
      api.sendMessage(
        `✅ **Upload Successful!**\n\n` +
        `📂 **File:** ${path.basename(filePath)}\n` +
        `👤 **Owner:** ${REPO_OWNER}\n` +
        `📦 **Repo:** ${REPO_NAME}`, 
        event.threadID
      );

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      api.sendMessage(`❌ **GitHub Error:** ${errorMsg}`, event.threadID);
    }
  }
};
