module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "cmd", "h"],
    version: "5.1",
    author: "Light⚡",
    shortDescription: "Show all commands with short descriptions",
    longDescription: "Displays categorized list of commands with short descriptions or detailed info for a specific command.",
    category: "system",
    guide: "{pn}          → show menu\n{pn} <command> → show command details"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;

    // Role display names
    const roleNames = {
      0: "Everyone",
      1: "Group Admin",
      2: "Moderator",
      3: "Bot Admin",
      4: "Bot Owner"
    };

    // Category config with emojis and sort order
    const categoryConfig = {
      system:    { emoji: "⚙️", priority: 1 },
      config:    { emoji: "🛠️", priority: 2 },
      admin:     { emoji: "👑", priority: 3 },
      owner:     { emoji: "🔰", priority: 4 },
      ai:        { emoji: "🤖", priority: 5 },
      "ai-image":{ emoji: "🖼️", priority: 6 },
      info:      { emoji: "ℹ️",  priority: 7 },
      utility:   { emoji: "🧰", priority: 8 },
      tools:     { emoji: "🔧", priority: 9 },
      media:     { emoji: "🎥", priority: 10 },
      image:     { emoji: "📸", priority: 11 },
      fun:       { emoji: "🎭", priority: 12 },
      game:      { emoji: "🎮", priority: 13 },
      economy:   { emoji: "💰", priority: 14 },
      rank:      { emoji: "🏆", priority: 15 },
      group:     { emoji: "👥", priority: 16 },
      "18+":     { emoji: "🔞", priority: 17 },
      boxchat:   { emoji: "💬", priority: 18 },
      others:    { emoji: "⋯",  priority: 99 }
    };

    const getCatInfo = (cat) => {
      const key = (cat || "others").toLowerCase().trim();
      return categoryConfig[key] || { emoji: "➤", priority: 100 };
    };

    // Single command details
    if (args[0]) {
      const query = args[0].toLowerCase().trim();
      let cmd = allCommands.get(query);

      if (!cmd) {
        cmd = [...allCommands.values()].find(c =>
          (c.config.aliases || []).some(a => a.toLowerCase() === query)
        );
      }

      if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

      const cfg = cmd.config;
      const catInfo = getCatInfo(cfg.category);

      const roleText = roleNames[cfg.role ?? 0] || "Unknown";
      const aliasesText = cfg.aliases?.length ? cfg.aliases.join(", ") : "None";
      const guideText = (typeof cfg.guide === "string" ? cfg.guide : cfg.guide?.en || `\( {prefix} \){cfg.name}`)
        .replace(/{pn}/g, prefix);

      const desc = cfg.longDescription?.en || cfg.shortDescription?.en || cfg.shortDescription || "No description available.";

      return message.reply(
        `✦ ${cfg.name.toUpperCase()} ✦\n\n` +
        `➤ Category    : ${catInfo.emoji} ${cfg.category || "others"}\n` +
        `➤ Description : ${desc}\n` +
        `➤ Aliases     : ${aliasesText}\n` +
        `➤ Usage       : ${guideText}\n` +
        `➤ Permission  : \( {roleText} ( \){cfg.role ?? 0})\n` +
        `➤ Author      : ${cfg.author || "Light⚡"}\n` +
        `➤ Version     : ${cfg.version || "1.0"}`
      );
    }

    // Full menu
    const categories = {};

    for (const [name, cmd] of allCommands) {
      const cat = (cmd.config.category || "others").toLowerCase().trim();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({
        name,
        shortDesc: cmd.config.shortDescription || "No description"
      });
    }

    const sortedCats = Object.keys(categories).sort(
      (a, b) => getCatInfo(a).priority - getCatInfo(b).priority
    );

    let text = `Light⚡  •  Command Menu\n`;
    text += `Total: ${allCommands.size} commands\n`;
    text += `────────────────────────────\n`;

    for (const cat of sortedCats) {
      const cmds = categories[cat];
      if (!cmds?.length) continue;

      const info = getCatInfo(cat);
      text += `\n${info.emoji} \( {cat.toUpperCase()} ( \){cmds.length})\n`;

      cmds.sort((a, b) => a.name.localeCompare(b.name));

      for (const c of cmds) {
        text += `  • ${c.name.padEnd(15)} → ${c.shortDesc}\n`;
      }
    }

    text += `\n────────────────────────────\n`;
    text += `→ Use ${prefix}help <command> for full details\n`;
    text += `→ Prefix: ${prefix}   or   mention me`;

    // Message length safety
    if (text.length > 4200) {
      text = text.substring(0, 4100) + "\n\n... (menu truncated – too many commands)";
    }

    return message.reply(text);
  }
};