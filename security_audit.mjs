import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(chalk.red('❌ Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env'));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log(chalk.blue('🔍 Bắt đầu kiểm tra Supabase...'));
console.log(chalk.gray(`URL: ${SUPABASE_URL}`));
console.log('');

async function checkConnection() {
  console.log(chalk.yellow('1️⃣ Kiểm tra kết nối...'));
  // Thử query một bảng hệ thống hoặc bảng bất kỳ để test kết nối
  const { data, error } = await supabase.from('_status').select('*').limit(1);
  
  if (error) {
    // Lỗi 42P01 nghĩa là bảng không tồn tại, nhưng kết nối vẫn OK
    if (error.message.includes('relation') || error.code === '42P01') {
      console.log(chalk.green('✅ Kết nối thành công (Server phản hồi bình thường)'));
      return true;
    }
    console.log(chalk.red(`❌ Kết nối thất bại: ${error.message}`));
    return false;
  }
  console.log(chalk.green('✅ Kết nối thành công'));
  return true;
}

async function listTables() {
  console.log('\n' + chalk.yellow('2️⃣ Liệt kê các bảng dữ liệu (thông qua RPC)...'));
  // Cách an toàn nhất để lấy danh sách bảng mà không cần quyền superadmin
  const { data, error } = await supabase.rpc('get_all_tables');
  
  if (error && error.message.includes('Function')) {
    console.log(chalk.gray('⚠️ Không thể dùng RPC tự động (chưa tạo hàm get_all_tables).'));
    console.log(chalk.yellow('💡 Hãy chạy lệnh SQL này trong Supabase Dashboard để xem bảng:'));
    console.log(chalk.gray('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';'));
    return [];
  }
  
  if (data) {
    console.log(chalk.green(`✅ Tìm thấy ${data.length} bảng:`));
    data.forEach(table => {
      // Xử lý cả trường hợp data trả về là object hay string
      const name = typeof table === 'object' ? table.table_name : table;
      console.log(chalk.gray(`   - ${name}`));
    });
    return data;
  }
  
  console.log(chalk.red('❌ Không thể liệt kê bảng. Có thể do RLS chặn hoàn toàn.'));
  return [];
}

async function checkRLS() {
  console.log('\n' + chalk.yellow('3️⃣ Kiểm tra Row Level Security (RLS)...'));
  console.log(chalk.gray('💡 Chạy lệnh SQL sau trong Supabase Dashboard để xem trạng thái RLS:'));
  console.log(chalk.gray('SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';'));
  console.log(chalk.gray('\n💡 Để xem chi tiết các policies:'));
  console.log(chalk.gray('SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = \'public\';'));
}

async function testDataExposure() {
  console.log('\n' + chalk.yellow('4️⃣ Kiểm tra lộ dữ liệu (Thử đọc bảng profiles)...'));
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(5);
  
  if (error) {
    console.log(chalk.green('✅ Tốt! Query bảng profiles bị chặn (RLS đang hoạt động)'));
    console.log(chalk.gray(`   Chi tiết lỗi: ${error.message}`));
  } else if (data && data.length > 0) {
    console.log(chalk.red('⚠️ CẢNH BÁO: ĐỌC ĐƯỢC DỮ LIỆU PROFILES!'));
    console.log(chalk.red('   Nếu đây là dữ liệu thật, RLS của bạn đang bị cấu hình sai (Public Access).'));
    console.log(chalk.gray('   Dữ liệu mẫu trả về:'));
    data.forEach(row => {
      console.log(chalk.gray(`   - ID: ${row.id}, Email: ${row.email || 'N/A'}`));
    });
    console.log(chalk.yellow('\n💡 Hành động khẩn cấp: Kiểm tra lại Policy SELECT của bảng profiles ngay!'));
  } else {
    console.log(chalk.green('✅ Bảng profiles trống hoặc không truy cập được (An toàn)'));
  }
}

async function checkSocialPosts() {
  console.log('\n' + chalk.yellow('5️⃣ Kiểm tra rủi ro IDOR (Thử đọc bảng social_posts)...'));
  
  const { data, error } = await supabase
    .from('social_posts')
    .select('id, author_id, content')
    .limit(5);
  
  if (error) {
    console.log(chalk.green('✅ Tốt! Query social_posts bị chặn bởi RLS'));
    console.log(chalk.gray(`   Chi tiết lỗi: ${error.message}`));
  } else if (data && data.length > 0) {
    console.log(chalk.yellow('⚠️ Có thể đọc được bài viết của người khác?'));
    console.log(chalk.gray(`   Tìm thấy ${data.length} bài viết. Hãy kiểm tra xem có phải bài của chính bạn không.`));
    console.log(chalk.gray('   Nếu đọc được bài của user khác mà không có quyền -> Lỗ hổng IDOR.'));
  } else {
    console.log(chalk.green('✅ Bảng social_posts trống hoặc được bảo vệ tốt'));
  }
}

async function runAudit() {
  const connected = await checkConnection();
  if (!connected) {
    console.log(chalk.red('\n❌ Dừng kiểm tra do không thể kết nối.'));
    process.exit(1);
  }
  
  await listTables();
  await checkRLS();
  await testDataExposure();
  await checkSocialPosts();
  
  console.log('\n' + chalk.blue('📊 TỔNG KẾT SƠ BỘ:'));
  console.log(chalk.gray('✅ Nếu thấy nhiều màu XANH: Bảo mật cơ bản ổn.'));
  console.log(chalk.gray('🛑 Nếu thấy màu ĐỎ: Cần fix RLS policies ngay trước khi deploy.'));
  console.log(chalk.gray('🔧 Các bước tiếp theo: Chạy các câu lệnh SQL gợi ý ở trên trong Dashboard để soi chi tiết.'));
  
  console.log('\n' + chalk.yellow('🔐 LỜI NHẮC NHỞ: Sau khi audit xong, hãy REGENERATE lại Anon Key để đảm bảo an toàn tuyệt đối!'));
}

runAudit().catch(err => {
  console.error(chalk.red('❌ Lỗi không mong đợi:'), err.message);
  console.error(err);
  process.exit(1);
});