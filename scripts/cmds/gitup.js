const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "5.0",
    author: "Light",
    shortDescription: "Reply to media and upload to GitHub",
    category: "owner",
    role: 2 
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "gamemaker1769-source";
    const REPO_NAME = "Main";
    const BRANCH = "main";

    if (!GITHUB_TOKEN) return api.sendMessage("❌ Error: GITHUB_TOKEN environment variable-ey pawa jayni!", threadID, messageID);
    
    // 1. Jodi reply kore upload korte chan (Auto-Download logic)
    if (type === "message_reply" && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];
      const fileName = args[0] || attachment.filename || `upload_${Date.now()}.png`;
      const filePath = path.join(process.cwd(), "cache", fileName);
      const githubPath = args[0] || `assets/${fileName}`; // Jodi path na den tobe assets folder-ey jabey

      try {
        await api.sendMessage(`⏳ Media download kore GitHub-ey upload kora hochhe...`, threadID, messageID);

        // Media download kora
        const getAttachment = await axios.get(attachment.url, { responseType: 'arraybuffer' });
        fs.outputFileSync(filePath, Buffer.from(getAttachment.data));

        // GitHub-ey upload kora
        const result = await uploadToGithub(filePath, githubPath, GITHUB_TOKEN, REPO_OWNER, REPO_NAME, BRANCH);
        
        fs.unlinkSync(filePath); // Upload hoye gele local file delete kora
        return api.sendMessage(`✅ Successfully Uploaded!\n📂 Path: ${githubPath}`, threadID, messageID);
      } catch (error) {
        return api.sendMessage(`❌ এরর: ${error.message}`, threadID, messageID);
      }
    }

    // 2. Jodi local file path diye upload korte chan
    if (args.length < 1) return api.sendMessage("⚠️ ব্যবহার: media-te reply diye '.gitup filename.mp4' likhun ba local path din.", threadID, messageID);

    const localPath = path.resolve(process.cwd(), args[0]);
    if (!fs.existsSync(localPath)) {
      return api.sendMessage(`❌ ফাইলটি খুঁজে পাওয়া যায়নি: '${args[0]}'`, threadID, messageID);
    }

    try {
      await api.sendMessage(`⏳ '${path.basename(localPath)}' আপলোড হচ্ছে...`, threadID, messageID);
      await uploadToGithub(localPath, args[0], GITHUB_TOKEN, REPO_OWNER, REPO_NAME, BRANCH);
      return api.sendMessage(`✅ সফলভাবে আপলোড হয়েছে: ${args[0]}`, threadID, messageID);
    } catch (error) {
      return api.sendMessage(`❌ এরর: ${error.message}`, threadID, messageID);
    }
  }
};

// GitHub Upload Function
async function uploadToGithub(localPath, githubPath, token, owner, repo, branch) {
  const content = fs.readFileSync(localPath, 'base64');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath}`;

  let sha = "";
  try {
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    sha = data.sha;
  } catch (e) {}

  return axios.put(url, {
    message: `Upload via Bot: ${path.basename(githubPath)}`,
    content,
    sha: sha || undefined,
    branch
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}