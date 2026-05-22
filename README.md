# 🎮 TTIT Xóm Nhà Lá - Nền Tảng Trò Chơi Giải Trí

Chào mừng bạn đến với **TTIT Xóm Nhà Lá**! Đây là một nền tảng Web Game Hub nhiều người chơi thời gian thực, kết hợp giữa trò chơi dân gian Việt Nam **"Nhiều Ra Ít Bị"**, **"Oẳn Tù Tì"** truyền thống và trò chơi **"Sinh Tồn 2D"** đầy kịch tính (phong cách Agar.io). 

Dự án được xây dựng trên nền tảng công nghệ hiện đại bậc nhất: **React 19**, **Zustand**, **Express**, **Vite** và kết nối **WebSockets (`ws`)** độ trễ cực thấp.

---

## 🚀 Tính Năng Nổi Bật

### 1. 🖐️ Sảnh Đấu Oẳn Tù Tì & Nhiều Ra Ít Bị
*   **3 Chế độ chơi đa dạng**:
    *   **Oẳn Tù Tì**: Kéo - Búa - Bao truyền thống để phân định thắng thua khi chỉ còn 2 người.
    *   **Nhiều Ra, Ít Bị (Majority-Out)**: Số đông chọn giống nhau sẽ an toàn, số ít bị chọn sẽ thua/bị phạt.
    *   **Ít Ra, Nhiều Bị (Minority-Out)**: Luật ngược lại, số ít thông minh chọn độc lập sẽ an toàn, số đông sẽ thua cuộc.
*   **Cơ chế Đổi tay giới hạn**: Người chơi có số lần thay đổi lựa chọn giới hạn (mặc định 3 lần) để tăng tính chiến thuật và tâm lý học.
*   **Bộ đếm thời gian thông minh (Auto-Timers)**:
    *   Tự động đếm ngược **30 giây** để đưa ra lựa chọn, tự động random nếu người chơi AFK.
    *   Tự động đếm ngược **5 giây** để lật tay ngay khi tất cả người chơi còn sống đã chọn xong.
    *   Hiệu ứng đếm ngược lật tay (Countdown) 4 giây kịch tính trước khi hiển thị kết quả.

### 🔮 2. 🟢 Trò Chơi Sinh Tồn 2D (Agar.io Style)
Đấu trường sinh tồn thời gian thực vẽ trực tiếp trên **HTML5 Canvas 2D** mượt mà, đồng bộ chuyển động qua WebSocket ở tần số **30Hz** (30 ticks/s). Gồm 4 chế độ chơi:
*   **Cổ Điển (Classic)**: Thế giới mở không giới hạn, ăn pellet và nuốt cell nhỏ để thống trị bảng xếp hạng.
*   **Chiến Trường (Battle)**: Chế độ Battle Royale sinh tồn. Vòng bo đỏ co lại liên tục, đứng ngoài bo sẽ tự động mất máu.
*   **Tốc Chiến (Race)**: Chạy đua đạt mốc **500 khối lượng** trước tiên để giành chiến thắng. Chết sẽ tự động hồi sinh sau 2 giây.
*   **Đói Liên Hồi (Hunger)**: Cell tự suy giảm khối lượng liên tục, đòi hỏi người chơi phải liên tục săn pellet và cell khác để sinh tồn.

### 💬 3. Giao Tiếp & Tương Tác Thời Gian Thực
*   **Hệ thống Chat**: Trò chuyện thời gian thực giữa các người chơi trong phòng.
*   **Thả Emoji & Biểu Cảm**: Người chơi có thể thả Emoji phản ứng trực tiếp bay lên trên màn hình của tất cả mọi người hoặc gửi biểu cảm hướng tới một đối thủ cụ thể.
*   **Âm thanh sống động (Sound FX)**: Phản hồi âm thanh chất lượng cao cho các hành động click, đếm ngược, lật tay, chiến thắng và thất bại.

### 🔗 4. Kết Nối Bền Bỉ & Tự Động Phục Hồi
*   **Tự động kết nối lại (Auto-Reclaim)**: Khi người chơi F5 trang hoặc mất mạng tạm thời, hệ thống sẽ tự động giữ slot cũ trong 60 giây. Khi kết nối lại, họ sẽ lập tức nhận lại slot cũ, bảo toàn quyền chủ phòng, lượng máu, trạng thái an toàn hay lựa chọn hiện tại.
*   **Dọn dẹp tự động (Auto-Cleanup)**: Nếu phòng không còn bất kỳ người chơi online nào, server sẽ tự động hủy phòng sau 60 giây để tối ưu bộ nhớ.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống
*   **Node.js**: Phiên bản `>= 16.0.0`
*   **npm**: Phiên bản `>= 8.0.0`

### 1. Clone & Cài đặt Dependencies
Cài đặt thư viện cho cả máy chủ (server) và máy khách (client):
```bash
# Cài đặt thư viện của Server
npm install

# Cài đặt thư viện của Client (Vite + React)
cd client
npm install
cd ..
```

### 2. Chạy ứng dụng trong môi trường phát triển (Development)
Để phát triển dự án tiện lợi nhất, bạn nên chạy song song cả server và client dưới dạng hot-reload:

```bash
# Chạy máy chủ Express + WebSocket (mặc định trên cổng 3000)
npm run dev:server

# Chạy Vite client dev server (mở một terminal mới)
npm run dev:client
```
*Truy cập game tại địa chỉ: `http://localhost:5173` (Vite tự động proxy các kết nối WebSocket qua `localhost:3000`).*

### 3. Build và Chạy bản chính thức (Production)
Xây dựng gói giao diện tối ưu hóa và khởi chạy server tích hợp:
```bash
# Build ứng dụng client vào thư mục client/dist
npm run build

# Khởi chạy server production phục vụ cả tĩnh và socket
npm start
```
*Truy cập game tại địa chỉ: `http://localhost:3000`.*

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
├── client/                     # Thư mục ứng dụng frontend React
│   ├── src/
│   │   ├── components/         # Các thành phần UI giao diện
│   │   │   ├── screens/        # Màn hình Welcome, Lobby, Play
│   │   │   ├── ui/             # Thành phần Toast, Modal dùng chung
│   │   │   └── ...             # Chat, EmojiBar, HistoryPanel, v.v.
│   │   ├── games/              # Mã nguồn các trò chơi cụ thể
│   │   │   ├── OanTuTi.jsx     # Logic sảnh chính
│   │   │   └── Survival.jsx    # Giao diện & Canvas vẽ game Sinh tồn
│   │   ├── hooks/
│   │   │   └── useWebSocket.js # Kết nối & chuyển tiếp sự kiện socket
│   │   ├── store/
│   │   │   └── gameStore.js    # Zustand store quản lý state client
│   │   └── utils/              # Tiện ích âm thanh, SVGs, xử lý lịch sử
│   ├── index.html
│   ├── vite.config.js
│   └── ...
├── server.js                   # Điểm khởi chạy backend (Express + ws)
├── package.json                # Định nghĩa scripts & dependencies của dự án
├── AGENTS.md                   # Hướng dẫn quy ước dành cho AI Agents phát triển dự án
├── render.yaml                 # File cấu hình triển khai nhanh lên dịch vụ Render.com
└── test_*.js                   # Bộ tích hợp kiểm thử tự động (timer, reconnect, spectator, v.v.)
```

---

## 📡 Các Sự Kiện WebSocket Chính

Hệ thống giao tiếp thông qua định dạng JSON với các loại sự kiện tiêu biểu:

### Gửi từ Client lên Server:
*   `CREATE_ROOM`: Tạo phòng chơi mới kèm tên chủ phòng và luật chơi mặc định.
*   `JOIN_ROOM` / `REJOIN_ROOM`: Tham gia hoặc kết nối lại vào phòng chơi đang có.
*   `UPDATE_ROOM_CONFIG`: Cập nhật cấu hình phòng (chế độ chơi, số lượt đổi tay tối đa).
*   `START_GAME`: Bắt đầu trận đấu (chỉ chủ phòng).
*   `SUBMIT_CHOICE`: Gửi lựa chọn tay (Kéo/Búa/Bao hoặc Sấp/Ngửa).
*   `TRIGGER_REVEAL`: Yêu cầu lật tay ngay lập tức (chỉ chủ phòng khi mọi người chọn xong).
*   `SEND_CHAT`: Gửi tin nhắn văn bản vào phòng chat.
*   `SEND_REACTION`: Gửi thả Emoji phản cảm động.
*   `SURVIVAL_JOIN` / `SURVIVAL_INPUT` / `SURVIVAL_RESPAWN`: Điều khiển và kết nối game sinh tồn.

### Nhận từ Server về Client:
*   `ROOM_CREATED` / `ROOM_JOINED`: Phản hồi trạng thái khi vào phòng thành công.
*   `PLAYER_LIST_UPDATE`: Cập nhật danh sách người chơi trực tuyến, trạng thái đã chọn bài hay spectator.
*   `GAME_STARTED` / `ROUND_RESET`: Trạng thái bắt đầu trận mới hoặc vòng tiếp theo.
*   `SELECTION_TIMER` / `AUTO_REVEAL_TIMER`: Đồng bộ thời gian đếm ngược thời gian thực.
*   `REVEAL_COUNTDOWN`: Bắt đầu đếm ngược lật tay kịch tính.
*   `REVEAL_RESULTS`: Trả về kết quả thắng/thua, hòa, danh sách tay và người thua cuộc cuối cùng.
*   `SURVIVAL_STATE`: Gửi tọa độ và khối lượng của các thực thể sinh tồn (30 lần/giây).

---

## 🧪 Kiểm Thử Tự Động (Integration Testing)

Dự án sở hữu bộ kiểm thử tự động giả lập client socket chạy bằng Node.js cực kỳ mạnh mẽ để kiểm thử độ tin cậy của các tính năng phức tạp:
*   `node test_timer.js`: Kiểm thử bộ đếm thời gian lựa chọn 30s và đếm ngược tự động 5s.
*   `node test_reconnect.js`: Giả lập ngắt kết nối đột ngột của người chơi và khôi phục slot chơi thành công.
*   `node test_spectator.js`: Đảm bảo người chơi vào muộn sẽ ở trạng thái Quan Sát và tự động tham gia chơi ở vòng tiếp theo.
*   `node test_elimination.js`: Đảm bảo quy tắc loại trừ và tìm ra người thua cuộc cuối cùng hoạt động chính xác.

---

## 🎨 Quy Ước Thiết Kế & Phát Triển
*   **Thẩm mỹ cao**: Ưu tiên tối đa giao diện đậm chất tương lai (Cyberpunk/Neon), Glassmorphism, đổ bóng mờ, viền mịn.
*   **Trải nghiệm người dùng**: Chú trọng các hiệu ứng hover chuyển động mượt mà, Toast hiển thị tức thì, modal thông báo rõ ràng.
*   **Ngôn ngữ**: Toàn bộ hệ thống giao diện hiển thị mặc định bằng tiếng Việt tự nhiên và thân thiện.

Chúc bạn có những giây phút chơi game vui vẻ bên bạn bè! 🎉
