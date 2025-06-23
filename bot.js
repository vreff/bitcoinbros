const { Telegraf } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const { TappdClient } = require('@phala/dstack-sdk');
const axios = require('axios');
const { Verifier } = require('bip322-js');

const client = new TappdClient();

const githubToken = process.env.GITHUB_TOKEN;

const botToken = process.env.BOT_TOKEN;
const bot = new Telegraf(botToken);

const userStates = {};

bot.start((ctx) => {
  ctx.reply(`Sup, bro. Use the /prove command to start proving your worth. Use the /finish command once you've added all your addresses, and I'll add you to the right group. All information and signatures you provide are verifiably confidential.`);
});

bot.command('prove', async (ctx) => {
  userStates[ctx.from.id] = { step: 'awaiting_address' };
  ctx.reply('Please reply with your Bitcoin address to begin the proof process.');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates[userId];
  if (!state) return;

  if (state.step === 'awaiting_address') {
    // Simple Bitcoin address validation (mainnet P2PKH, P2SH, Bech32)
    const btcAddress = ctx.message.text.trim();
    const btcRegex = /^(bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
    if (!btcRegex.test(btcAddress)) {
      ctx.reply('❌ That does not look like a valid Bitcoin address. Please try again.');
      return;
    }
    userStates[userId] = { step: 'challenge', btcAddress };

    // Generate challenge
    const challengeId = 'BITCOIN_BROS_CHALLENGE_' + uuidv4();
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, ' UTC');
    const quoteResult = await client.tdxQuote(challengeId, 'raw');

    const gistContent = `Challenge ID: ${challengeId}\nBitcoin Address: ${btcAddress}\nTimestamp: ${timestamp}\nQuote: ${quoteResult.quote}\nThe quote can be verified at: https://proof.t16z.com/`;

    let gistUrl;
    try {
      const res = await axios.post(
        'https://api.github.com/gists',
        {
          description: 'Bitcoin Bros Challenge Quote',
          public: false,
          files: {
            'challenge.txt': {
              content: gistContent
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'bitcoin-bros-bot'
          }
        }
      );
      if (res.data && res.data.html_url) {
        gistUrl = res.data.html_url;
      } else {
        gistUrl = 'Failed to get gist URL';
      }
    } catch (e) {
      gistUrl = 'Failed to upload quote: ' + e.message;
    }

    const challengeText =
      `Please sign this challenge text with your bitcoin wallet to prove your identity: \n\n${challengeId}\n\n` +
      `Reply with only a signature of the above challenge text.\n\n` +
      `Attestation of privacy & integrity: ${gistUrl}\n\n`;
    ctx.reply(challengeText);

    // Save challengeId for signature verification
    userStates[userId] = { step: 'awaiting_signature', btcAddress, challengeId };
  } else if (state.step === 'awaiting_signature') {
    // The user is expected to reply with a signature
    const signature = ctx.message.text.trim();
    const { btcAddress, challengeId } = state;
    try {
      const isValid = await Verifier.verifySignature(btcAddress, challengeId, signature);
      if (isValid) {
        ctx.reply('✅ Signature verified! You have proven ownership of your Bitcoin address.');
        userStates[userId] = { step: 'done', btcAddress, challengeId };
      } else {
        ctx.reply('❌ Signature verification failed. Please try again or restart the process.');
      }
    } catch (error) {
      ctx.reply('❌ Error during verification: ' + error.message);
    }
  }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
