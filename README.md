# Bitcoin Bros
Connect with Bitcoiners of similar sats: https://t.me/BitcoinBrosBot<br/><br/>
<img width="455" alt="shot" src="https://github.com/user-attachments/assets/e5b877ac-8479-4ee7-abda-9246e3459de9" />
<br/>

## What is it?
Bitcoin Bros is a Telegram bot that allows Bitcoiners like yourself to pseudanonymously network with Bitcoiners of similar sats by using the shrimp-fish-whale paradigm to bucket users:<br/><br/>
<img src="https://github.com/user-attachments/assets/a85fc388-256e-49df-84bc-89d50743c186" width="400"/>
<br/><br/>
Bitcoin Bros groups users over the following denominations:<br/>
| Rank      | Holdings           |
|-----------|--------------------|
| Nocoiner  | 0 sats             |
| Prawn     | 1 sat – 0.1 BTC    |
| Shrimp    | 0.1 BTC – 1 BTC    |
| Crab      | 1 BTC – 10 BTC     |
| Octopus   | 10 BTC – 100 BTC   |
| Dolphin   | 100 BTC – 500 BTC  |
| Shark     | 500 BTC – 1000 BTC |
| Whale     | 1000 BTC+          |

The Bitcoin Bros bot cryptographically verifies the amount of Bitcoin you own, and then places you into a Telegram group representing one of these buckets. Once you activate the bot using the [link](https://t.me/BitcoinBrosBot), you can use the `/prove` command repeatedly to prove the balance of each of your Bitcoin addresses. Once you complete the proceess, run the `/finish` command and the Bitcoin Bros bot will assign you to a Telegram group based on where you fall in the shrimp-fish-whale paradigm.

## In-depth Verification Steps
Start the [bot](https://t.me/BitcoinBrosBot) using the `/start` command. It will give you instructions, and the summary of the interaction between you and the bot is as follows:
- You initiate the interaction with the `/prove` command.
- You send the bot a Bitcoin address you claim to own.
- The bot sends you a challenge to sign.
- You sign the challenge using your Bitcoin wallet. A good option for this is [Sparrow Wallet](https://sparrowwallet.com/), which supports hardware wallets such as Ledger. More detailed instructions with Sparrow can be found below.
- If the signature is correct, the Bitcoin Bros bot will add this balance to your total Bitcoin balance.
- You can repeat the `/prove` command as many times as you like, until you have a verified Bitcoin balance you are happy with.
- Once you are ready to be placed in a Telegram group, you can use the `/finish` command. The Bitcoin Bros bot will send you an invite to the appropriate channel.
- Note that you only have ten minutes to complete the verification process, as to prevent manipulation of on-chain balances.

## Confidentiality
This Telegram bot is hosted on [Phala Cloud](https://cloud.phala.network/), with application ID [3a4c0ba5a17b6ac39ddbd41c257c621bd7867be9](https://cloud.phala.network/explorer/83d619452a4f43178e7c30a0f9e44422) running this repository's source code at commit [df55b55](https://github.com/vreff/bitcoinbros/actions/runs/15859008131?pr=3). Confidentiality of user data including addresses and signatures is enforced by the confidential VMs hosted there. Every challenge provided by the bot comes with evidence that the challenge originated from the linked Phala VM instance that uses the source code in this repository. Once Telegram has delivered data to the bot, that data is stored or transmitted elsewhere, as per the source code in this repository.

## Sparrow+Ledger Instructions
In order to sign challenges issued by the Bitcoin Bros Telegram bot, you need wallet software that is capable of signing arbitrary data. The following is an illustrative example of accomplishing this by using the Sparrow Wallet with a Ledger hardware wallet, which should be a common pattern among Bitcoin users:
- Once you have the Sparrow wallet downloaded, ensure your Ledger has the Bitcoin app installed. Go ahead and start up the Bitcoin app:<br/>
<img src="https://github.com/user-attachments/assets/c963e97c-3dc5-4882-99e4-2e3b4ad4cb0b" width="400"/><br/>
- In Sparrow, click "New Wallet" -> "Connected Hardware Wallet" -> "Scan"
- You should see your ledger available for import as is shown below: 
<img width="651" alt="Screenshot 2025-06-23 at 6 32 40 PM" src="https://github.com/user-attachments/assets/50c3d285-8fc4-46e7-80b8-add90e5c5b35" /><br/>
- After importing your ledger, navigate to "Addresses" section in the left pane. Right click on any of your available addresses and click "Sign/Verify Message." Attached is an example signature on a real challenge from the Bitcoin Bros bot:
  <img width="574" alt="Screenshot 2025-06-23 at 6 38 29 PM" src="https://github.com/user-attachments/assets/0d560040-595e-4f0b-ab27-196b5aa0dd39" />

## Disclosures
This project is for entertainment and educational purposes; it is not intended for monetization.
