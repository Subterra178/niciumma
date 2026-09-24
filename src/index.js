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

function getFocusedOption(options) {
  return (options ?? []).find((o) => o.focused === true);
}

function getAutocompleteContext(options) {
  return {
    sprite: getOption(options, "sprite"),
    functionName: getOption(options, "function"),
    focused: getFocusedOption(options),
  };
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

function autocompleteChoices(names, query) {
  return startsWithFilter(names, query).map((name) => ({
    name: name.slice(0, 100),
    value: name.slice(0, 100),
  }));
}

function targetNames(project) {
  return (project.targets ?? []).map((target) => target.name).filter(Boolean);
}

function functionNames(target) {
  return Object.keys(target?.niciumma?.functions ?? {});
}

function listNames(targets) {
  const result = [];

  for (const target of targets ?? []) {
    for (const raw of Object.values(target?.lists ?? {})) {
      if (Array.isArray(raw) && typeof raw[0] === "string") {
        result.push(raw[0]);
      } else if (raw && typeof raw === "object" && typeof raw.name === "string") {
        result.push(raw.name);
      }
    }
  }

  return uniqueStrings(result);
}

async function handleAutocomplete(interaction, env) {
  const options = interaction.data?.options ?? [];
  const { sprite, functionName, focused } = getAutocompleteContext(options);
  const query = focused?.value ?? "";

  // sprite is focused: suggest sprite names plus the special "ls" mode.
  if (focused?.name === "sprite") {
    const project = await loadProject(env);
    const names = ["ls", ...targetNames(project)];
    return {
      type: 8,
      data: { choices: autocompleteChoices(names, query) },
    };
  }

  // function is focused after a sprite has been selected.
  if (focused?.name === "function") {
    const project = await loadProject(env);

    if (sprite === "ls") {
      return {
        type: 8,
        data: {
          choices: autocompleteChoices(
            listNames(project.targets ?? []),
            query,
          ),
        },
      };
    }

    const target = findTarget(project, sprite);
    if (!target) {
      return {
        type: 8,
        data: { choices: [] },
      };
    }

    return {
      type: 8,
      data: {
        choices: autocompleteChoices(functionNames(target), query),
      },
    };
  }

  return {
    type: 8,
    data: { choices: [] },
  };
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

function findList(target, listName) {
  const lists = target?.lists ?? {};

  // Scratch project.json normally keys lists by ID, not by list name.
  for (const [id, raw] of Object.entries(lists)) {
    if (Array.isArray(raw) && raw[0] === listName) {
      return { id, name: raw[0], value: raw[1] };
    }

    if (raw && typeof raw === "object" && raw.name === listName) {
      return raw;
    }
  }

  // Keep compatibility with the old simplified JSON shape.
  const direct = lists[listName];
  if (direct) return direct;

  return null;
}

function getListItems(list) {
  if (Array.isArray(list)) {
    return Array.isArray(list[1]) ? list[1].map(String) : [];
  }

  if (Array.isArray(list?.value)) {
    return list.value.map(String);
  }

  return [];
}

async function editOriginalResponse(interaction, env, data) {
  const applicationId = interaction.application_id;
  const token = interaction.token;

  if (!applicationId || !token) {
    throw new Error("Discord interaction application_id/token is missing");
  }

  const url = `https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord original response edit failed: ${response.status} ${body}`);
  }
}

async function processCommand(interaction, env) {
  try {
    const result = await handleCommand(interaction, env);

    // handleCommand normally returns a type-4 response. Convert its data
    // into an edit of the deferred original response.
    await editOriginalResponse(interaction, env, result.data ?? {
      content: "処理結果を取得できませんでした。",
    });
  } catch (error) {
    console.error(error);

    try {
      await editOriginalResponse(interaction, env, {
        content: "処理中にエラーが発生しました。",
        components: [],
      });
    } catch (editError) {
      console.error(editError);
    }
  }
}

async function processButton(interaction, env) {
  try {
    const result = await handleButton(interaction, env);

    await editOriginalResponse(interaction, env, result.data ?? {
      content: "ページを更新できませんでした。",
    });
  } catch (error) {
    console.error(error);

    try {
      await editOriginalResponse(interaction, env, {
        content: "ページ更新中にエラーが発生しました。",
        components: [],
      });
    } catch (editError) {
      console.error(editError);
    }
  }
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
      const list = findList(target, listName);

      if (list) {
        const items = getListItems(list);

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
    const list = findList(target, state.name);

    if (!list) {
      return {
        type: 4,
        data: { content: "元のリストが見つかりません。", flags: 64 },
      };
    }

    const items = getListItems(list);

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
  async fetch(request, env, ctx) {
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

    if (interaction.type === 4) {
      try {
        return json(await handleAutocomplete(interaction, env));
      } catch (error) {
        console.error(error);
        return json({
          type: 8,
          data: { choices: [] },
        });
      }
    }

    if (interaction.type === 2) {
      // Acknowledge immediately so Discord does not time out while GitHub
      // and the Scratch project are being loaded/processed.
      ctx.waitUntil(processCommand(interaction, env));

      return json({
        type: 5,
      });
    }

    if (interaction.type === 3) {
      // Defer the button update for the same reason. Unauthorized users
      // are rejected synchronously inside handleButton.
      const userId = interaction.member?.user?.id ?? interaction.user?.id;
      const state = parseCustomId(interaction.data?.custom_id ?? "");

      if (!state) {
        return json({
          type: 4,
          data: { content: "不正なページ情報です。", flags: 64 },
        });
      }

      if (state.ownerId !== userId) {
        return json({
          type: 4,
          data: {
            content: "このページ送りは、コマンドを実行したユーザーだけ操作できます。",
            flags: 64,
          },
        });
      }

      ctx.waitUntil(processButton(interaction, env));
      return json({ type: 6 });
    }

    return json({
      type: 4,
      data: { content: "未対応のInteractionです。", flags: 64 },
    });
  },
};
