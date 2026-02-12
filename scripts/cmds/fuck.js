const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "fak",
    aliases: ["fuck"],
    version: "1.0",
    author: "your name",
    countDown: 20,
    role: 2,
    shortDescription: "",
    longDescription: "",
    category: "nsfw",
    guide: "{pn}"
  },

  onStart: async function ({ message, event, args }) {
    let one, two;

    if (event.type === "message_reply") {
      one = event.senderID;
      two = event.messageReply.senderID;
    } else {
      const mention = Object.keys(event.mentions);
      if (mention.length === 0) {
        return message.reply("Please mention or reply to someone");
      } else if (mention.length === 1) {
        one = event.senderID;
        two = mention[0];
      } else {
        one = mention[1];
        two = mention[0];
      }
    }

    if (one === two) {
      return message.reply("Cannot use the same person twice");
    }

    bal(one, two).then(ptth => {
      message.reply({ body: "「 Harder daddy 🥵💦 」", attachment: fs.createReadStream(ptth) });
    }).catch(error => {
      console.error(error);
      message.reply("Failed to generate the image.");
    });
  }
};

async function bal(one, two) {
  const avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  avone.circle();
  const avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  avtwo.circle();
  const pth = "fucked.png";
  const img = await jimp.read("https://i.ibb.co/YpR7Bpv/image.jpg");

  img.resize(639, 480).composite(avone.resize(90, 90), 23, 320).composite(avtwo.resize(100, 100), 110, 60);

  await img.writeAsync(pth);
  return pth;
}