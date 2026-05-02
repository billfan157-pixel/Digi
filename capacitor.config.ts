import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vlu.digiwell',
  appName: 'DigiWell',
  webDir: 'dist', // Thư mục chứa code sau khi build (Vite mặc định là 'dist')
  server: {
    // Chỉ dùng khi dev muốn test qua IP, còn khi build EAS thì không cần
    // androidScheme: 'https' 
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    // Cấu hình cho Keyboard nếu cần (tùy chọn)
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;