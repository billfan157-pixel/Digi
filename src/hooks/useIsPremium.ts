import { useAppStore } from '@/store/useAppStore';

export function useIsPremium(): boolean {
  const { isPremium, profile } = useAppStore(s => ({ isPremium: s.isPremium, profile: s.profile }));
  if (!isPremium) return false;
  if (!profile?.subscription_end) return isPremium;
  const end = new Date(profile.subscription_end);
  const now = new Date();
  return end.getTime() > now.getTime();
}
