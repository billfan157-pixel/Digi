// src/hooks/useDeleteAccount.ts
import i18n from '@/i18n';
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
        throw new Error(i18n.t('auth.password_incorrect'));
      }

      // 2. GỌI FUNCTION SQL TƯƠNG ỨNG
      let rpcError;
      
      if (option === 'account-full') {
        // GHI LOG TRƯỚC KHI XÓA (sau khi xóa user không còn auth context)
        try {
          await supabase.rpc('log_audit_event', {
            p_event_type: 'account_deleted',
            p_event_data: { type: 'full', timestamp: new Date().toISOString() },
          });
        } catch { /* Không block nếu log lỗi */ }

        const { error } = await supabase.functions.invoke('delete-account');
        rpcError = error;
      } else {
        // CHỈ XÓA DỮ LIỆU (RPC tự ghi audit log bên trong)
        const { error } = await supabase.rpc('delete_all_user_data_secure');
        rpcError = error;
      }

      if (rpcError) {
        throw new Error(rpcError.message || i18n.t('auth.delete_failed'));
      }

      // 3. ĐĂNG XUẤT (Nếu xóa tài khoản thành công, session cũng sẽ mất, nhưng signOut vẫn an toàn)
      await supabase.auth.signOut();

      return { success: true };

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : i18n.t('validation.error_occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { performDelete, isDeleting, error };
};