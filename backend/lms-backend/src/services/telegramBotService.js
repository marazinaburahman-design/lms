const Student = require("../models/Student");

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function tg(method, body) {
  const res = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function handleMessage(msg) {
  const chatId = String(msg.chat.id);

  // Student shared their contact
  if (msg.contact) {
    // Only accept the user's own number, not someone else's contact
    if (String(msg.contact.user_id) !== String(msg.from.id)) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "Please share your own number using the button.",
      });
    }

    const digits = msg.contact.phone_number.replace(/\D/g, "");
    const last9 = digits.slice(-9);
    const student = await Student.findOne({
      telegramNumber: new RegExp(`${last9}$`),
    });

    if (!student) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "We could not find a student with this number. Please contact the academy.",
        reply_markup: { remove_keyboard: true },
      });
    }

    student.telegramChatId = chatId;
    await student.save();
    return tg("sendMessage", {
      chat_id: chatId,
      text: `Thank you ${student.firstName}! You will now receive your invoices here.`,
      reply_markup: { remove_keyboard: true },
    });
  }

  // /start (or any other text): ask for the number
  return tg("sendMessage", {
    chat_id: chatId,
    text: "Welcome! Tap the button below to share your number and link your student account.",
    reply_markup: {
      keyboard: [[{ text: "Share my number", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

let offset = 0;
async function poll() {
  try {
    const data = await (
      await fetch(`${API()}/getUpdates?timeout=25&offset=${offset}`)
    ).json();
    if (data.ok) {
      for (const u of data.result) {
        offset = u.update_id + 1;
        if (u.message) await handleMessage(u.message).catch((e) => console.error("Telegram bot:", e.message));
      }
    }
  } catch (e) {
    console.error("Telegram poll error:", e.message);
    await new Promise((r) => setTimeout(r, 5000));
  }
  setImmediate(poll);
}

function startTelegramBot() {
  if (process.env.TELEGRAM_ENABLED !== "true" || !process.env.TELEGRAM_BOT_TOKEN) return;
  console.log("Telegram bot polling started");
  poll();
}

module.exports = { startTelegramBot };