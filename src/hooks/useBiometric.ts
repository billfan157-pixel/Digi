// ============================================================
// DigiWell — Biometric Authentication Hook
// NATIVE BIOMETRIC (Face ID / Touch ID) via Capacitor Plugin
// ============================================================

import i18n from '@/i18n';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
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
        toast.error(i18n.t('biometric.native_only'));
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
      toast.success(i18n.t('biometric.enabled_successfully'));
      return true;
    } catch {
      toast.error(i18n.t('biometric.setup_failed_or_cancelled'));
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
        toast.error(i18n.t('biometric.not_enabled'));
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: "Quét khuôn mặt / Vân tay để mở khóa DigiWell",
        title: "Mở khóa DigiWell",
      });
      
      return true;
    } catch {
      toast.error(i18n.t('biometric.authentication_failed'));
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const disableBiometric = useCallback(async (userId: string) => {
    await clearBiometricEnabled(userId);
    toast.info(i18n.t('biometric.disabled'));
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
