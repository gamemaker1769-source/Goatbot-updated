module.exports = {
	config: {
		name: "off",
		version: "1.0",
		author: "Siam",
		role: 2, // 2 = admin (change to 0 if everyone can use)
		category: "system",
		shortDescription: "Turn bot off"
	},

	onStart: async function ({ message }) {
		global.GoatBot.botStatus = false;
		return message.reply("🛑 Bot is now OFF.");
	}
};
