const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const destinationTID = "9322675214482986"; // যেই গ্রুপে resend যাবে
const cacheDir = path.join(__dirname, "cache");

// ensure cache folder exists
fs.ensureDirSync(cacheDir);

module.exports = {
  config: {
    name: "resend",
    version: "3.1",
    author: "Fixed by ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Track unsend message & resend",
    longDescription: "Unsend হলে message + attachments নির্দিষ্ট গ্রুপে পাঠাবে",
    category: "group"
  },

  onChat: async function ({ event, api, threadsData, usersData }) {
    if (!global.logMessage) global.logMessage = new Map();
    if (!global.data) global.data = {};
    if (!global.data.botID) global.data.botID = api.getCurrentUserID();

    const { threadID, senderID } = event;

    // ignore bot messages
    if (senderID == global.data.botID) return;

    const threadData = (await threadsData.get(threadID)) || {};
    const resendEnabled =
      typeof threadData.resend !== "undefined" ? threadData.resend : true;

    if (!resendEnabled) return;

    // ---------------- NORMAL MESSAGE STORE ----------------
    if (event.type !== "message_unsend") {
      if (!event.messageID) return;
      global.logMessage.set(event.messageID, {
        body: event.body || "",
        attachments: event.attachments || []
      });
      return;
    }

    // ---------------- UNSEND EVENT ----------------
    if (event.type === "message_unsend") {
      const deletedMsg = global.logMessage.get(event.messageID);
      if (!deletedMsg) return;

      const userData = await usersData.get(senderID);
      const senderName = userData?.name || "Unknown User";

      const msgSend = {
        body:
          `🚨 ${senderName} unsent a message!\n\n` +
          (deletedMsg.body ? `📝 Content:\n${deletedMsg.body}\n\n` : "") +
          `📎 Attachments: ${deletedMsg.attachments.length}`,
        attachment: [],
        mentions: [{ tag: senderName, id: senderID }]
      };

      // attachments safely resend
      for (let i = 0; i < deletedMsg.attachments.length; i++) {
        try {
          const attachment = deletedMsg.attachments[i];

          const response = await axios.get(attachment.url, {
            responseType: "arraybuffer",
            timeout: 15000
          });

          const ext = attachment.type || "dat";
          const tempPath = path.join(
            cacheDir,
            `resend_${event.messageID}_${i}.${ext}`
          );

          fs.writeFileSync(tempPath, Buffer.from(response.data));

          const stream = fs.createReadStream(tempPath);
          msgSend.attachment.push(stream);

          // auto delete temp file after send
          stream.on("end", () => {
            fs.unlink(tempPath, () => {});
          });
        } catch (err) {
          console.log("Attachment Error:", err);
        }
      }

      api.sendMessage(msgSend, destinationTID);

      // clean memory
      global.logMessage.delete(event.messageID);
    }
  },

  onStart: async function ({ message, event, args, threadsData, api }) {
    const { threadID } = event;
    const sub = args[0]?.toLowerCase();

    let threadData = (await threadsData.get(threadID)) || {};

    if (sub === "off") {
      threadData.resend = false;
      await threadsData.set(threadID, threadData);
      return api.sendMessage("❌ Resend OFF", threadID);
    }

    if (sub === "on") {
      threadData.resend = true;
      await threadsData.set(threadID, threadData);
      return api.sendMessage("✅ Resend ON", threadID);
    }

    const status =
      typeof threadData.resend !== "undefined" ? threadData.resend : true;

    return api.sendMessage(
      `ℹ️ Resend status: ${status ? "ON" : "OFF"}\n\nUse:\nresend on\nresend off`,
      threadID
    );
  }
};