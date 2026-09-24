import { readFile, writeFile } from "node:fs/promises";

const input = process.argv[2] ?? "data/project.json";
const output = process.argv[3] ?? "data/bot-data.json";

const T = {
  // 動き
  motion_movesteps: "{STEPS}歩動かす",
  motion_turnright: "右に{DEGREES}度回す",
  motion_turnleft: "左に{DEGREES}度回す",
  motion_gotoxy: "x座標を{X}、y座標を{Y}にする",
  motion_setx: "x座標を{X}にする",
  motion_sety: "y座標を{Y}にする",
  motion_changexby: "x座標を{DX}ずつ変える",
  motion_changeyby: "y座標を{DY}ずつ変える",
  motion_pointindirection: "{DIRECTION}度に向ける",
  motion_pointtowards: "{TOWARDS}へ向ける",
  motion_pointtowards_menu: "{TOWARDS}",
  motion_setrotationstyle: "回転方法を{STYLE}にする",
  motion_xposition: "x座標",
  motion_yposition: "y座標",
  motion_direction: "向き",
  // 見た目
  looks_show: "表示する",
  looks_hide: "隠す",
  looks_switchcostumeto: "コスチュームを{COSTUME}にする",
  looks_costume: "{COSTUME}",
  looks_nextcostume: "次のコスチュームにする",
  looks_seteffectto: "{EFFECT}の効果を{VALUE}にする",
  looks_cleargraphiceffects: "画像効果をなくす",
  looks_setsizeto: "大きさを{SIZE}%にする",
  looks_costumenumbername: "コスチューム{NUMBER_NAME}",
  // 音
  sound_play: "{SOUND_MENU}の音を鳴らす",
  sound_sounds_menu: "{SOUND_MENU}",
  // イベント
  event_whenflagclicked: "緑の旗が押されたとき",
  event_whenkeypressed: "{KEY_OPTION}キーが押されたとき",
  event_whenbroadcastreceived: "{BROADCAST_OPTION}を受け取ったとき",
  event_broadcast: "{BROADCAST_INPUT}を送る",
  // 制御
  control_wait: "{DURATION}秒待つ",
  control_wait_until: "{CONDITION}まで待つ",
  control_stop: "[{STOP_OPTION}]を止める",
  // 調べる
  sensing_askandwait: "{QUESTION}と聞いて待つ",
  sensing_answer: "答え",
  sensing_keypressed: "{KEY_OPTION}キーが押された",
  sensing_keyoptions: "{KEY_OPTION}",
  sensing_mousedown: "マウスが押された",
  sensing_mousex: "マウスのx座標",
  sensing_mousey: "マウスのy座標",
  sensing_distanceto: "{DISTANCETOMENU}までの距離",
  sensing_distancetomenu: "{DISTANCETOMENU}",
  sensing_timer: "タイマー",
  sensing_resettimer: "タイマーをリセット",
  sensing_dayssince2000: "2000年からの日数",
  sensing_username: "ユーザー名",
  sensing_current: "現在の{CURRENTMENU}",
  sensing_of: "{OBJECT}の{PROPERTY}",
  sensing_of_object_menu: "{OBJECT}",
  // 演算
  operator_add: "{NUM1} + {NUM2}",
  operator_subtract: "{NUM1} - {NUM2}",
  operator_multiply: "{NUM1} * {NUM2}",
  operator_divide: "{NUM1} / {NUM2}",
  operator_mod: "{NUM1} を {NUM2} で割った余り",
  operator_random: "{FROM}から{TO}までの乱数",
  operator_gt: "{OPERAND1} > {OPERAND2}",
  operator_lt: "{OPERAND1} < {OPERAND2}",
  operator_equals: "{OPERAND1} = {OPERAND2}",
  operator_and: "{OPERAND1} かつ {OPERAND2}",
  operator_or: "{OPERAND1} または {OPERAND2}",
  operator_not: "{OPERAND} ではない",
  operator_join: "{STRING1}と{STRING2}",
  operator_letter_of: "{STRING}の{LETTER}文字目",
  operator_length: "{STRING}の長さ",
  operator_contains: "{STRING1}が{STRING2}を含む",
  operator_round: "{NUM}の四捨五入",
  operator_mathop: "{NUM}の{OPERATOR}",
  // 変数・リスト
  data_setvariableto: "{VARIABLE}を{VALUE}にする",
  data_changevariableby: "{VARIABLE}を{VALUE}ずつ変える",
  data_showvariable: "変数{VARIABLE}を表示する",
  data_hidevariable: "変数{VARIABLE}を隠す",
  data_addtolist: "{ITEM}を{LIST}に追加する",
  data_deleteoflist: "{LIST}の{INDEX}番目を削除する",
  data_deletealloflist: "{LIST}のすべてを削除する",
  data_insertatlist: "{ITEM}を{LIST}の{INDEX}番目に挿入する",
  data_replaceitemoflist: "{LIST}の{INDEX}番目を{ITEM}で置き換える",
  data_itemoflist: "{LIST}の{INDEX}番目",
  data_itemnumoflist: "{ITEM}は{LIST}の何番目か",
  data_lengthoflist: "{LIST}の項目数",
  data_listcontainsitem: "{LIST}が{ITEM}を含む",
  data_showlist: "リスト{LIST}を表示する",
  data_hidelist: "リスト{LIST}を隠す",
  // ペン
  pen_clear: "全部消す",
  pen_stamp: "スタンプ",
  pen_penDown: "ペンを下ろす",
  pen_penUp: "ペンを上げる",
  pen_setPenColorToColor: "ペンの色を{COLOR}にする",
  pen_setPenColorParamTo: "ペンの{COLOR_PARAM}を{VALUE}にする",
  pen_changePenColorParamBy: "ペンの{COLOR_PARAM}を{VALUE}ずつ変える",
  pen_menu_colorParam: "{colorParam}",
  pen_setPenSizeTo: "ペンの太さを{SIZE}にする",
  pen_changePenSizeBy: "ペンの太さを{SIZE}ずつ変える",
  // その他
  translate_getViewerLanguage: "閲覧者の言語",
};

// 真偽値を返すブロックは <> で囲む。それ以外のレポーターは () で囲む
const BOOLEANS = new Set([
  "operator_gt", "operator_lt", "operator_equals", "operator_and", "operator_or",
  "operator_not", "operator_contains", "data_listcontainsitem",
  "sensing_keypressed", "sensing_mousedown", "sensing_touchingobject",
  "sensing_touchingcolor", "argument_reporter_boolean",
]);

// 中に積まれたブロックを持つ制御ブロック
const C_BLOCKS = {
  control_forever: { head: "ずっと", subs: ["SUBSTACK"] },
  control_repeat: { head: "{TIMES}回繰り返す", subs: ["SUBSTACK"] },
  control_repeat_until: { head: "{CONDITION}まで繰り返す", subs: ["SUBSTACK"] },
  control_while: { head: "{CONDITION}の間繰り返す", subs: ["SUBSTACK"] },
  control_for_each: { head: "{VARIABLE}を{VALUE}回繰り返す", subs: ["SUBSTACK"] },
  control_if: { head: "もし{CONDITION}なら", subs: ["SUBSTACK"] },
  control_if_else: { head: "もし{CONDITION}なら", subs: ["SUBSTACK", "SUBSTACK2"], elseAt: 1 },
};

const MAX_LINE = 70; // Discordの2000文字制限に収めるための1行の上限

/* ---------- 値の取り出し ---------- */
function makeRenderer(blocks) {
  const isBlockId = (v) => typeof v === "string" && blocks[v];

  function literal(v) {
    if (!Array.isArray(v)) return "";
    // [type, value, (id)] : 4-10 は数値/文字列, 11 は放送メッセージ, 12 は変数, 13 はリスト
    return String(v[1] ?? "");
  }

  function inputText(input) {
    if (!Array.isArray(input)) return "";
    const main = input[1];
    if (isBlockId(main)) return expr(main);
    if (Array.isArray(main)) return literal(main);
    // [3, null, [4,"10"]] のような空ソケット
    if (main == null && Array.isArray(input[2])) return literal(input[2]);
    return "";
  }

  function fill(template, block) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      if (block.inputs && key in block.inputs) return inputText(block.inputs[key]);
      if (block.fields && key in block.fields) return String(block.fields[key][0] ?? "");
      return "";
    });
  }

  function procCall(block) {
    const code = block.mutation?.proccode ?? "(不明なカスタムブロック)";
    const ids = safeParse(block.mutation?.argumentids) ?? [];
    let i = 0;
    return code.replace(/%[sb]/g, () => {
      const id = ids[i++];
      return id != null && block.inputs?.[id] ? inputText(block.inputs[id]) : "";
    });
  }

  function fallback(block) {
    const parts = [];
    for (const [k, v] of Object.entries(block.inputs ?? {})) {
      if (k.startsWith("SUBSTACK")) continue;
      parts.push(`${k}=${inputText(v)}`);
    }
    for (const [k, v] of Object.entries(block.fields ?? {})) parts.push(`${k}=${v[0]}`);
    return `${block.opcode}(${parts.join(", ")})`;
  }

  // レポーター/条件式
  function expr(id) {
    const b = blocks[id];
    if (!b) return "";
    let body;
    if (b.opcode === "procedures_call") body = procCall(b);
    else if (b.opcode.startsWith("argument_reporter_")) body = String(b.fields?.VALUE?.[0] ?? "");
    else if (b.opcode.endsWith("_menu") && !T[b.opcode]) body = String(Object.values(b.fields ?? {})[0]?.[0] ?? "");
    else body = T[b.opcode] ? fill(T[b.opcode], b) : fallback(b);

    // メニュー系（見た目が変わらないもの）は囲まない
    if (b.opcode.endsWith("_menu") || b.opcode === "looks_costume" || b.opcode === "sound_sounds_menu"
      || b.opcode === "sensing_keyoptions" || b.opcode === "pen_menu_colorParam") return body;
    return BOOLEANS.has(b.opcode) ? `<${body}>` : `(${body})`;
  }

  // スタック(連続するブロック)を行にする
  function stack(startId, depth, out) {
    let id = startId;
    const indent = "  ".repeat(depth);
    while (id && blocks[id]) {
      const b = blocks[id];
      const c = C_BLOCKS[b.opcode];
      if (c) {
        out.push(indent + fill(c.head, b));
        c.subs.forEach((sub, n) => {
          if (c.elseAt === n && n > 0) out.push(indent + "そうでなければ");
          const first = b.inputs?.[sub]?.[1];
          if (isBlockId(first)) stack(first, depth + 1, out);
        });
      } else if (b.opcode === "procedures_call") {
        out.push(indent + procCall(b));
      } else {
        out.push(indent + (T[b.opcode] ? fill(T[b.opcode], b) : fallback(b)));
      }
      id = b.next;
    }
    return out;
  }

  return { stack };
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function clip(line) {
  return line.length > MAX_LINE ? line.slice(0, MAX_LINE - 1) + "…" : line;
}

/* ---------- 本体 ---------- */
const project = JSON.parse(await readFile(input, "utf8"));
const sprites = {};
const lists = [];
let totalLines = 0;

for (const target of project.targets ?? []) {
  const blocks = target.blocks ?? {};
  const { stack } = makeRenderer(blocks);
  const functions = {};

  // カスタムブロック → 関数
  for (const b of Object.values(blocks)) {
    if (!b || b.opcode !== "procedures_definition") continue;
    const protoId = b.inputs?.custom_block?.[1];
    const code = blocks[protoId]?.mutation?.proccode;
    if (!code) continue;
    const lines = [`定義 ${code}`];
    stack(b.next, 1, lines);
    functions[code] = lines.map(clip);
  }

  // 緑の旗 → main, main#2, ...
  let flagCount = 0;
  for (const b of Object.values(blocks)) {
    if (!b || b.opcode !== "event_whenflagclicked") continue;
    flagCount++;
    const lines = ["緑の旗が押されたとき"];
    stack(b.next, 1, lines);
    functions[flagCount === 1 ? "main" : `main#${flagCount}`] = lines.map(clip);
  }

  for (const l of Object.values(target.lists ?? {})) {
    if (Array.isArray(l) && typeof l[0] === "string") {
      lists.push({ sprite: target.name, name: l[0], items: (l[1] ?? []).map(String) });
    }
  }

  for (const v of Object.values(functions)) totalLines += v.length;
  sprites[target.name] = { functions };
}

await writeFile(output, JSON.stringify({ sprites, lists }));
const size = (await readFile(output)).length;
console.log(`wrote ${output}: ${Object.keys(sprites).length} sprites, ${totalLines} lines, ${(size / 1024).toFixed(0)} KB`);
