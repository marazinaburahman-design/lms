require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline/promises');

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const client = new TelegramClient(
    new StringSession(''),
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
  );
  await client.start({
    phoneNumber: () => rl.question('Phone (+94...): '),
    phoneCode: () => rl.question('Code from Telegram: '),
    password: () => rl.question('2FA password (if any): '),
    onError: (e) => console.error(e),
  });
  console.log('\nTELEGRAM_SESSION=' + client.session.save());
  rl.close();
  process.exit(0);
})();