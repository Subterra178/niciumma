function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=UTF-8" },
  });
}

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

function getOption(options, name) {
  return (options ?? []).find((o) => o.name === name)?.value;
}

async function loadProject(env) {
  const response = await fetch(env.DATA_BASE_URL, {
    headers: { "User-Agent": "Niciumma4/1.0" },
    cf: { cacheTtl: 60, cacheEverything: true },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  return response.json();
}

/*
 * Button custom_id is intentionally short.
 * It contains only the owner, page and lookup information.
 * The project data itself is fetched again when the button is pressed.
 */
function makeCustomId(kind, ownerId, page, sprite, name) {
  return [
    "niciumma",
    kind,
    ownerId,
    String(page),
    encodeURIComponent(sprite),
    encodeURIComponent(name),
  ].join(":");
}

function parseCustomId(customId) {
  const parts = customId.split(":");
  if (parts.length !== 6 || parts[0] !== "niciumma") return null;

  return {
    kind: parts[1],
    ownerId: parts[2],
    page: Number(parts[3]),
    sprite: decodeURIComponent(parts[4]),
    name: decodeURIComponent(parts[5]),
  };
}

function paginationComponents(kind, ownerId, page, totalPages, sprite, name) {
  if (totalPages <= 1) return [];

  return [{
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        label: "前へ",
        custom_id: makeCustomId(kind, ownerId, Math.max(0, page - 1), sprite, name),
        disabled: page <= 0,
      },
      {
        type: 2,
        style: 2,
        label: "次へ",
        custom_id: makeCustomId(kind, ownerId, Math.min(totalPages - 1, page + 1), sprite, name),
        disabled: page >= totalPages - 1,
      },
    ],
  }];
}

function codeMessage(sprite, functionName, lines, page, ownerId) {
  const totalPages = Math.max(1, Math.ceil(lines.length / 20));
  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * 20;
  const shown = lines.slice(start, start + 20);

  const code = shown.map((line, i) => {
    const lineNumber = String(start + i + 1).padStart(3, " ");
    return `${lineNumber}  ${line}`;
  }).join("\n");

  return {
    content:
      `**${sprite} / ${functionName}**\n` +
      "```text\n" +
      `${code || "(空のスクリプト)"}\n` +
      "```\n" +
      `ページ ${page + 1} / ${totalPages}`,
    components: paginationComponents(
      "code", ownerId, page, totalPages, sprite, functionName
    ),
  };
}

function listMessage(sprite, listName, items, page, ownerId) {
  const totalPages = Math.max(1, Math.ceil(items.length / 20));
  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * 20;
  const shown = items.slice(start, start + 20);

  const content = shown.map((item, i) => {
    return `${start + i + 1}. ${item}`;
  }).join("\n");

  return {
    content:
      `**${sprite} / ${listName}**\n\n` +
      `${content || "(空のリスト)"}\n\n` +
      `ページ ${page + 1} / ${totalPages}`,
    components: paginationComponents(
      "list", ownerId, page, totalPages, sprite, listName
    ),
  };
}

function findTarget(project, sprite) {
  return (project.targets ?? []).find((target) => target.name === sprite);
}

async function handleCommand(interaction, env) {
  const options = interaction.data?.options ?? [];
  const sprite = getOption(options, "sprite");
  const name = getOption(options, "function");
  const ownerId = interaction.member?.user?.id ?? interaction.user?.id;

  const project = await loadProject(env);

  // /niciumma ls <リスト名>
  if (sprite === "ls") {
    const listName = name;

    for (const target of project.targets ?? []) {
      const list = target.lists?.[listName];

      if (list) {
        const items = Array.isArray(list.value)
          ? list.value.map(String)
          : [];

        return {
          type: 4,
          data: listMessage(target.name, listName, items, 0, ownerId),
        };
      }
    }

    return {
      type: 4,
      data: {
        content: `リスト \`${listName}\` が見つかりません。`,
        flags: 64,
      },
    };
  }

  const target = findTarget(project, sprite);

  if (!target) {
    return {
      type: 4,
      data: {
        content: `スプライト \`${sprite}\` が見つかりません。`,
        flags: 64,
      },
    };
  }

  /*
   * The SB3 converter will create:
   *
   * target.niciumma.functions["関数名"] = [
   *   "緑の旗が押されたとき",
   *   "├─ ...",
   *   "└─ ..."
   * ]
   */
  const lines = target.niciumma?.functions?.[name];

  if (!Array.isArray(lines)) {
    return {
      type: 4,
      data: {
        content: `\`${sprite} / ${name}\` が見つかりません。`,
        flags: 64,
      },
    };
  }

  return {
    type: 4,
    data: codeMessage(sprite, name, lines.map(String), 0, ownerId),
  };
}

async function handleButton(interaction, env) {
  const state = parseCustomId(interaction.data?.custom_id ?? "");

  if (!state) {
    return {
      type: 4,
      data: { content: "不正なページ情報です。", flags: 64 },
    };
  }

  const userId = interaction.member?.user?.id ?? interaction.user?.id;

  if (state.ownerId !== userId) {
    return {
      type: 4,
      data: {
        content: "このページ送りは、コマンドを実行したユーザーだけ操作できます。",
        flags: 64,
      },
    };
  }

  const project = await loadProject(env);

  if (state.kind === "code") {
    const target = findTarget(project, state.sprite);
    const lines = target?.niciumma?.functions?.[state.name];

    if (!Array.isArray(lines)) {
      return {
        type: 4,
        data: { content: "元のデータが見つかりません。", flags: 64 },
      };
    }

    return {
      type: 7,
      data: codeMessage(
        state.sprite,
        state.name,
        lines.map(String),
        state.page,
        userId,
      ),
    };
  }

  if (state.kind === "list") {
    const target = findTarget(project, state.sprite);
    const list = target?.lists?.[state.name];

    if (!list) {
      return {
        type: 4,
        data: { content: "元のリストが見つかりません。", flags: 64 },
      };
    }

    const items = Array.isArray(list.value)
      ? list.value.map(String)
      : [];

    return {
      type: 7,
      data: listMessage(
        state.sprite,
        state.name,
        items,
        state.page,
        userId,
      ),
    };
  }

  return {
    type: 4,
    data: { content: "不明なページ種別です。", flags: 64 },
  };
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

    // Discord's endpoint verification request.
    if (interaction.type === 1) {
      return json({ type: 1 });
    }

    try {
      if (interaction.type === 2) {
        return json(await handleCommand(interaction, env));
      }

      if (interaction.type === 3) {
        return json(await handleButton(interaction, env));
      }

      return json({
        type: 4,
        data: { content: "未対応のInteractionです。", flags: 64 },
      });
    } catch (error) {
      console.error(error);

      return json({
        type: 4,
        data: {
          content: "処理中にエラーが発生しました。",
          flags: 64,
        },
      });
    }
  },
};
