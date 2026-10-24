const http = require('http');
const { spawn } = require('child_process');

let PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server Spam Bot đang chạy!');
});

// Tự động xử lý nếu cổng bị chiếm mà không làm crash ứng dụng
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`[-] Cổng ${PORT} đã bị chiếm, hệ thống đang tự động chuyển sang cổng ngẫu nhiên khác...`);
        server.listen(0); // Tự động chọn 1 cổng trống bất kỳ
    } else {
        console.error('[Lỗi Server]:', err);
    }
});

server.listen(PORT, () => {
    console.log(`[+] HTTP Server đã khởi chạy thành công trên cổng ${server.address().port}`);
});

console.log('>>> Đang kích hoạt tiến trình bot...\n');

// Khởi chạy file bot của bạn (ở đây gọi bot.js hoặc bot1.js tùy theo cấu trúc bạn đang dùng)
const child = spawn('node', ['bot.js'], { stdio: 'inherit', shell: true });

child.on('error', (err) => {
    console.error(`[Lỗi] Không thể chạy bot.js:`, err.message);
});

child.on('exit', (code) => {
    console.warn(`[Cảnh báo] Tiến trình đã dừng (Code: ${code}). Khởi động lại sau 5s...`);
    setTimeout(() => {
        spawn('node', ['bot.js'], { stdio: 'inherit', shell: true });
    }, 5000);
});