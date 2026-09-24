import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

const token =
  process.env.DISCORD_TOKEN ||
  await rl.question("Discord Bot Token: ");

const applicationId =
  process.env.DISCORD_APPLICATION_ID ||
  await rl.question("Application ID: ");

const guildId =
  process.env.DISCORD_GUILD_ID ||
  await rl.question("Guild ID (optional; Enter for global): ");

rl.close();

const command = {
  name: "niciumma",
  description: "Scratchプロジェクトを検索します",
  options: [
    {
      type: 3,
      name: "sprite",
      description: "スプライト名（ls の場合は ls）",
      required: true,
    },
    {
      type: 3,
      name: "function",
      description: "関数名（ls の場合はリスト名）",
      required: true,
    },
  ],
};

const url = guildId
  ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${applicationId}/commands`;

const response = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify([command]),
});

const body = await response.text();

if (!response.ok) {
  console.error(`Discord API error ${response.status}`);
  console.error(body);
  process.exit(1);
}

console.log("Niciumma4 command registered.");
console.log(body);
