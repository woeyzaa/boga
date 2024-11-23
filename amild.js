const axios = require('axios'); // For sending HTTP requests and Telegram messages
const cheerio = require('cheerio'); // For parsing HTML
const chalk = require('chalk'); // For colorized console output
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '6975482519:AAFZaxLVJvkxaKBF-x5RT-ziW1d9ZcyvjzQ';
const CHAT_ID = '-1002158844099';

// Proxy configuration
const proxyIPs = [
    '88.80.134.53',
    '185.58.22.233'
];
const proxyPort = '12323'; // Port proxy yang sama untuk semua IP
const proxyUser = 'fahreza'; // Username proxy
const proxyPass = 'fahreza'; // Password proxy

// Function to select a random IP from the list
function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * proxyIPs.length);
    const proxyHost = proxyIPs[randomIndex];
    const proxy = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxy);
}

function getCurrentTimestamp() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
        }, { httpsAgent: getRandomProxy() }); // Add dynamic proxy agent
    } catch (error) {
        console.error('Failed to send Telegram message:', error.message);
    }
}

function formatCookies(cookiesArray) {
    return cookiesArray.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

async function fetchCookies() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/woeyzaa/boga/refs/heads/main/amild.json');
        return response.data;
    } catch (error) {
        console.error(`[!] Failed to fetch cookies: ${error.message}`);
        return null;
    }
}

const levelOrder = ['Bronze', 'Silver', 'Gold', 'Ace'];

async function checkProductStatus() {
    try {
        const cookiesArray = await fetchCookies();
        if (!cookiesArray) return;

        const cookies = formatCookies(cookiesArray);

        const headers = {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'en-US,en;q=0.9',
            'cookie': cookies,
            'referer': 'https://loyalty.aldmic.com/reward',
            'sec-ch-ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'
        };

        const agent = getRandomProxy(); // Use dynamic proxy
        const response = await axios.get('https://loyalty.aldmic.com/reward', { headers, httpsAgent: agent });
        const $ = cheerio.load(response.data);

        const products = [];
        $('.row.mt-1.gy-3 .col-6.col-md-4').each((index, element) => {
            const card = $(element).find('a.card');
            const productName = card.find('.card-title').text().trim();
            const redeemButton = card.find('button.btn.bg-color-primary-2.w-100.text-white');
            const productLevel = card.find('.bg-color-primary-3 .align-middle.text-white.fs-xsmall').text().trim();
            const dailyLimitButton = card.find('button.btn.bg-secondary.w-100.text-white');
            const dateButton = card.find('button.btn.bg-secondary.w-100.text-white');
            const pointA = card.find('.col-12.col-md-7.d-flex.align-items-center .align-middle.cl-color-primary-2.fs-8.fw-bold div');
            const pointText = pointA.text().trim();
            const buttonText = redeemButton.text().trim() || dailyLimitButton.text().trim() || pointText.text().trim() || productLevel.text().trim() || dateButton.text().trim();

            const isOutOfStock = productName === 'Kaos Naufal Abshar - Female' || productName === 'Mortier Wallet' || productName === 'Mortier Bag' || productName === 'Kaos UNKL347' || productName === 'Rooster Jacket Shirt' || productName === 'BAGASI' || productName === 'CORKCICLE' || productName === 'POLAROID' || productName === 'JABRA' || productName === 'CARHART/DICKIES' || productName === 'Kaos Naufal Abshar - Male' || productName === 'Giordano S GD GA90400' || productName === 'Windbreaker' || productName === 'Exclusive Lighter Sleeve';

            const isRedeemable = !isOutOfStock && buttonText === 'Redeem Now';
            const isCantRedeem = isOutOfStock || buttonText.includes('Daily Limit Reached') || buttonText.includes('Available Tomorrow') || dateButton.length > 0;

            const redeemLink = card.attr('href');
            products.push({ productName, productLevel, pointText, isRedeemable, isCantRedeem, redeemLink, buttonText });
        });

        // Sort products by level order
        products.sort((a, b) => {
            return levelOrder.indexOf(a.productLevel) - levelOrder.indexOf(b.productLevel);
        });

        console.log('--- All Products ---');
        products.forEach(product => {
            if (product.isRedeemable) {
                const message = `AMILD : ${product.productName}\nLevel : ${product.productLevel}\nPoint : ${product.pointText}\n${product.redeemLink}`;
                console.log(`[+] ${chalk.green(message)}\n`);
                sendTelegramMessage(message);
            } else if (product.isCantRedeem) {
                console.log(`${chalk.gray('[-]')} ${chalk.blue(getCurrentTimestamp())} : ${chalk.yellow(product.productLevel)} : ${chalk.green(product.pointText)} : ${chalk.red(product.productName)} : ${product.buttonText}`);
            }
        });
        console.log('-------------------');
        console.log('');

    } catch (error) {
        console.error(`[!] ${getCurrentTimestamp()} : ${error.message}`);
    }
}

(async () => {
    while (true) {
        await checkProductStatus();
        //await new Promise(resolve => setTimeout(resolve, 2000));
    }
})();
