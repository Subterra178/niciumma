import process from "node:process";

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !appId) {
  console.error("DISCORD_TOKEN と DISCORD_APPLICATION_ID を環境変数に設定してください。");
  process.exit(1);
}

const command = {
  name: "niciumma",
  description: "Scratchプロジェクトのスクリプトやリストを表示します",
  options: [
    {
      type: 3,
      name: "sprite",
      description: "スプライト名（ls の場合はリスト表示）",
      required: true
    },
    {
      type: 3,
      name: "function",
      description: "関数名、main、またはリスト名",
      required: true
    }
  ]
};

const url = guildId
  ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${appId}/commands`;

const r = await fetch(url, {
  method: "PUT",
  headers: {
    "Authorization": `Bot ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify([command])
});

console.log(await r.text());
if (!r.ok) process.exit(1);
