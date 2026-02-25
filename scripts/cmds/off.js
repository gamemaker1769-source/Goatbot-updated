module.exports = {
	config: {
		name: "off",
		version: "1.0",
		author: "Siam",
		role: 2,
		category: "system"
	},

	onStart: async function ({ api, event }) {
		global.botOff = true;
		return api.sendMessage("🔴 Bot is now OFF.", event.threadID);
	}
};
