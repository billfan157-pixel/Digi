import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 Đang kiểm tra khả năng đọc dữ liệu với Anon Key...\n');

async function checkTable(tableName, columns) {
  console.log(`⏳ Kiểm tra bảng: ${tableName}...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select(columns)
    .limit(2);

  if (error) {
    if (error.message.includes('permission') || error.code === 'PGRST300') {
      console.log(`✅ AN TOÀN: Bảng '${tableName}' được bảo vệ (RLS đang hoạt động).`);
      console.log(`   Lỗi: ${error.message}\n`);
      return 'secure';
    } else if (error.message.includes('relation') || error.code === '42P01') {
      console.log(`ℹ️  THÔNG TIN: Bảng '${tableName}' không tồn tại.\n`);
      return 'not_found';
    } else {
      console.log(`⚠️  LỖI KHÁC: ${error.message}\n`);
      return 'error';
    }
  }

  if (data && data.length > 0) {
    console.log(`❌ CẢNH BÁO NGHIÊM TRỌNG: Đọc được ${data.length} dòng từ bảng '${tableName}'!`);
    console.log(`   Dữ liệu mẫu:`, JSON.stringify(data[0], null, 2));
    console.log(`   => RLS chưa được bật hoặc cấu hình sai. Hacker có thể đọc hết dữ liệu này!\n`);
    return 'exposed';
  } else {
    console.log(`⚠️  Bảng '${tableName}' truy cập được nhưng đang trống (hoặc RLS chặn hết dữ liệu).\n`);
    return 'empty_or_filtered';
  }
}

async function run() {
  // Kiểm tra các bảng quan trọng nhất
  const tablesToCheck = [
    { name: 'profiles', cols: 'id, email, full_name, age' },
    { name: 'social_posts', cols: 'id, author_id, content' },
    { name: 'water_logs', cols: 'id, user_id, amount_ml' },
    { name: 'ai_chats', cols: 'id, user_id, message' }
  ];

  let exposedCount = 0;

  for (const table of tablesToCheck) {
    const result = await checkTable(table.name, table.cols);
    if (result === 'exposed') exposedCount++;
  }

  console.log('========================================');
  if (exposedCount > 0) {
    console.log(`🚨 KẾT QUẢ: PHÁT HIỆN ${exposedCount} BẢNG BỊ LỘ DỮ LIỆU!`);
    console.log('HÀNH ĐỘNG: Cần bật RLS ngay lập tức trong Supabase Dashboard.');
  } else {
    console.log('✅ KẾT QUẢ: CÁC BẢNG QUAN TRỌNG ĐƯỢC BẢO VỆ TỐT (HOẶC CHƯA CÓ DỮ LIỆU).');
  }
  console.log('========================================');
}

run().catch(console.error);