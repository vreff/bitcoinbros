const { Telegraf } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const { TappdClient } = require('@phala/dstack-sdk');
const { Verifier } = require('bip322-js');
const axios = require('axios');

const satsInABitcoin = 100_000_000.0;
const debugMode = process.env.DEBUG;
const githubToken = process.env.GITHUB_TOKEN;
const botToken = process.env.BOT_TOKEN;
const groupJoinLinks = {
  'Nocoiners': process.env.NO_COINERS_JOIN_LINK,
  'Prawns': process.env.PRAWNS_JOIN_LINK,
  'Shrimps': process.env.SHRIMPS_JOIN_LINK,
  'Crabs': process.env.CRABS_JOIN_LINK,
  'Octopuses': process.env.OCTOPUSES_JOIN_LINK,
  'Dolphins': process.env.DOLPHINS_JOIN_LINK,
  'Sharks': process.env.SHARKS_JOIN_LINK,
  'Whales': process.env.WHALES_JOIN_LINK,
};

const client = new TappdClient();
const bot = new Telegraf(botToken);

const userStates = {};
const userGroupCategory = {};

debugMode && bot.use((ctx, next) => {
  console.log('[BOT] Update received:', JSON.stringify(ctx.update));
  return next();
});

bot.start((ctx) => {
  ctx.reply(
    `Sup, bro, hope you're having a friggin stoked day. Welcome to Bitcoin Bros.\n\n` +
    `Use the /prove command to start proving your worth. When you run /prove, you'll need to prove ownership of a Bitcoin address by sigining a challenge. You can run /prove repeatedly to prove ownership of as many addresses as you want, but you only have 10 minutes to do so until your session is reset.\n\n` +
    `Once you've finished proving your worth, bro, call the /finish command and I'll add you to the right group. Thanks to the Phala network, all information you share with me is verifiably confidential.`);
});

// Execute a challenge/response to prove ownership of a Bitcoin address.
// See `bot.on('text', ...) for the full flow.
bot.command('prove', async (ctx) => {
  userStates[ctx.from.id] = { ...userStates[ctx.from.id], step: 'awaiting_address' };
  setUserStateTimeout(ctx.from.id);
  ctx.reply('Reply with a Bitcoin address to begin the proof process.');
});

// Assign the user to a group based on their total balance.
bot.command('finish', async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates[userId] || {};
  const totalBalance = state.totalBalance || 0;
  let groupName;
  if (totalBalance === 0) {
    groupName = 'Nocoiners';
  } else if (totalBalance > 0 && totalBalance < .1 * satsInABitcoin) {
    groupName = 'Prawns';
  } else if (totalBalance >= .1 * satsInABitcoin && totalBalance < satsInABitcoin) {
    groupName = 'Shrimps';
  } else if (totalBalance >= satsInABitcoin && totalBalance < 10 * satsInABitcoin) {
    groupName = 'Crabs';
  } else if (totalBalance >= 10 * satsInABitcoin && totalBalance < 100 * satsInABitcoin) {
    groupName = 'Octopuses';
  } else if (totalBalance >= 100 * satsInABitcoin && totalBalance < 500 * satsInABitcoin) {
    groupName = 'Dolphins';
  } else if (totalBalance >= 500 * satsInABitcoin && totalBalance < 1000 * satsInABitcoin) {
    groupName = 'Sharks';
  } else if (totalBalance >= 1000 * satsInABitcoin) {
    groupName = 'Whales';
  }
  await ctx.reply(
    `Alright bro, the results are in.\n\n` +
    `Your total verified balance is ${(totalBalance / satsInABitcoin).toFixed(8)} BTC, which makes you a ${groupName[0].toLocaleUpperCase()}${groupName.slice(1, groupName.length - 1)}. I'll add you to that group right now.`
  );
  userGroupCategory[userId] = groupName;
  await addUserToGroup(ctx, groupName);
  delete userStates[userId];
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
      ctx.reply(`❌ That's not a valid Bitcoin address, bro. Try again.`);
      return;
    }

    if (!userStates[userId].usedAddresses) userStates[userId].usedAddresses = [];
    if (userStates[userId].usedAddresses.includes(btcAddress)) {
      ctx.reply(`❌ You've already used this Bitcoin address, bro. Use a different one or just run the /finish command.`);
      return;
    }

    userStates[userId] = { ...userStates[userId], step: 'challenge', btcAddress };

    const challengeId = 'BITCOIN_BROS_CHALLENGE_' + uuidv4();
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, ' UTC');
    const quoteResult = debugMode ? { quote: 'DEBUG_MODE' } : await client.tdxQuote(challengeId, 'raw');

    let gistUrl;
    const gistContent =
      `Challenge ID: ${challengeId}\n` +
      `Bitcoin Address: ${btcAddress}\n` +
      `Timestamp: ${timestamp}\n` +
      `Quote: ${quoteResult.quote}\n` +
      `The quote can be verified at: https://proof.t16z.com/`;
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
      `Sign this challenge text with your bitcoin wallet to prove your identity:\n\n${challengeId}\n\n` +
      `<b>Reply with a signature of the above challenge text, and nothing else.</b>\n\n` +
      `Attestation of privacy & integrity: ${gistUrl}\n\n`;
    ctx.reply(challengeText, { parse_mode: 'HTML' });

    userStates[userId] = { ...userStates[userId], step: 'awaiting_signature', btcAddress, challengeId };
  } else if (state.step === 'awaiting_signature') {
    // The user is expected to reply with a signature
    const signature = ctx.message.text.trim();
    const { btcAddress, challengeId } = state;
    try {
      const isValid = await Verifier.verifySignature(btcAddress, challengeId, signature);
      if (isValid) {
        let balance = 0;
        try {
          const resp = await axios.get(`https://blockstream.info/api/address/${btcAddress}`);
          if (resp.data && typeof resp.data.chain_stats.funded_txo_sum === 'number' && typeof resp.data.chain_stats.spent_txo_sum === 'number') {
            balance = (resp.data.chain_stats.funded_txo_sum - resp.data.chain_stats.spent_txo_sum);
          }
        } catch (err) {
          ctx.reply(`⚠️ Coulddn't fetch balance: ` + (err.response?.data?.message || err.message));
        }

        if (!userStates[userId].totalBalance) userStates[userId].totalBalance = 0;
        userStates[userId].totalBalance += balance;

        if (!userStates[userId].usedAddresses) userStates[userId].usedAddresses = [];
        userStates[userId].usedAddresses.push(btcAddress);

        ctx.reply(`✅ Signature verified, bro. You've proven ownership of your Bitcoin address.\nBalance: ${balance} BTC\nTotal verified balance: ${userStates[userId].totalBalance} BTC`);
        userStates[userId] = { ...userStates[userId], step: 'done', btcAddress, challengeId, totalBalance: userStates[userId].totalBalance, usedAddresses: userStates[userId].usedAddresses };
      } else {
        ctx.reply(`❌ Signature verification failed, bro. Try again or restart the process with the /prove command.`);
      }
    } catch (error) {
      ctx.reply(`❌ Error during verification: ` + error.message);
    }
  }
});

// Approve join requests if user has been rightfully assigned to the group.
bot.on('chat_join_request', async (ctx) => {
  const userId = ctx.chatJoinRequest.from.id;
  const groupName = Object.keys(groupJoinLinks).find(key => groupJoinLinks[key] && ctx.chatJoinRequest.invite_link && ctx.chatJoinRequest.invite_link.invite_link && groupJoinLinks[key].includes(ctx.chatJoinRequest.invite_link.invite_link.replace('https://t.me/', '').replaceAll('.', '')));
  if (groupName && userGroupCategory[userId] === groupName) {
    await ctx.approveChatJoinRequest(userId);
    await ctx.reply(`Welcome to the ${groupName} group, ${ctx.chatJoinRequest.from.username ? '@' + ctx.chatJoinRequest.from.username : ctx.chatJoinRequest.from.first_name}.`);
  } else {
    await ctx.declineChatJoinRequest(userId);
    try {
      await ctx.telegram.sendMessage(ctx.chatJoinRequest.from.id, `Sorry, you are not allowed to join this group, bro.`);
    } catch (e) {
      console.error('Failed to send DM:', e.message);
    }
  }
});

function setUserStateTimeout(userId) {
  if (userStates[userId] && userStates[userId].timeout) return
  if (userStates[userId]) {
    userStates[userId].timeout = setTimeout(() => {
      delete userStates[userId];
    }, 10 * 60 * 1000);
  }
}

async function addUserToGroup(ctx, groupName) {
  const link = groupJoinLinks[groupName];
  if (link) {
    await ctx.reply(`Click to request to join the ${groupName} group: ${link}`);
  } else {
    await ctx.reply(`Sorry, no group link found for: ${groupName}`);
  }
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
