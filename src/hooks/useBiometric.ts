// ============================================================
// DigiWell — Biometric Authentication Hook
// NATIVE BIOMETRIC (Face ID / Touch ID) via Capacitor Plugin
// ============================================================

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
// @ts-ignore - Plugin không có type definitions
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import {
  clearBiometricEnabled,
  getBiometricEnabled,
  setBiometricEnabled,
} from '@/lib/sessionSecurity';

export function useBiometric() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isBiometricSupported = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  }, []);

  const registerBiometric = useCallback(async (userId: string): Promise<boolean> => {
    setIsRegistering(true);
    try {
      if (!Capacitor.isNativePlatform()) {
        toast.error('Tính năng này chỉ hoạt động trên thiết bị di động thật!');
        return false;
      }

      // Kiểm tra thiết bị có hỗ trợ không
      const available = await NativeBiometric.isAvailable();
      if (!available.isAvailable) throw new Error('Thiết bị không hỗ trợ Sinh trắc học');

      // Quét mặt 1 lần để xác nhận chủ máy trước khi bật khóa
      await NativeBiometric.verifyIdentity({
        reason: "Xác nhận danh tính để bật Khóa ứng dụng",
        title: "Thiết lập bảo mật",
      });

      await setBiometricEnabled(userId, true);
      toast.success('✅ Bật khóa sinh trắc học thành công!');
      return true;
    } catch {
      toast.error('Thiết lập thất bại hoặc đã bị hủy.');
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const authenticateBiometric = useCallback(async (userId: string): Promise<boolean> => {
    setIsAuthenticating(true);
    try {
      if (!Capacitor.isNativePlatform()) return true; // Bypass trên web demo

      const isEnabled = await getBiometricEnabled(userId);
      if (!isEnabled) {
        toast.error('Bạn chưa bật tính năng khóa ứng dụng');
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: "Quét khuôn mặt / Vân tay để mở khóa DigiWell",
        title: "Mở khóa DigiWell",
      });
      
      return true;
    } catch {
      toast.error('Xác thực không thành công.');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const disableBiometric = useCallback(async (userId: string) => {
    await clearBiometricEnabled(userId);
    toast.info('🔒 Đã tắt đăng nhập sinh trắc học');
  }, []);

  const getBiometricStatus = useCallback(async (userId: string) => {
    const enabled = await getBiometricEnabled(userId);
    return { registered: enabled, enabled };
  }, []);

  return {
    isBiometricSupported,
    isRegistering,
    isAuthenticating,
    registerBiometric,
    authenticateBiometric,
    disableBiometric,
    getBiometricStatus,
  };
}
