module.exports = {
	config: {
		name: "on",
		version: "1.0",
		author: "Siam",
		role: 2,
		category: "system",
		shortDescription: "Turn bot on"
	},

	onStart: async function ({ message }) {
		global.GoatBot.botStatus = true;
		return message.reply("✅ Bot is BACK ONLINE.");
	}
};
