// --- CODE BẮT LỖI MÀN HÌNH TRẮNG (THÊM VÀO ĐẦU FILE) ---
if (typeof window !== 'undefined') {
  window.onerror = function (msg, _url, line) {
    const message = `LỖI NGHIÊM TRỌNG:\n${msg}\n\nDòng: ${line}\nFile: ${_url}`;
    console.error(message);
    
    // Tạo hộp đỏ hiển thị lỗi trên màn hình
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.height = '100%';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.9)';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '99999';
    errorDiv.style.padding = '20px';
    errorDiv.style.fontSize = '16px';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.whiteSpace = 'pre-wrap';
    errorDiv.style.overflow = 'auto';
    errorDiv.innerText = message;
    document.body.appendChild(errorDiv);
    
    return false;
  };

  window.onunhandledrejection = function (event) {
    const message = `LỖI PROMISE:\n${event.reason}`;
    console.error(message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'orange';
    errorDiv.style.color = 'black';
    errorDiv.style.zIndex = '99999';
    errorDiv.style.padding = '20px';
    errorDiv.style.fontSize = '16px';
    errorDiv.innerText = message;
    document.body.appendChild(errorDiv);
  };
}
// --- HẾT CODE BẮT LỖI ---
import { AppStorage } from './lib/storage';

// 1. Nạp toàn bộ Capacitor Preferences vào RAM cache
// Bước này phải thực hiện trước khi bất kỳ file nào khác được import
// để đảm bảo các component có thể đọc Storage đồng bộ ngay lập tức.
await AppStorage.init();

// 2. Chạy app chính
await import('./bootstrap');
