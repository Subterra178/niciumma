const applicationId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!applicationId || !token) {
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
      required: true,
      autocomplete: true,
    },
    {
      type: 3,
      name: "function",
      description: "関数名、main、またはリスト名",
      required: true,
      autocomplete: true,
    },
  ],
};

const url = guildId
  ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${applicationId}/commands`;

const response = await fetch(url, {
  method: "PUT",
  headers: {
    "Authorization": `Bot ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify([command]),
});

const text = await response.text();

if (!response.ok) {
  console.error(`Discord API error: ${response.status}`);
  console.error(text);
  process.exit(1);
}

console.log("Niciumma コマンドを登録しました。");
console.log(text);
