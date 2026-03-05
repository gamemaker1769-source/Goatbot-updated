module.exports = {
  config: {
    name: "resend",
    version: "2.0",
    author: "Siam (Fixed)",
    role: 0
  },

  onEvent: async function ({ event, api, Users }) {
    const { threadID, messageID, senderID, type } = event;

    // শুধুমাত্র মেসেজ আনসেন্ড হলে কাজ করবে
    if (type !== "message_unsend") return;

    // বটের মেমোরি চেক করা
    if (!global.client.messageData) global.client.messageData = new Map();
    const msgData = global.client.messageData.get(messageID);

    if (!msgData) return; // যদি মেমোরিতে মেসেজ না থাকে তবে রিটার্ন করবে

    const name = await Users.getNameUser(senderID);

    // ১. যদি শুধু টেক্সট মেসেজ হয়
    if (msgData.body && (!msgData.attachments || msgData.attachments.length === 0)) {
      return api.sendMessage(`${name} একটি মেসেজ ডিলিট করেছে:\n\n"${msgData.body}"`, threadID);
    }

    // ২. যদি মেসেজে ছবি/ভিডিও থাকে
    if (msgData.attachments && msgData.attachments.length > 0) {
      const attachments = [];
      for (let i of msgData.attachments) {
        try {
          const stream = await global.utils.getStreamFromURL(i.url);
          attachments.push(stream);
        } catch (e) {
          console.log("Error getting attachment:", e);
        }
      }

      return api.sendMessage({
        body: `${name} একটি মিডিয়া ফাইল ডিলিট করেছে।${msgData.body ? `\nক্যাপশন: "${msgData.body}"` : ""}`,
        attachment: attachments
      }, threadID);
    }
  }
};
