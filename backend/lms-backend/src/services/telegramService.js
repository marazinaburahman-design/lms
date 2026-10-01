async function sendTelegram({ chatId, text }) {
  if (process.env.TELEGRAM_ENABLED !== 'true') {
    return { sent: false, disabled: true };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const target = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !target) {
    throw new Error('Telegram token or chat id is missing in .env');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: target, text }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Telegram error');

  return { sent: true, messageId: data.result.message_id };
}

module.exports = { sendTelegram };