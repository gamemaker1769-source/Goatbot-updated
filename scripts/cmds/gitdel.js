const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "gitdel",
    aliases: ["dlt", "ghdelete"],
    version: "5.0",
    author: "Light",
    shortDescription: "Delete file from GitHub & Local (Fixed)",
    category: "owner",
    role: 4 
  },

  onStart: async function ({ api, event, args, commandName }) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Render token
    const REPO_OWNER = "gamemaker1769-source";
    const REPO_NAME = "Main";
    const BRANCH = "main";

    if (!GITHUB_TOKEN) return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render settings.", event.threadID);
    if (!args[0]) return api.sendMessage("⚠️ Usage: .gitdel <file_path>", event.threadID);

    const filePath = args[0];
    const fileName = path.basename(filePath);

    // Confirmation
    api.sendMessage(
      `⚠️ **Confirm Deletion?**\nDeleting '${fileName}' from GitHub & Local.\nReply with **"yes"** to proceed.`,
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          filePath,
          fileName,
          REPO_OWNER,
          REPO_NAME,
          BRANCH,
          GITHUB_TOKEN
        });
      }
    );
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, filePath, fileName, REPO_OWNER, REPO_NAME, BRANCH, GITHUB_TOKEN } = Reply;
    if (event.senderID !== author) return;

    if (args[0]?.trim().toLowerCase() === "yes") {
      try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

        // 1️⃣ Delete from GitHub
        try {
          const { data } = await axios.get(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
          const sha = data.sha;

          await axios({
            method: "DELETE",
            url: url,
            headers: { Authorization: `token ${GITHUB_TOKEN}` },
            data: {
              message: `Deleted ${fileName}`,
              sha: sha,
              branch: BRANCH
            }
          });

          api.sendMessage(`✅ File '${fileName}' deleted from GitHub.`, event.threadID);
        } catch (e) {
          if (e.response && e.response.status === 404) {
            api.sendMessage(`⚠️ File '${fileName}' not found on GitHub.`, event.threadID);
          } else {
            api.sendMessage(`❌ GitHub delete error: ${e.message}`, event.threadID);
          }
        }

        // 2️⃣ Delete from Local Render
        const absPath = path.resolve(process.cwd(), filePath);
        try {
          if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
            api.sendMessage(`✅ File '${fileName}' deleted from Bot Storage.`, event.threadID);
          }
        } catch (err) {
          api.sendMessage(`⚠️ Local delete error: ${err.message}`, event.threadID);
        }

      } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, event.threadID);
      }

      global.GoatBot.onReply.delete(Reply.messageID);
    }
  }
};