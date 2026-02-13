const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
 config: {
 name: "gitdel",
 aliases: ["dlt", "ghdelete"],
 version: "3.0",
 author: "Light",
 shortDescription: "Delete file with confirmation",
 longDescription: "Delete a file from GitHub and Local Storage with a safety confirmation step.",
 category: "owner",
 role: 4 // Owner Only
 },

 onStart: async function ({ api, event, args, commandName }) {
 const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
 const REPO_OWNER = "gamemaker1769-source";
 const REPO_NAME = "Main";
 const BRANCH = "main";

 if (!GITHUB_TOKEN) {
 return api.sendMessage("❌ GITHUB_TOKEN not found in Render settings.", event.threadID);
 }

 if (args.length < 1) {
 return api.sendMessage("⚠️ Usage: .gitdel <file_path>", event.threadID);
 }

 const filePath = args[0];
 const fileName = path.basename(filePath);

 // Confirmation Message
 const confirmMsg = `⚠️ **Wait! Are you sure?**\n\nYou are about to delete '${fileName}' from both GitHub and Local Storage. This cannot be undone.\n\nType **"yes"** to confirm or anything else to cancel. (Timeout: 20s)`;

 api.sendMessage(confirmMsg, event.threadID, (err, info) => {
 if (err) return;

 // Reply listener for confirmation
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

 // 20 second timeout to clear the reply listener
 setTimeout(() => {
 if (global.GoatBot.onReply.has(info.messageID)) {
 global.GoatBot.onReply.delete(info.messageID);
 api.sendMessage(`⏰ Time out! Deletion of '${fileName}' cancelled.`, event.threadID);
 }
 }, 20000);
 });
 },

 onReply: async function ({ api, event, Reply, args }) {
 const { author, filePath, fileName, REPO_OWNER, REPO_NAME, BRANCH, GITHUB_TOKEN } = Reply;
 if (event.senderID !== author) return;

 const response = args[0].toLowerCase();

 if (response === "yes") {
 try {
 const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
 api.sendMessage(`⏳ Deleting '${fileName}' everywhere...`, event.threadID);

 // 1. Delete from GitHub
 let githubStatus = "⚠️ Not found on GitHub";
 try {
 const { data } = await axios.get(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
 await axios.delete(url, {
 headers: { Authorization: `token ${GITHUB_TOKEN}` },
 data: { message: `Deleted ${fileName} via Bot`, sha: data.sha, branch: BRANCH }
 });
 githubStatus = "✅ Removed from GitHub";
 } catch (e) {}

 // 2. Delete from Local Storage
 let localStatus = "⚠️ Not found locally";
 if (fs.existsSync(filePath)) {
 fs.unlinkSync(filePath);
 localStatus = "✅ Removed from Local Storage";
 }

 api.sendMessage(`🗑️ **Deletion Complete!**\n\n📁 **File:** ${fileName}\n🌐 ${githubStatus}\n💻 ${localStatus}`, event.threadID);
 } catch (error) {
 api.sendMessage(`❌ Error: ${error.message}`, event.threadID);
 }
 } else {
 api.sendMessage(`❌ Deletion of '${fileName}' has been cancelled.`, event.threadID);
 }

 global.GoatBot.onReply.delete(Reply.messageID);
 }
};