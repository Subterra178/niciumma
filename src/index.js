const API_VERSION = "10";

const OPCODES = {
  event_whenflagclicked: "緑の旗が押されたとき",
  event_whenkeypressed: ({fields}) => `［${fields.KEY_OPTION?.[0] ?? ""}］キーが押されたとき`,
  event_whenthisspriteclicked: "このスプライトが押されたとき",
  event_whenstageclicked: "ステージが押されたとき",
  event_whenbroadcastreceived: ({fields}) => `［${fields.BROADCAST_OPTION?.[0] ?? ""}］を受け取ったとき`,
  event_whenbackdropswitchesto: ({fields}) => `背景が［${fields.BACKDROP?.[0] ?? ""}］になったとき`,
  event_whengreaterthan: ({fields}) => `［${fields.WHENGREATERTHANMENU?.[0] ?? ""}］> ( )`,
  motion_movesteps: ({input}) => `(${input("STEPS")}) 歩動かす`,
  motion_turnright: ({input}) => `↻ ${input("DEGREES")} 度回す`,
  motion_turnleft: ({input}) => `↺ ${input("DEGREES")} 度回す`,
  motion_pointindirection: ({input}) => `方向を (${input("DIRECTION")}) 度にする`,
  motion_gotoxy: ({input}) => `x座標を (${input("X")})、y座標を (${input("Y")}) にする`,
  motion_goto: ({input}) => `［${input("TO")}］へ行く`,
  motion_glideto: ({input}) => `1 秒で［${input("TO")}］へ行く`,
  motion_changexby: ({input}) => `x座標を (${input("DX")}) ずつ変える`,
  motion_setx: ({input}) => `x座標を (${input("X")}) にする`,
  motion_changeyby: ({input}) => `y座標を (${input("DY")}) ずつ変える`,
  motion_sety: ({input}) => `y座標を (${input("Y")}) にする`,
  motion_ifonedgebounce: "もし端に着いたら、跳ね返る",
  motion_setrotationstyle: ({fields}) => `回転方法を［${fields.STYLE?.[0] ?? ""}］にする`,
  looks_say: ({input}) => `(${input("MESSAGE")}) と言う`,
  looks_sayforsecs: ({input}) => `(${input("MESSAGE")}) と (${input("SECS")}) 秒言う`,
  looks_think: ({input}) => `(${input("MESSAGE")}) と考える`,
  looks_thinkforsecs: ({input}) => `(${input("MESSAGE")}) と (${input("SECS")}) 秒考える`,
  looks_switchcostumeto: ({input}) => `コスチュームを［${input("COSTUME")}］にする`,
  looks_nextcostume: "次のコスチュームにする",
  looks_switchbackdropto: ({input}) => `背景を［${input("BACKDROP")}］にする`,
  looks_nextbackdrop: "次の背景にする",
  looks_changeeffectby: ({fields, input}) => `［${fields.EFFECT?.[0] ?? ""}］の効果を (${input("CHANGE")}) ずつ変える`,
  looks_seteffectto: ({fields, input}) => `［${fields.EFFECT?.[0] ?? ""}］の効果を (${input("VALUE")}) にする`,
  looks_cleargraphiceffects: "画像効果をなくす",
  looks_changesizeby: ({input}) => `大きさを (${input("CHANGE")}) ずつ変える`,
  looks_setsizeto: ({input}) => `大きさを (${input("SIZE")}) %にする`,
  looks_show: "表示する",
  looks_hide: "隠す",
  looks_gotofrontback: ({fields}) => `［${fields.FRONT_BACK?.[0] ?? ""}］層に移動する`,
  looks_goforwardbackwardlayers: ({input}) => `(${input("NUM")}) 層［前/後］に移動する`,
  sound_play: ({input}) => `［${input("SOUND_MENU")}］の音を鳴らす`,
  sound_playuntildone: ({input}) => `［${input("SOUND_MENU")}］の音を鳴らし終わるまで待つ`,
  sound_stopallsounds: "すべての音を止める",
  sound_changeeffectby: ({fields, input}) => `［${fields.EFFECT?.[0] ?? ""}］の音の効果を (${input("VALUE")}) ずつ変える`,
  sound_seteffectto: ({fields, input}) => `［${fields.EFFECT?.[0] ?? ""}］の音の効果を (${input("VALUE")}) にする`,
  sound_setvolumeto: ({input}) => `音量を (${input("VOLUME")}) %にする`,
  sound_changevolumeby: ({input}) => `音量を (${input("VOLUME")}) ずつ変える`,
  control_wait: ({input}) => `(${input("DURATION")}) 秒待つ`,
  control_repeat: ({input}) => `(${input("TIMES")}) 回繰り返す`,
  control_forever: "ずっと",
  control_if: "もし",
  control_if_else: "もし",
  control_wait_until: ({input}) => `(${input("CONDITION")}) まで待つ`,
  control_repeat_until: "まで繰り返す",
  control_stop: ({fields}) => `［${fields.STOP_OPTION?.[0] ?? ""}］を止める`,
  control_start_as_clone: "クローンされたとき",
  control_create_clone_of: ({input}) => `［${input("CLONE_OPTION")}］のクローンを作る`,
  control_delete_this_clone: "このクローンを削除する",
  sensing_touchingobject: ({input}) => `［${input("TOUCHINGOBJECTMENU")}］に触れた`,
  sensing_touchingcolor: ({input}) => `${input("COLOR")} 色に触れた`,
  sensing_keypressed: ({input}) => `［${input("KEY_OPTION")}］キーが押された`,
  sensing_mousedown: "マウスが押された",
  sensing_mousex: "マウスのx座標",
  sensing_mousey: "マウスのy座標",
  sensing_loudness: "音量",
  sensing_timer: "タイマー",
  sensing_resettimer: "タイマーをリセット",
  sensing_current: ({fields}) => `現在の［${fields.CURRENTMENU?.[0] ?? ""}］`,
  sensing_dayssince2000: "2000年からの日数",
  sensing_username: "ユーザー名",
  operator_add: ({input}) => `(${input("NUM1")}) + (${input("NUM2")})`,
  operator_subtract: ({input}) => `(${input("NUM1")}) - (${input("NUM2")})`,
  operator_multiply: ({input}) => `(${input("NUM1")}) × (${input("NUM2")})`,
  operator_divide: ({input}) => `(${input("NUM1")}) ÷ (${input("NUM2")})`,
  operator_random: ({input}) => `(${input("FROM")}) から (${input("TO")}) までの乱数`,
  operator_gt: ({input}) => `(${input("OPERAND1")}) > (${input("OPERAND2")})`,
  operator_lt: ({input}) => `(${input("OPERAND1")}) < (${input("OPERAND2")})`,
  operator_equals: ({input}) => `(${input("OPERAND1")}) = (${input("OPERAND2")})`,
  operator_and: ({input}) => `<${input("OPERAND1")}> かつ <${input("OPERAND2")}>`,
  operator_or: ({input}) => `<${input("OPERAND1")}> または <${input("OPERAND2")}>`,
  operator_not: ({input}) => `ではない <${input("OPERAND")}>`,
  operator_join: ({input}) => `［${input("STRING1")}］と［${input("STRING2")}］`,
  operator_letter_of: ({input}) => `(${input("LETTER")}) 番目の文字（${input("STRING")}）`,
  operator_length: ({input}) => `［${input("STRING")}］の長さ`,
  operator_contains: ({input}) => `［${input("STRING")}］に［${input("LETTER")}］が含まれる`,
  operator_mod: ({input}) => `(${input("NUM1")}) を (${input("NUM2")}) で割った余り`,
  operator_round: ({input}) => `(${input("NUM")}) を四捨五入`,
  operator_mathop: ({fields, input}) => `［${fields.OPERATOR?.[0] ?? ""}］(${input("NUM")})`,
  data_setvariableto: ({fields, input}) => `［${fields.VARIABLE?.[0] ?? ""}］を (${input("VALUE")}) にする`,
  data_changevariableby: ({fields, input}) => `［${fields.VARIABLE?.[0] ?? ""}］を (${input("VALUE")}) ずつ変える`,
  data_showvariable: ({fields}) => `変数［${fields.VARIABLE?.[0] ?? ""}］を表示する`,
  data_hidevariable: ({fields}) => `変数［${fields.VARIABLE?.[0] ?? ""}］を隠す`,
  data_addtolist: ({input, fields}) => `(${input("ITEM")}) を［${fields.LIST?.[0] ?? ""}］に追加する`,
  data_deleteoflist: ({input, fields}) => `(${input("INDEX")}) 番目を［${fields.LIST?.[0] ?? ""}］から削除する`,
  data_deletealloflist: ({fields}) => `［${fields.LIST?.[0] ?? ""}］のすべてを削除する`,
  data_insertatlist: ({input, fields}) => `(${input("ITEM")}) を (${input("INDEX")}) 番目に［${fields.LIST?.[0] ?? ""}］へ挿入する`,
  data_replaceitemoflist: ({input, fields}) => `［${fields.LIST?.[0] ?? ""}］の (${input("INDEX")}) 番目を (${input("ITEM")}) に置き換える`,
  data_itemoflist: ({input, fields}) => `［${fields.LIST?.[0] ?? ""}］の (${input("INDEX")}) 番目`,
  data_itemnumoflist: ({input, fields}) => `［${fields.ITEM?.[0] ?? ""}］の［${fields.LIST?.[0] ?? ""}］での位置`,
  data_lengthoflist: ({fields}) => `［${fields.LIST?.[0] ?? ""}］の長さ`,
  data_listcontainsitem: ({input, fields}) => `［${fields.LIST?.[0] ?? ""}］に (${input("ITEM")}) が含まれる`,
  data_showlist: ({fields}) => `リスト［${fields.LIST?.[0] ?? ""}］を表示する`,
  data_hidelist: ({fields}) => `リスト［${fields.LIST?.[0] ?? ""}］を隠す`,
  procedures_call: ({block}) => block.mutation?.proccode ?? "カスタムブロックを実行する"
};

const CONTROL_WITH_SUBSTACK = new Set([
  "control_repeat", "control_forever", "control_if", "control_if_else",
  "control_repeat_until"
]);

function getInput(blocks, block, key, renderBlock) {
  const value = block.inputs?.[key];
  if (!value) return "";
  const ref = Array.isArray(value) ? value[value.length - 1] : value;
  if (typeof ref === "string" && blocks[ref]) return renderBlock(ref);
  if (Array.isArray(ref)) return primitive(ref);
  return String(ref ?? "");
}

function primitive(v) {
  if (!Array.isArray(v)) return String(v ?? "");
  if (v.length >= 2 && typeof v[0] === "number") return String(v[1] ?? "");
  return String(v[v.length - 1] ?? "");
}

function blockText(blocks, id, depth = 0, seen = new Set()) {
  if (!id || !blocks[id] || seen.has(id)) return "";
  seen.add(id);
  const block = blocks[id];
  const renderBlock = (childId) => blockText(blocks, childId, 0, new Set());
  const input = (key) => getInput(blocks, block, key, renderBlock);
  const fields = block.fields || {};
  if (block.opcode === "procedures_prototype") return block.mutation?.proccode ?? "";
  if (block.opcode === "procedures_definition") {
    const proto = getInput(blocks, block, "custom_block", renderBlock);
    return `定義 ${proto}`;
  }
  if (block.opcode === "control_if_else") return `もし <${input("CONDITION")}> なら`;
  if (block.opcode === "control_if") return `もし <${input("CONDITION")}> なら`;
  const spec = OPCODES[block.opcode];
  if (typeof spec === "function") return spec({block, input, fields});
  if (typeof spec === "string") return spec;
  if (block.opcode?.startsWith("data_variable")) {
    return fields.VARIABLE?.[0] ?? block.opcode;
  }
  return block.opcode ?? "不明なブロック";
}

function branchIds(blocks, start) {
  const ids = [];
  let cur = start;
  const seen = new Set();
  while (cur && blocks[cur] && !seen.has(cur)) {
    seen.add(cur);
    ids.push(cur);
    cur = blocks[cur].next;
  }
  return ids;
}

function buildTree(target, rootId) {
  const blocks = target.blocks || {};
  const lines = [];
  const seen = new Set();

  function walkSequence(start, prefix = "", isLast = true, nested = false) {
    const ids = branchIds(blocks, start);
    ids.forEach((id, idx) => {
      if (seen.has(id)) return;
      seen.add(id);
      const b = blocks[id];
      const last = idx === ids.length - 1;
      const connector = prefix ? (last ? "└─ " : "├─ ") : "";
      lines.push({text: prefix + connector + blockText(blocks, id), id});

      const childPrefix = prefix + (prefix ? (last ? "   " : "│  ") : "   ");

      if (b.opcode === "control_if" || b.opcode === "control_if_else") {
        const sub = b.inputs?.SUBSTACK;
        const sub2 = b.inputs?.SUBSTACK2;
        const sid = sub && sub[1];
        if (sid) walkSequence(sid, childPrefix, true, true);
        if (sub2 && sub2[1]) {
          lines.push({text: childPrefix + "└─ でなければ", id: `${id}:else`});
          walkSequence(sub2[1], childPrefix + "   ", true, true);
        }
      } else if (CONTROL_WITH_SUBSTACK.has(b.opcode)) {
        const sub = b.inputs?.SUBSTACK;
        const sid = sub && sub[1];
        if (sid) walkSequence(sid, childPrefix, true, true);
      }
    });
  }

  walkSequence(rootId);
  return lines;
}

function findRoots(target, functionName) {
  const blocks = target.blocks || {};
  const roots = [];
  for (const [id, b] of Object.entries(blocks)) {
    if (b.parent !== null) continue;
    if (functionName && functionName !== "main" && functionName !== "start") {
      if (b.opcode === "procedures_definition") {
        const protoId = b.inputs?.custom_block?.[1];
        const proto = protoId && blocks[protoId];
        if (proto?.mutation?.proccode === functionName) roots.push(id);
      }
      continue;
    }
    if (b.opcode === "event_whenflagclicked") roots.push(id);
  }
  return roots;
}

function getTarget(project, spriteName) {
  return (project.targets || []).find(t => t.name === spriteName) || null;
}

function listValue(target, listName) {
  const entry = target?.lists?.[listName];
  if (Array.isArray(entry)) return entry[1] || [];
  return null;
}

function paginate(lines, page) {
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(lines.length / pageSize));
  const safe = Math.min(Math.max(page, 0), pages - 1);
  return {items: lines.slice(safe * pageSize, safe * pageSize + pageSize), page: safe, pages};
}

function components(ownerId, kind, page, sprite, name, pages) {
  const row = [];
  if (page > 0) row.push({type: 2, style: 2, label: "前へ", custom_id: `n4|${kind}|${ownerId}|${page-1}|${encodeURIComponent(sprite)}|${encodeURIComponent(name)}`});
  if (page < pages - 1) row.push({type: 2, style: 2, label: "次へ", custom_id: `n4|${kind}|${ownerId}|${page+1}|${encodeURIComponent(sprite)}|${encodeURIComponent(name)}`});
  return row.length ? [{type: 1, components: row}] : [];
}

function codeMessage(ownerId, target, functionName, page = 0) {
  const roots = findRoots(target, functionName);
  let lines = [];
  for (const root of roots) lines.push(...buildTree(target, root));
  if (!lines.length) return null;
  const p = paginate(lines, page);
  const body = p.items.map((x, i) => `${p.page * 20 + i + 1}  ${x.text}`).join("\n");
  return {
    content: `**${target.name} / ${functionName}**  (${p.page + 1}/${p.pages})\n\`\`\`text\n${body}\n\`\`\``,
    components: components(ownerId, "code", p.page, target.name, functionName, p.pages)
  };
}

function listMessage(ownerId, target, listName, page = 0) {
  const values = listValue(target, listName);
  if (!values) return null;
  const lines = values.map((v, i) => `${i + 1}. ${String(v)}`);
  const p = paginate(lines, page);
  const body = p.items.join("\n") || "(空)";
  return {
    content: `**${target.name} / ${listName}**  (${p.page + 1}/${p.pages})\n\`\`\`text\n${body}\n\`\`\``,
    components: components(ownerId, "list", p.page, target.name, listName, p.pages)
  };
}

async function getProject(env) {
  const r = await fetch(env.DATA_BASE_URL, {cf: {cacheTtl: 30}});
  if (!r.ok) throw new Error(`project.json fetch failed: ${r.status}`);
  return await r.json();
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {status, headers: {"content-type": "application/json"}});
}

async function verifyDiscord(request, publicKeyHex) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  if (!signature || !timestamp) return false;
  const body = await request.clone().text();
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(publicKeyHex),
      {name: "Ed25519"},
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      {name: "Ed25519"},
      key,
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + body)
    );
  } catch {
    return false;
  }
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function option(data, name) {
  return data?.options?.find(o => o.name === name)?.value;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Niciumma4");

    if (!(await verifyDiscord(request, env.DISCORD_PUBLIC_KEY))) {
      return new Response("invalid request signature", {status: 401});
    }

    const interaction = await request.json();

    if (interaction.type === 1) return jsonResponse({type: 1});

    try {
      if (interaction.type === 2) {
        const sub = interaction.data?.name;
        const sprite = option(interaction.data, "sprite");
        const functionName = option(interaction.data, "function");
        const project = await getProject(env);

        if (sub === "niciumma" && sprite === "ls") {
          const target = getTarget(project, "Stage") || project.targets?.[0];
          const listName = functionName;
          const owner = interaction.member?.user?.id || interaction.user?.id;
          const msg = listMessage(owner, target, listName, 0);
          return msg
            ? jsonResponse({type: 4, data: msg})
            : jsonResponse({type: 4, data: {content: `リスト「${listName}」が見つかりません。`, flags: 64}});
        }

        const target = getTarget(project, sprite);
        const owner = interaction.member?.user?.id || interaction.user?.id;
        if (!target) return jsonResponse({type: 4, data: {content: `スプライト「${sprite}」が見つかりません。`, flags: 64}});
        const msg = codeMessage(owner, target, functionName, 0);
        return msg
          ? jsonResponse({type: 4, data: msg})
          : jsonResponse({type: 4, data: `「${sprite} / ${functionName}」に対応するスクリプトが見つかりません。`});
      }

      if (interaction.type === 3) {
        const parts = String(interaction.data?.custom_id || "").split("|");
        if (parts[0] !== "n4") return jsonResponse({type: 6});
        const [, kind, ownerId, pageText, sprite, name] = parts;
        const userId = interaction.member?.user?.id || interaction.user?.id;
        if (userId !== ownerId) {
          return jsonResponse({type: 4, data: {content: "このページ送りは、コマンドを実行したユーザーだけ操作できます。", flags: 64}});
        }
        const project = await getProject(env);
        const target = getTarget(project, decodeURIComponent(sprite));
        const n = Number(pageText) || 0;
        const msg = kind === "list"
          ? listMessage(ownerId, target, decodeURIComponent(name), n)
          : codeMessage(ownerId, target, decodeURIComponent(name), n);
        return msg
          ? jsonResponse({type: 7, data: msg})
          : jsonResponse({type: 7, data: {content: "データが見つかりません。", components: []}});
      }

      return jsonResponse({type: 4, data: {content: "未対応のInteractionです。", flags: 64}});
    } catch (e) {
      return jsonResponse({type: 4, data: {content: `エラー: ${e instanceof Error ? e.message : String(e)}`, flags: 64}});
    }
  }
};
