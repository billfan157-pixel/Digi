import { CapacitorConfig } from '@capacitor/cli';

// IP nội bộ máy tính của bạn (Đã cập nhật)
const DEV_SERVER_URL = 'http://192.168.10.11:5173';

const config: CapacitorConfig = {
  appId: 'com.vlu.digiwell',
  appName: 'DigiWell',
  webDir: 'dist',
  
  // CẤU HÌNH LIVE RELOAD (Chỉ bật khi đang phát triển trên mạng LAN)
  server: {
    url: DEV_SERVER_URL, 
    cleartext: true, // Cho phép HTTP (cần thiết cho iOS dev)
  },

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;