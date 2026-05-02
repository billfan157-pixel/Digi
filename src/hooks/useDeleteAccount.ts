// src/hooks/useDeleteAccount.ts
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type DeleteOption = 'data-only' | 'account-full';

export const useDeleteAccount = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDelete = async (password: string, option: DeleteOption) => {
    setIsDeleting(true);
    setError(null);

    try {
      // 1. XÁC MINH MẬT KHẨU
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: password,
      });

      if (authError || !user) {
        throw new Error('Mật khẩu không chính xác.');
      }

      // 2. GỌI FUNCTION SQL TƯƠNG ỨNG
      let rpcError;
      
      if (option === 'account-full') {
        // XÓA LUÔN TÀI KHOẢN (Dùng function đã tạo: delete_account_and_auth)
        // Function này tự động xóa Storage -> Data -> Auth User
        const { error } = await supabase.rpc('delete_account_and_auth');
        rpcError = error;
      } else {
        // CHỈ XÓA DỮ LIỆU (Dùng function cũ: delete_all_user_data_secure)
        const { error } = await supabase.rpc('delete_all_user_data_secure');
        rpcError = error;
      }

      if (rpcError) {
        throw new Error(rpcError.message || 'Không thể thực hiện xóa.');
      }

      // 3. ĐĂNG XUẤT (Nếu xóa tài khoản thành công, session cũng sẽ mất, nhưng signOut vẫn an toàn)
      await supabase.auth.signOut();

      return { success: true };

    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi.');
      return { success: false, message: err.message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { performDelete, isDeleting, error };
};