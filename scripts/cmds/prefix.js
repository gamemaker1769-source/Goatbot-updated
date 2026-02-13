const fs = require("fs-extra");
const path = require("path");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "4.0",
		author: "NTKhang & NeoKEX + Siam Local Video",
		countDown: 5,
		role: 0,
		description: "Change prefix + show local video",
		category: "config"
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData }) {

		if (!args[0])
			return message.SyntaxError();

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply("✅ Prefix reset to default.");
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply("❌ Only admin can change global prefix");
			formSet.setGlobal = true;
		}
		else formSet.setGlobal = false;

		return message.reply("⚠ React to confirm prefix change", (err, info) => {
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction }) {

		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author)
			return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			return message.reply("✅ Global prefix changed to: " + newPrefix);
		}
		else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply("✅ Group prefix changed to: " + newPrefix);
		}
	},

	onChat: async function ({ event, message, usersData }) {

		if (event.body && event.body.toLowerCase() === "prefix") {

			const userName = await usersData.getName(event.senderID);
			const botName = global.GoatBot.config.nickNameBot || "Bot";

			const videoPath = path.join(__dirname, "assets", "prefix.mp4");

			if (!fs.existsSync(videoPath)) {
				return message.reply("❌ prefix.mp4 not found in assets folder!");
			}

			return message.reply({
				body:
`👋 Hey ${userName}
➥ 🌐 Global: ${global.GoatBot.config.prefix}
➥ 💬 This Chat: ${utils.getPrefix(event.threadID)}
I'm ${botName} at your service 🫡`,
				attachment: fs.createReadStream(videoPath)
			});
		}
	}
};
