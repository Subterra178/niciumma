import data from "../data/bot-data.json";

const PAGE_SIZE = 20;
const spriteNames = Object.keys(data.sprites);
const listEntries = data.lists;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=UTF-8" },
  });
}

// 署名検証
function hexBytes(hex) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function verifyDiscord(request, publicKey) {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  if (!signature || !timestamp || !publicKey) return false;

  const body = await request.clone().text();

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexBytes(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      hexBytes(signature),
      new TextEncoder().encode(timestamp + body),
    );
  } catch {
    return false;
  }
}

// データの検索!
function getOption(options, name) {
  return (options ?? []).find((o) => o.name === name)?.value;
}

function findSpriteIndex(name) {
  const exact = spriteNames.indexOf(name);
  if (exact >= 0) return exact;
  const lower = String(name ?? "").toLowerCase();
  return spriteNames.findIndex((n) => n.toLowerCase() === lower);
}

function functionKeys(spriteIndex) {
  return Object.keys(data.sprites[spriteNames[spriteIndex]]?.functions ?? {});
}

// autocomplete の値は100文字で切っているので、切った名前でも引けるようにする
function findFunctionIndex(spriteIndex, name) {
  const keys = functionKeys(spriteIndex);
  const target = String(name ?? "");
  let i = keys.indexOf(target);
  if (i < 0) i = keys.findIndex((k) => k.slice(0, 100) === target);
  if (i < 0) i = keys.findIndex((k) => k.toLowerCase() === target.toLowerCase());
  return i;
}

function functionLines(spriteIndex, fnIndex) {
  const spriteName = spriteNames[spriteIndex];
  const key = functionKeys(spriteIndex)[fnIndex];
  return data.sprites[spriteName]?.functions?.[key] ?? null;
}

function findListIndex(name) {
  return listEntries.findIndex((l) => l.name === name);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((v) => typeof v === "string" && v.length > 0))];
}

function startsWithFilter(values, query, limit = 25) {
  const q = String(query ?? "").toLowerCase();
  const normalized = uniqueStrings(values);
  const starts = normalized.filter((v) => v.toLowerCase().startsWith(q));
  const contains = normalized.filter(
    (v) => !v.toLowerCase().startsWith(q) && v.toLowerCase().includes(q),
  );
  return [...starts, ...contains].slice(0, limit);
}

function choices(names, query) {
  return {
    type: 8,
    data: {
      choices: startsWithFilter(names, query).map((name) => ({
        name: name.slice(0, 100),
        value: name.slice(0, 100),
      })),
    },
  };
}

function handleAutocomplete(interaction) {
  const options = interaction.data?.options ?? [];
  const focused = options.find((o) => o.focused === true);
  const query = focused?.value ?? "";

  if (focused?.name === "sprite") {
    return choices(["ls", ...spriteNames], query);
  }

  if (focused?.name === "function") {
    const sprite = getOption(options, "sprite");

    if (sprite === "ls") {
      return choices(listEntries.map((l) => l.name), query);
    }

    const si = findSpriteIndex(sprite);
    if (si < 0) return choices([], query);
    return choices(functionKeys(si), query);
  }

  return choices([], query);
}


function makeCustomId(kind, ownerId, page, a, b) {
  return ["niciumma", kind, ownerId, page, a, b].join(":");
}

function parseCustomId(customId) {
  const p = customId.split(":");
  if (p.length !== 6 || p[0] !== "niciumma") return null;
  return {
    kind: p[1],
    ownerId: p[2],
    page: Number(p[3]),
    a: Number(p[4]),
    b: Number(p[5]),
  };
}

function paginationComponents(kind, ownerId, page, totalPages, a, b) {
  if (totalPages <= 1) return [];
  return [{
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        label: "前へ",
        custom_id: makeCustomId(kind, ownerId, Math.max(0, page - 1), a, b),
        disabled: page <= 0,
      },
      {
        type: 2,
        style: 2,
        label: "次へ",
        custom_id: makeCustomId(kind, ownerId, Math.min(totalPages - 1, page + 1), a, b),
        disabled: page >= totalPages - 1,
      },
    ],
  }];
}

const short = (s, n = 50) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function codeMessage(spriteIndex, fnIndex, page, ownerId) {
  const lines = functionLines(spriteIndex, fnIndex) ?? [];
  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_SIZE));
  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * PAGE_SIZE;
  const code = lines.slice(start, start + PAGE_SIZE).map((line, i) => {
    return `${String(start + i + 1).padStart(3, " ")}  ${line}`;
  }).join("\n");

  const title = `${short(spriteNames[spriteIndex])} / ${short(functionKeys(spriteIndex)[fnIndex])}`;

  return {
    content:
      `**${title}**\n` +
      "```text\n" +
      `${code || "(空のスクリプト)"}\n` +
      "```\n" +
      `ページ ${page + 1} / ${totalPages}`,
    components: paginationComponents("code", ownerId, page, totalPages, spriteIndex, fnIndex),
  };
}

function listMessage(listIndex, page, ownerId) {
  const list = listEntries[listIndex];
  const items = list?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * PAGE_SIZE;
  const body = items.slice(start, start + PAGE_SIZE)
    .map((item, i) => `${start + i + 1}. ${short(item, 80)}`)
    .join("\n");

  return {
    content:
      `**${short(list.sprite)} / ${short(list.name)}**\n\n` +
      `${body || "(空のリスト)"}\n\n` +
      `ページ ${page + 1} / ${totalPages}`,
    components: paginationComponents("list", ownerId, page, totalPages, listIndex, 0),
  };
}

const ephemeral = (content) => ({ type: 4, data: { content, flags: 64 } });

function handleCommand(interaction) {
  const options = interaction.data?.options ?? [];
  const sprite = getOption(options, "sprite");
  const name = getOption(options, "function");
  const ownerId = interaction.member?.user?.id ?? interaction.user?.id;

  if (sprite === "ls") {
    const li = findListIndex(name);
    if (li < 0) return ephemeral(`リスト \`${name}\` が見つかりません。`);
    return { type: 4, data: listMessage(li, 0, ownerId) };
  }

  const si = findSpriteIndex(sprite);
  if (si < 0) return ephemeral(`スプライト \`${sprite}\` が見つかりません。`);

  const fi = findFunctionIndex(si, name);
  if (fi < 0) return ephemeral(`\`${sprite} / ${name}\` が見つかりません。`);

  return { type: 4, data: codeMessage(si, fi, 0, ownerId) };
}

function handleButton(interaction) {
  const state = parseCustomId(interaction.data?.custom_id ?? "");
  if (!state) return ephemeral("不正なページ情報です。");

  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  if (state.ownerId !== userId) {
    return ephemeral("このページ送りは、コマンドを実行したユーザーだけ操作できます。");
  }

  if (state.kind === "code") {
    if (!functionLines(state.a, state.b)) return ephemeral("元のデータが見つかりません。");
    return { type: 7, data: codeMessage(state.a, state.b, state.page, userId) };
  }

  if (state.kind === "list") {
    if (!listEntries[state.a]) return ephemeral("元のリストが見つかりません。");
    return { type: 7, data: listMessage(state.a, state.page, userId) };
  }

  return ephemeral("不明なページ種別です。");
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Niciumma4", { status: 200 });
    }

    if (!await verifyDiscord(request, env.DISCORD_PUBLIC_KEY)) {
      return new Response("Invalid request signature", { status: 401 });
    }

    const interaction = await request.json();

    try {
      switch (interaction.type) {
        case 1: return json({ type: 1 });            // PING
        case 2: return json(handleCommand(interaction));  // コマンド実行
        case 3: return json(handleButton(interaction));   // ボタン
        case 4: return json(handleAutocomplete(interaction));
        default: return json(ephemeral("未対応のInteractionです。"));
      }
    } catch (error) {
      console.error(error);
      if (interaction.type === 4) return json({ type: 8, data: { choices: [] } });
      return json(ephemeral("処理中にエラーが発生しました。"));
    }
  },
};
