const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "file",
    aliases: ["source", "src", "code"],
    version: "1.7",
    author: "NeoKEX | enhanced by Grok",
    countDown: 5,
    role: 4,
    description: {
      vi: "Xem mã nguồn lệnh, liệt kê lệnh hoặc xóa file lệnh (có xác nhận yes/no hoặc y/n)",
      en: "View command source, list commands or delete command file (yes/no or y/n confirmation)"
    },
    category: "system",
    guide: {
      vi: "   {pn} <tên lệnh>        → xem source\n" +
          "   {pn} list              → liệt kê tất cả lệnh\n" +
          "   {pn} del <tên lệnh>    → xóa file lệnh (hỏi yes/no hoặc y/n)",
      en: "   {pn} <command name>    → view source\n" +
          "   {pn} list               → list all commands\n" +
          "   {pn} del <command name> → delete command file (confirm with yes/no or y/n)"
    }
  },

  onStart: async function ({ args, message, api, event }) {
    if (!args.length) {
      return message.reply(
        "❌ Usage:\n" +
        "• .file <command>       → view source code\n" +
        "• .file list            → show all commands\n" +
        "• .file del <command>   → delete command file (with yes/no or y/n confirmation)"
      );
    }

    const input = args[0].toLowerCase();

    // ────── .file list ──────
    if (input === "list") {
      const allCommands = global.GoatBot.commands;
      const commandList = [...allCommands.keys()].sort();

      if (commandList.length === 0) {
        return message.reply("❌ No commands found.");
      }

      const msg = 
        `📋 Total commands: ${commandList.length}\n\n` +
        commandList.map(name => `• ${name}`).join("\n") +
        "\n\nUse .file <name> to view | .file del <name> to remove";

      if (msg.length > 3800) {
        return message.reply(msg.substring(0, 3700) + "\n\n... (list truncated)");
      }

      return message.reply(msg);
    }

    // ────── .file del <cmd> ──────
    if (input === "del") {
      if (args.length < 2) {
        return message.reply("❌ Please specify command to delete\nExample: .file del fak");
      }

      const cmdToDelete = args[1].toLowerCase();

      if (cmdToDelete === "file") {
        return message.reply("❌ You cannot delete the file command itself.");
      }

      const allCommands = global.GoatBot.commands;
      let command = allCommands.get(cmdToDelete);

      if (!command) {
        command = [...allCommands.values()].find(c => 
          (c.config.aliases || []).some(alias => alias.toLowerCase() === cmdToDelete)
        );
      }

      const cmdName = command ? command.config.name.toLowerCase() : cmdToDelete;

      // Find file path
      const possibleLocations = [
        path.join(__dirname, `${cmdName}.js`),
        path.join(__dirname, "cmds", `${cmdName}.js`),
        path.join(__dirname, "../cmds", `${cmdName}.js`),
        path.join(process.cwd(), "cmds", `${cmdName}.js`),
        path.join(process.cwd(), "commands", `${cmdName}.js`),
      ];

      let filePath = null;
      for (const loc of possibleLocations) {
        if (fs.existsSync(loc)) {
          filePath = loc;
          break;
        }
      }

      if (!filePath) {
        return message.reply(
          `❌ Cannot delete: file for "${cmdName}" not found.\n` +
          `Tried:\n${possibleLocations.map(p => "→ " + path.relative(process.cwd(), p)).join("\n")}`
        );
      }

      // ─── Confirmation step ───
      const confirmationMsg = await message.reply(
        `⚠️ You are about to **DELETE** the command: **${cmdName}.js**\n\n` +
        `This action cannot be undone.\n\n` +
        `Reply with **yes** / **y**  to confirm deletion\n` +
        `Reply with **no** / **n**  or anything else to cancel\n\n` +
        `(auto-cancels after 60 seconds)`
      );

      const filter = (m) => 
        m.messageReply?.messageID === confirmationMsg.messageID && 
        m.senderID === event.senderID;

      const collector = api.listenMqtt((err, m) => {
        if (err) return;
        if (!filter(m)) return;

        const response = (m.body || "").toLowerCase().trim();

        const isConfirm = response === "yes" || response === "y";
        const isCancel  = response === "no"  || response === "n" || response === "";

        if (isConfirm) {
          try {
            const projectRoot = process.cwd();
            if (!filePath.startsWith(projectRoot)) {
              return message.reply("❌ Access denied: path outside project root");
            }

            fs.removeSync(filePath);

            if (allCommands.has(cmdName)) {
              allCommands.delete(cmdName);
            }

            message.reply(`🗑️ Successfully deleted: **${cmdName}.js**\n\n` +
                          `Bot restart may be required for the command to fully disappear.`);
          } catch (err) {
            console.error(err);
            message.reply(`❌ Failed to delete file:\n${err.message}`);
          }
        } else {
          message.reply("❌ Deletion cancelled.");
        }

        collector.stopListening();
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (collector) {
          collector.stopListening();
          message.reply("Confirmation timed out (60s). Deletion cancelled.");
        }
      }, 60000);

      return;
    }

    // ────── .file <command> (view source) ──────
    const commandName = input;
    const allCommands = global.GoatBot.commands;

    let command = allCommands.get(commandName);
    if (!command) {
      command = [...allCommands.values()].find(c => 
        (c.config.aliases || []).some(alias => alias.toLowerCase() === commandName)
      );
    }

    if (!command) {
      return message.reply(`❌ Command not found: ${commandName}`);
    }

    const cmdName = command.config.name.toLowerCase();

    const possibleLocations = [
      path.join(__dirname, `${cmdName}.js`),
      path.join(__dirname, "cmds", `${cmdName}.js`),
      path.join(__dirname, "../cmds", `${cmdName}.js`),
      path.join(process.cwd(), "cmds", `${cmdName}.js`),
      path.join(process.cwd(), "commands", `${cmdName}.js`),
    ];

    let filePath = null;
    for (const loc of possibleLocations) {
      if (fs.existsSync(loc)) {
        filePath = loc;
        break;
      }
    }

    if (!filePath) {
      return message.reply(
        `❌ Source file not found for "${cmdName}"\n\n` +
        `Tried:\n${possibleLocations.map(p => "→ " + path.relative(process.cwd(), p)).join("\n")}`
      );
    }

    try {
      const projectRoot = process.cwd();
      if (!filePath.startsWith(projectRoot)) {
        return message.reply("❌ Access denied: path outside project root");
      }

      const content = await fs.readFile(filePath, "utf-8");

      const header = `┏━━ Source: ${cmdName} ${"━".repeat(30 - cmdName.length - 10)}┓\n\n`;
      const footer = `\n\n┗${"━".repeat(40)}┛`;

      let displayText = header + content + footer;

      if (displayText.length > 3800) {
        displayText = header + content.substring(0, 3700 - header.length - footer.length) + 
                      "...\n(truncated - code too long)" + footer;
      }

      return message.reply(displayText);

    } catch (err) {
      console.error(err);
      return message.reply(`❌ Error reading file:\n${err.message}`);
    }
  }
};