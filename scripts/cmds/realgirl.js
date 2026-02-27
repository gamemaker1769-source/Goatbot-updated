const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "realgirl",
    version: "2.0",
    author: "Siam x ChatGPT",
    shortDescription: "Send random girl image",
    longDescription: "Send random image from nekobot API",
    category: "18+",
    guide: "{pn} [boobs|hass|pgif]"
  },

  onStart: async function ({ api, event, args }) {
    const type = (args[0] || "boobs").toLowerCase();
    const validTypes = ["boobs", "hass", "pgif"];

    if (!validTypes.includes(type)) {
      return api.sendMessage(
        `❌ Invalid type!\nTry: ${validTypes.join(", ")}`,
        event.threadID,
        event.messageID
      );
    }

    const folderPath = path.join(__dirname, "cache");
    const filePath = path.join(folderPath, `realgirl_${Date.now()}.jpg`);

    try {
      if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath, { recursive: true });

      const res = await axios.get(`https://nekobot.xyz/api/image?type=${type}`);
      const imageUrl = res.data.message;

      const imgBuffer = (
        await axios.get(imageUrl, { responseType: "arraybuffer" })
      ).data;

      fs.writeFileSync(filePath, imgBuffer);

      await api.sendMessage(
        {
          body: `Here's a ${type.toUpperCase()} 🔥`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        event.messageID
      );

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error(err);
      return api.sendMessage(
        "❌ Couldn't fetch the image. Try again later.",
        event.threadID,
        event.messageID
      );
    }
  }
};