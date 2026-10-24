const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

function getTokens() {
    let tokens = [];
    if (fs.existsSync('tokens.txt')) {
        tokens = fs.readFileSync('tokens.txt', 'utf-8').split('\n').map(t => t.trim()).filter(t => t.length > 0 && !t.startsWith('#'));
    }
    return tokens;
}

function getMessages() {
    let messages = ["Hello mọi người!", "Đúng rồi đấy", "Haha chuẩn", "Ừ thế á", "Ghê vậy ta", "Ai biết đâu", "Chuẩn luôn nha"];
    if (fs.existsSync('messages.txt')) {
        messages = fs.readFileSync('messages.txt', 'utf-8').split('\n').map(m => m.trim()).filter(m => m.length > 0);
    }
    return messages;
}

// Phân chia 28 token thành 7 nhóm (mỗi nhóm 4 token / 1 phòng)[cite: 14]
function getChannelId(index) {
    if (index >= 0 && index < 4) return "1561571575000735744";   // Nhóm 1 (Acc 1-4)[cite: 14]
    if (index >= 4 && index < 8) return "1543140705206276158";   // Nhóm 2 (Acc 5-8)[cite: 14]
    if (index >= 8 && index < 12) return "1562748334119325726";  // Nhóm 3 (Acc 9-12)[cite: 14]
    if (index >= 12 && index < 16) return "1543105367561474052"; // Nhóm 4 (Acc 13-16)[cite: 14]
    if (index >= 16 && index < 20) return "1532928117096579113"; // Nhóm 5 (Acc 17-20)[cite: 14]
    if (index >= 20 && index < 24) return "1549456317092073534"; // Nhóm 6 (Acc 21-24)[cite: 14]
    if (index >= 24 && index < 28) return "1562748334119325726";  // Nhóm 7 (Acc 25-28)[cite: 14]
    return "1562748334119325726"; 
}

const delayTime = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function startBot(token, realIndex) {
    const client = new Client({ checkUpdate: false });
    const CHAT_MESSAGES = getMessages();
    const TEXT_CHANNEL_ID = getChannelId(realIndex);
    
    let sentCount = 0;
    const TARGET_COUNT = 1000;
    let lastInteractionTime = 0;

    // 1. Vòng lặp chủ động gửi tin nhắn để đảm bảo đủ 1000 tin trong 4 tiếng
    async function startSpamChat() {
        try {
            const channel = await client.channels.fetch(TEXT_CHANNEL_ID);
            if (!channel) return;
            
            while (sentCount < TARGET_COUNT) {
                const randomDelay = Math.floor(Math.random() * 4000) + 12000; // 12 - 16 giây/tin
                await delayTime(randomDelay);

                const randomMsg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
                await channel.send(randomMsg);
                sentCount++;
                console.log(`[Acc ${realIndex + 1}] Gửi chủ động (${sentCount}/${TARGET_COUNT}): ${randomMsg}`);
            }
            console.log(`[Acc ${realIndex + 1}] >>> Đã hoàn thành 1000 tin nhắn!`);
        } catch (err) {
            if (err.status === 429) {
                console.warn(`[Acc ${realIndex + 1}] Bị Rate Limit, tạm dừng 45 giây...`);
                await delayTime(45000);
                startSpamChat();
            }
        }
    }

    // 2. Lắng nghe tin nhắn từ các nick khác để phản hồi (tương tác qua lại)
    client.on('messageCreate', async (message) => {
        if (message.channel.id === TEXT_CHANNEL_ID && message.author.id !== client.user.id) {
            const now = Date.now();
            if (now - lastInteractionTime < 20000) return; // Giới hạn thời gian giữa các lần phản hồi
            if (Math.random() > 0.5) return; // 0,00001% xác suất sẽ trả lời tin nhắn của nick khác

            lastInteractionTime = now;
            const typingDelay = Math.floor(Math.random() * 4000) + 3000; // Giả lập thời gian đọc/gõ từ 3-7 giây
            await delayTime(typingDelay);

            try {
                const randomMsg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
                if (sentCount < TARGET_COUNT) {
                    await message.reply(randomMsg); // Dùng reply để trích dẫn và trả lời
                    sentCount++;
                    console.log(`[Acc ${realIndex + 1}] Phản hồi tương tác (${sentCount}/${TARGET_COUNT}): ${randomMsg}`);
                }
            } catch (err) {
                if (err.status === 429) {
                    await delayTime(45000);
                }
            }
        }
    });

    client.on('ready', async () => {
        console.log(`[Acc ${realIndex + 1}] Đã đăng nhập: ${client.user.tag}`);
        setTimeout(startSpamChat, Math.random() * 10000 + 5000);
    });

    client.login(token).catch((err) => {
        console.error(`[Lỗi đăng nhập Acc ${realIndex + 1}]:`, err.message);
    });
}

(async () => {
    const tokens = getTokens();
    console.log(`>>> Đã tải ${tokens.length} token. Hệ thống vừa spam vừa tương tác đã sẵn sàng...\n`);

    for (let index = 0; index < tokens.length; index++) {
        if (index > 0) await delayTime(2000);
        startBot(tokens[index], index);
    }
})();