// 古いコマンドの掃除用。
//   グローバルコマンドを全削除:   node scripts/clear-commands.mjs global
//   ギルドコマンドを全削除:       node scripts/clear-commands.mjs guild
const scope = process.argv[2];
const applicationId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!["global", "guild"].includes(scope) || !applicationId || !token || (scope === "guild" && !guildId)) {
  console.error("usage: node scripts/clear-commands.mjs <global|guild>  (要: DISCORD_TOKEN / DISCORD_APPLICATION_ID / guildの場合 DISCORD_GUILD_ID)");
  process.exit(1);
}

const url = scope === "guild"
  ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${applicationId}/commands`;

const headers = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };

const before = await (await fetch(url, { headers })).json();
console.log(`${scope} の登録済みコマンド:`, before.map((c) => c.name));

const res = await fetch(url, { method: "PUT", headers, body: "[]" });
console.log(res.ok ? `${scope} コマンドを全削除しました` : `失敗: ${res.status} ${await res.text()}`);
