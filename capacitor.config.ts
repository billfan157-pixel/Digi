import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vlu.digiwell',
  appName: 'DigiWell',
  webDir: 'dist', // App sẽ load code từ thư mục dist (đã build)
  
  // ĐÃ TẮT LIVE RELOAD - Comment toàn bộ phần server lại
  /*
  server: {
    url: 'http://192.168.10.11:5173', 
    cleartext: true,
  },
  */

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