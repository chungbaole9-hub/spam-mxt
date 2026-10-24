const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

function getTokens() {
    let tokens = [];
    if (process.env.DISCORD_TOKENS) {
        tokens = process.env.DISCORD_TOKENS.split(',').map(t => t.trim()).filter(t => t.length > 0 && !t.startsWith('#'));
    } else if (fs.existsSync('tokens.txt')) {
        tokens = fs.readFileSync('tokens.txt', 'utf-8').split(/\r?\n/).map(t => t.trim()).filter(t => t.length > 0 && !t.startsWith('#'));
    }
    return tokens;
}

function getMessages() {
    let messages = ["Hello mọi người!", "Đúng rồi đấy", "Haha chuẩn", "Ừ thế á", "Ghê vậy ta", "Ai biết đâu", "Chuẩn luôn nha"];
    if (fs.existsSync('messages.txt')) {
        messages = fs.readFileSync('messages.txt', 'utf-8').split(/\r?\n/).map(m => m.trim()).filter(m => m.length > 0);
    }
    return messages;
}

// Phân chia token thành các nhóm kênh
function getChannelId(index) {
    if (index >= 0 && index < 4) return "1561571575000735744";   // Nhóm 1 (Acc 1-4)
    if (index >= 4 && index < 8) return "1543140705206276158";   // Nhóm 2 (Acc 5-8)
    if (index >= 8 && index < 12) return "1562748334119325726";  // Nhóm 3 (Acc 9-12)
    if (index >= 12 && index < 16) return "1543105367561474052"; // Nhóm 4 (Acc 13-16)
    if (index >= 16 && index < 20) return "1532928117096579113"; // Nhóm 5 (Acc 17-20)
    if (index >= 20 && index < 24) return "1549456317092073534"; // Nhóm 6 (Acc 21-24)
    if (index >= 24 && index < 28) return "1562748334119325726";  // Nhóm 7 (Acc 25-28)
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

    // Vòng lặp gửi tin nhắn chủ động, tự động reset bộ đếm khi sang ngày mới (12h đêm)
    async function startSpamChat() {
        try {
            const channel = await client.channels.fetch(TEXT_CHANNEL_ID);
            if (!channel) return;

            let currentDay = new Date().toDateString();

            while (true) {
                const today = new Date().toDateString();

                // Kiểm tra nếu bước sang ngày mới (qua 12h đêm), reset lại bộ đếm về 0
                if (currentDay !== today) {
                    currentDay = today;
                    sentCount = 0;
                    console.log(`[Acc ${realIndex + 1}] >>> Đã bước sang ngày mới! Reset bộ đếm tin nhắn về 0.`);
                }

                // Nếu đã đạt 1000 tin nhắn trong ngày, nghỉ ngơi và chờ đến ngày mới
                if (sentCount >= TARGET_COUNT) {
                    await delayTime(60000); // Kiểm tra lại mỗi phút
                    continue;
                }

                const randomDelay = Math.floor(Math.random() * 4000) + 12000; // 12 - 16 giây/tin
                await delayTime(randomDelay);

                const randomMsg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
                await channel.send(randomMsg);
                sentCount++;
                console.log(`[Acc ${realIndex + 1}] Gửi chủ động (${sentCount}/${TARGET_COUNT}): ${randomMsg}`);
            }
        } catch (err) {
            if (err && err.status === 429) {
                console.warn(`[Acc ${realIndex + 1}] Bị Rate Limit, tạm dừng 45 giây...`);
                await delayTime(45000);
                startSpamChat();
            } else {
                console.error(`[Acc ${realIndex + 1}] Lỗi kết nối chat:`, err.message);
                await delayTime(10000);
                startSpamChat();
            }
        }
    }

    // Lắng nghe tin nhắn từ các nick khác để phản hồi qua lại
    client.on('messageCreate', async (message) => {
        try {
            if (message.channel.id === TEXT_CHANNEL_ID && message.author.id !== client.user.id) {
                const now = Date.now();
                if (now - lastInteractionTime < 20000) return; // Giới hạn thời gian giữa các lần phản hồi
                if (Math.random() > 0.5) return; // Xác suất phản hồi ngẫu nhiên

                lastInteractionTime = now;
                const typingDelay = Math.floor(Math.random() * 4000) + 3000; // Giả lập thời gian gõ 3-7 giây
                await delayTime(typingDelay);

                const randomMsg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
                if (sentCount < TARGET_COUNT) {
                    await message.reply(randomMsg); // Dùng reply để trích dẫn trả lời
                    sentCount++;
                    console.log(`[Acc ${realIndex + 1}] Phản hồi tương tác (${sentCount}/${TARGET_COUNT}): ${randomMsg}`);
                }
            }
        } catch (err) {
            if (err && err.status === 429) {
                await delayTime(45000);
            }
        }
    });

    client.on('ready', async () => {
        console.log(`[Acc ${realIndex + 1}] Đã đăng nhập thành công: ${client.user.tag}`);
        setTimeout(startSpamChat, Math.random() * 10000 + 5000);
    });

    client.login(token).catch((err) => {
        console.error(`[Lỗi đăng nhập Acc ${realIndex + 1}]:`, err.message);
    });
}

(async () => {
    const tokens = getTokens();
    console.log(`>>> Đã tải thành công ${tokens.length} token. Hệ thống tự động reset 12h đêm đã sẵn sàng...\n`);

    for (let index = 0; index < tokens.length; index++) {
        if (index > 0) await delayTime(2000);
        startBot(tokens[index], index);
    }
})();
