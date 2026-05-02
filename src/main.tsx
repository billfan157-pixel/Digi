import { AppStorage } from './lib/storage';

// 1. Nạp toàn bộ Capacitor Preferences vào RAM cache
// Bước này phải thực hiện trước khi bất kỳ file nào khác được import
// để đảm bảo các component có thể đọc Storage đồng bộ ngay lập tức.
await AppStorage.init();

// 2. Chạy app chính
await import('./bootstrap');
