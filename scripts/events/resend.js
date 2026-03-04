module.exports = {
	config: {
		name: "resend",
		version: "1.5",
		author: "Siam (Fixed)",
		role: 0
	},

	onEvent: async function ({ event, api, Users }) {
		const { threadID, messageID, senderID, type } = event;

		// শুধুমাত্র message_unsend ইভেন্ট চেক করবে
		if (type !== "message_unsend") return;

		// বটের মেমোরি থেকে ডিলিট হওয়া মেসেজটি খোঁজা
		const msgData = global.client.messageData.get(messageID);
		if (!msgData) return;

		const name = await Users.getNameUser(senderID);

		// যদি শুধু টেক্সট মেসেজ হয়
		if (msgData.body && msgData.attachments.length === 0) {
			return api.sendMessage(`${name} এর ডিলিট করা মেসেজ:\n\n"${msgData.body}"`, threadID);
		}

		// যদি মেসেজে অ্যাটাচমেন্ট (ছবি/ভিডিও) থাকে
		if (msgData.attachments.length > 0) {
			const attachments = [];
			for (let i of msgData.attachments) {
				// ড্রাইভ বা স্টোরেজ থেকে ফাইলটি পুনরায় পাঠাবে
				const stream = await global.utils.getStreamFromURL(i.url);
				attachments.push(stream);
			}

			return api.sendMessage({
				body: `${name} একটি মিডিয়া ফাইল ডিলিট করেছে${msgData.body ? ` যার ক্যাপশন ছিল: "${msgData.body}"` : ""}`,
				attachment: attachments
			}, threadID);
		}
	}
};
