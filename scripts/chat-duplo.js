/**
 * Chat Duplo — dois canais de chat para Foundry VTT (v12/v13).
 *
 * Cada mensagem recebe a flag `flags.chat-duplo.channel` ("1" ou "2") no momento
 * em que é criada, de acordo com o canal de envio escolhido pelo usuário.
 * A visualização é filtrada via CSS (atributo no <body>), então funciona no
 * chat da barra lateral, no popout e nas notificações flutuantes.
 */

const MOD = "chat-duplo";
const CHANNELS = ["1", "2"];
const unread = { "1": 0, "2": 0 };

/* -------------------------------------------- */
/*  Utilitários                                 */
/* -------------------------------------------- */

const t = (key, data) =>
  data ? game.i18n.format(`CHATDUPLO.${key}`, data) : game.i18n.localize(`CHATDUPLO.${key}`);

function channelName(ch) {
  return game.settings.get(MOD, `name${ch}`) || `Canal ${ch}`;
}

function getView() {
  return game.settings.get(MOD, "view");
}

function getSendChannel() {
  return game.settings.get(MOD, "sendTo");
}

function getChannel(message) {
  const ch = message?.flags?.[MOD]?.channel;
  return CHANNELS.includes(ch) ? ch : game.settings.get(MOD, "defaultChannel");
}

function isVisibleInView(ch, view = getView()) {
  return view === "all" || view === ch;
}

/** Aceita jQuery (v12) ou HTMLElement (v13). */
function toElement(html) {
  if (!html) return null;
  if (html instanceof HTMLElement) return html;
  return html[0] ?? null;
}

/* -------------------------------------------- */
/*  Configurações                               */
/* -------------------------------------------- */

function registerSettings() {
  const refresh = () => refreshAll();

  game.settings.register(MOD, "name1", {
    name: "CHATDUPLO.Settings.Name1.Name",
    hint: "CHATDUPLO.Settings.Name1.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "Mesa 1",
    onChange: refresh
  });

  game.settings.register(MOD, "name2", {
    name: "CHATDUPLO.Settings.Name2.Name",
    hint: "CHATDUPLO.Settings.Name2.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "Mesa 2",
    onChange: refresh
  });

  game.settings.register(MOD, "defaultChannel", {
    name: "CHATDUPLO.Settings.DefaultChannel.Name",
    hint: "CHATDUPLO.Settings.DefaultChannel.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: { "1": "Canal 1", "2": "Canal 2" },
    default: "1",
    onChange: refresh
  });

  game.settings.register(MOD, "linkSend", {
    name: "CHATDUPLO.Settings.LinkSend.Name",
    hint: "CHATDUPLO.Settings.LinkSend.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // Estado do usuário (não aparece no menu de configurações)
  game.settings.register(MOD, "view", {
    scope: "client",
    config: false,
    type: String,
    default: "all"
  });

  game.settings.register(MOD, "sendTo", {
    scope: "client",
    config: false,
    type: String,
    default: "1"
  });
}

/* -------------------------------------------- */
/*  Estado e UI                                 */
/* -------------------------------------------- */

async function setView(view) {
  await game.settings.set(MOD, "view", view);
  if (view !== "all") {
    unread[view] = 0;
    if (game.settings.get(MOD, "linkSend")) await game.settings.set(MOD, "sendTo", view);
  } else {
    unread["1"] = unread["2"] = 0;
  }
  refreshAll();
  scrollChatToBottom();
}

async function setSendTo(ch) {
  await game.settings.set(MOD, "sendTo", ch);
  refreshAll();
}

function scrollChatToBottom() {
  try {
    ui.chat?.scrollBottom?.();
    ui.chat?._popout?.scrollBottom?.();
  } catch (err) {
    /* ignora */
  }
}

function buildBar() {
  const bar = document.createElement("nav");
  bar.className = "chat-duplo-bar";

  const tabs = document.createElement("div");
  tabs.className = "chat-duplo-tabs";
  for (const view of [...CHANNELS, "all"]) {
    const a = document.createElement("a");
    a.className = "chat-duplo-tab";
    a.dataset.view = view;
    a.innerHTML = `<span class="chat-duplo-tab-name"></span><span class="chat-duplo-badge"></span>`;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      setView(view);
    });
    tabs.append(a);
  }

  const send = document.createElement("label");
  send.className = "chat-duplo-send";
  send.innerHTML = `<i class="fas fa-paper-plane"></i><select></select>`;
  send.title = t("SendTo");
  const select = send.querySelector("select");
  for (const ch of CHANNELS) {
    const opt = document.createElement("option");
    opt.value = ch;
    select.append(opt);
  }
  select.addEventListener("change", (ev) => setSendTo(ev.currentTarget.value));

  bar.append(tabs, send);
  return bar;
}

function updateBar(bar) {
  const view = getView();
  const sendTo = getSendChannel();

  for (const tab of bar.querySelectorAll(".chat-duplo-tab")) {
    const v = tab.dataset.view;
    tab.classList.toggle("active", v === view);
    tab.querySelector(".chat-duplo-tab-name").textContent = v === "all" ? t("Both") : channelName(v);
    const badge = tab.querySelector(".chat-duplo-badge");
    const count = v === "all" ? 0 : unread[v];
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = !count;
  }

  const select = bar.querySelector("select");
  for (const opt of select.options) opt.textContent = channelName(opt.value);
  select.value = sendTo;
  bar.dataset.sendTo = sendTo;
}

function refreshAll() {
  document.body.dataset.chatDuploView = getView();
  for (const bar of document.querySelectorAll(".chat-duplo-bar")) updateBar(bar);
  for (const el of document.querySelectorAll("[data-chat-duplo-channel] .chat-duplo-label")) {
    el.textContent = channelName(el.closest("[data-chat-duplo-channel]").dataset.chatDuploChannel);
  }
}

function injectBar(app, html) {
  const root = toElement(html);
  if (!root) return;
  let bar = root.querySelector(".chat-duplo-bar");
  if (!bar) {
    const log = root.querySelector("#chat-log, .chat-log");
    if (!log) return;
    const anchor = log.closest(".chat-scroll") ?? log;
    bar = buildBar();
    anchor.before(bar);
  }
  updateBar(bar);
}

/* -------------------------------------------- */
/*  Mensagens                                   */
/* -------------------------------------------- */

function tagMessage(message, html) {
  const el = toElement(html);
  if (!el) return;
  const ch = getChannel(message);
  el.dataset.chatDuploChannel = ch;

  let label = el.querySelector(".chat-duplo-label");
  if (!label) {
    label = document.createElement("span");
    label.className = "chat-duplo-label";
    const target = el.querySelector(".message-metadata") ?? el.querySelector(".message-header");
    if (target) target.prepend(label);
  }
  label.textContent = channelName(ch);
}

function onPreCreate(message, data) {
  if (data?.flags?.[MOD]?.channel) return; // já definido (ex.: por outro módulo/macro)
  message.updateSource({ [`flags.${MOD}.channel`]: getSendChannel() });
}

function onCreate(message) {
  if (message.visible === false) return;
  const ch = getChannel(message);
  if (isVisibleInView(ch)) return;
  unread[ch] += 1;
  refreshAll();
}

function contextOptions(_app, options) {
  const getMessage = (li) => {
    const el = toElement(li);
    const id = el?.dataset?.messageId ?? el?.closest?.("[data-message-id]")?.dataset.messageId;
    return game.messages.get(id);
  };
  for (const ch of CHANNELS) {
    options.push({
      name: t("MoveTo", { name: channelName(ch) }),
      icon: '<i class="fas fa-right-left"></i>',
      condition: (li) => {
        const msg = getMessage(li);
        return !!msg && msg.isOwner && getChannel(msg) !== ch;
      },
      callback: (li) => getMessage(li)?.setFlag(MOD, "channel", ch)
    });
  }
}

/* -------------------------------------------- */
/*  API pública (para macros)                   */
/* -------------------------------------------- */

const api = {
  setView,
  setSendTo,
  getView,
  getSendChannel,
  channelName,
  /** Envia uma mensagem diretamente para um canal específico. */
  send: (ch, data = {}) =>
    ChatMessage.create(foundry.utils.mergeObject(data, { flags: { [MOD]: { channel: ch } } }, { inplace: false }))
};

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

Hooks.once("init", () => {
  registerSettings();

  const v13 = (game.release?.generation ?? 12) >= 13;
  Hooks.on(v13 ? "renderChatMessageHTML" : "renderChatMessage", tagMessage);
  Hooks.on(v13 ? "getChatMessageContextOptions" : "getChatLogEntryContext", contextOptions);

  Hooks.on("preCreateChatMessage", onPreCreate);
  Hooks.on("createChatMessage", onCreate);
  Hooks.on("renderChatLog", injectBar);
});

Hooks.once("ready", () => {
  game.modules.get(MOD).api = api;
  refreshAll();
  scrollChatToBottom();
});
