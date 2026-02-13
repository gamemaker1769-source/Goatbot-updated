module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "cmd", "h"],
    version: "5.3",
    author: "Light",
    shortDescription: "Show command list or command info",
    longDescription: "Show full menu or detailed usage for a specific command",
    category: "system",
    guide: "{pn} → show menu\n{pn} <command> → show command details"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;

    // ─── SINGLE COMMAND HELP ───
    if (args[0]) {
      const query = args[0].toLowerCase().trim();
      let cmd = allCommands.get(query);

      if (!cmd) {
        cmd = [...allCommands.values()].find(c =>
          (c.config.aliases || []).some(a => a.toLowerCase() === query)
        );
      }

      if (!cmd) {
        return message.reply(❌ Command "${query}" not found.);
      }

      const cfg = cmd.config;
      const cmdName = cfg.name;

      // Special clean format for "prefix" command (as you requested)
      if (cmdName === "prefix") {
        return message.reply(
          Help for command: ${prefix}${cmdName}\n\n +
          ${prefix}${cmdName} <new prefix> : Change prefix in current box\n +
          ${prefix}${cmdName} <new prefix> -g : Change system prefix\n +
          ${prefix}${cmdName} reset : Reset box prefix to default
        );
      }

      // Default format for all other commands
      const desc = cfg.longDescription || cfg.shortDescription || "No description available.";
      const aliases = cfg.aliases?.length ? cfg.aliases.join(", ") : "None";
      const guideText = (typeof cfg.guide === "string" ? cfg.guide : cfg.guide?.en || "")
        .replace(/{pn}/g, prefix)
        .trim() || ${prefix}${cmdName};

      return message.reply(
        Help for command: ${prefix}${cmdName}\n\n +
        Description: ${desc}\n +
        Aliases: ${aliases}\n +
        Usage:\n${guideText}
      );
    }

    // ─── FULL MENU ─── (simple list version)
    let menuText = ✦ LIGHT BOT COMMANDS ✦\n +
                   Prefix: ${prefix}\n +
                   Total commands: ${allCommands.size}\n +
                   ────────────────────\n\n;

    // Group by category (optional - can be removed if you want flat list)
    const categories = {};
    for (const [name, cmd] of allCommands) {
      const cat = (cmd.config.category || "others").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    // Sort categories alphabetically
    Object.keys(categories)
      .sort()
      .forEach(cat => {
        const cmds = categories[cat].sort();
        menuText += 【 ${cat.toUpperCase()} 】\n;
        cmds.forEach(name => {
          menuText += • ${prefix}${name}\n;
        });
        menuText += "\n";
      });

    menuText += ────────────────────\n +
                Type ${prefix}help <command> to see details\n +
                Example: ${prefix}help prefix;

    return message.reply(menuText);
  }
};
