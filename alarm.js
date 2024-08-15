const axios = require('axios');
const chalk = require('chalk');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const userAgents = require('user-agents');

// Gantilah token dan chatId dengan informasi bot Telegram Anda
const telegramToken = '7413770897:AAEnPRCFqtGG9lgtuRSXnnsCEY6lvqhrSZU';
const chatId = '-1002158844099';

const bot = new TelegramBot(telegramToken, { polling: false });

// Proxy configuration (optional)
const proxyUrl = 'http://43.152.112.135:12986'; // Replace with your proxy URL and port
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

let expiredPopUp = false;

// Function to generate a random user-agent
function getRandomUserAgent() {
    return new userAgents().toString();
}

async function checkSession() {
    try {
        const response = await axios.get('https://loyalty.aldmic.com/one-ux/check-session', {
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'cookie': 'your-cookie-here',
                'referer': 'https://loyalty.aldmic.com/',
                'user-agent': getRandomUserAgent() // Use random user-agent
            },
            httpsAgent: agent // Use proxy if configured
        });

        console.log(' [!] ' + chalk.blueBright('Wait for Relogin...'));

        if (response.data === '8a690627cd0d43389a9369b3ae3f6b8c') {
            if (!expiredPopUp) {
                expiredPopUp = true;
                await bot.sendMessage(chatId, 'Session anda sudah expired, silahkan masuk kembali melalui website https://amild.id.');
                console.log('Expired session message sent.');
            } else {
                console.log('Expired session message already sent.');
            }
        } else {
            console.log(' [✅] ' + chalk.greenBright('Session Valid!!!'));
			console.log('');
        }
    } catch (error) {
        console.error('Error checking session:', error.message);
    }
}

async function checkReward() {
    try {
        const response = await axios.get('https://loyalty.aldmic.com/reward?cat=11', {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'cookie': 'cross-site-cookie=name; one-ux=eyJpdiI6Ik0wclZjMUQ0MFI1ZFZsbitYV1hpV1E9PSIsInZhbHVlIjoia205YUpqQ0hcL1dwYWdHb3RseGx1YWc9PSIsIm1hYyI6IjQzODY5MmJhZmI5N2VjYWNiYzVmMTY4MzE3MWNhNWRmMzNhNmFkYzA1NGRmMzViMDJlNzRmM2I5ZTkzYWVlOGUifQ%3D%3D; source_site=eyJpdiI6ImpoUUQzRktmV1NPRVFwXC9EVm5ZRXlBPT0iLCJ2YWx1ZSI6Im55ZWlRdDM2WTF5dkdacjdDZWRSRjlYdlBJeGcrd3dTdU9ZZGJnUEFnWDg9IiwibWFjIjoiNWM2OThkYzU2M2EwZTViNWQ5ZTg0N2IzYTNjMmVhNmE1MjZjMGRmOWYwNTY5MDA3ZWVjNTFlZmVkNWE1ZmFlYSJ9; XSRF-TOKEN=eyJpdiI6Iklob1JzOW9La0tvdjNzcXNJXC9pVEh3PT0iLCJ2YWx1ZSI6IkVqSHhXSVBwS3RLZUV2aFppaDdwakZZMGpFM3FUVXBydGhHZWtxa0J1QytMa1hEeTVQRUZEWlVKZ1h1TnBTMDMiLCJtYWMiOiIxYWRjYWYwOWI3ZmM5NTAxNGE3ZjQwYmU2ZTMyZjIyY2FhMjRiNDVjZmI2ZTNmNjAyNTU0MzE0ZWZkZmI0Mjg2In0%3D; aldmic_session=eyJpdiI6IjN0cXhBQ096T01mXC9IeU4yNDZsUkJ3PT0iLCJ2YWx1ZSI6IkkrTTRGOUdKN014VHYrc0tzVWpQUjMzQmk4dWUrQTRDaVZVM1YySFwveEU3cE5KNThOUVFrUE9HQk5QZTJMZ1BpIiwibWFjIjoiYzMzOTQyOTA0YzNlOGNlMzFiODY0ZWE2ZTQ0MTU4YjZkZDA3YmVhMzMwYjQ0NWQ3OWJmMGI2MTdmMzIxMWE4ZSJ9; cf_clearance=sheXHzmTQ0zcV6emgf7zm4cbJOfZgxKIoI_HeEBGGZg-1723558277-1.0.1.1-.low9O7.su_xpqmR4X_06yRNjDKteI1w_EYeCfroVlxyb_FNeapDecJ.OGD7wAWKMH._TH8bBGlvRbJguXsYjQ',
                'referer': 'https://loyalty.aldmic.com/reward',
                'user-agent': getRandomUserAgent() // Use random user-agent
            },
            httpsAgent: agent // Use proxy if configured
        });

        const $ = cheerio.load(response.data);
        const rewards = $('a.card.mx-auto.border-0.shadow.bg-transparent.w-100');
        let hasRedeemButton = false;

        if (rewards.length > 0) {
            rewards.each((index, element) => {
                const productName = $(element).find('.card-title').text().trim();
                const redeemUrl = $(element).attr('href');
                const redeemButton = $(element).find('button.btn.bg-color-primary-2.w-100.text-white');
                if (redeemButton.length > 0) {
                    hasRedeemButton = true;
                    const message = `${productName}\n${redeemUrl}`;
                    bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
                        .catch(err => console.error('Error sending message:', err.message));
                }
            });

            if (hasRedeemButton) {
                console.log(' [+] ' + chalk.bold.greenBright('✅ Reward Available, send to Telegram 🚀'));
            } else {
                console.log(' [-] ' + chalk.bold.red('⚠️ Reward not Available ⚠️'));
            }
        } else {
			console.log('');
            console.log(' [•] ' + chalk.red('Cookie Expired or Down'));
            // Jika tidak ada hadiah ditemukan, mulai ulang dari pemeriksaan sesi
            await checkSession();
        }
    } catch (error) {
        console.error('Error fetching reward data:', error.message);
        // Jika terjadi error saat mengambil data hadiah, mulai ulang dari pemeriksaan sesi
        await checkSession();
    }
}

// Mengatur interval untuk pemeriksaan sesi dan hadiah
async function main() {
    await checkSession(); // Periksa sesi terlebih dahulu satu kali
    setInterval(checkReward, 5000); // Periksa hadiah setiap 5 detik
}

main();
