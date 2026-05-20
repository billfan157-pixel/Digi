import { describe, it, expect } from 'vitest';

describe('supabase client', () => {
  it('exports isSupabaseConfigured and checkSupabaseConfig', async () => {
    const mod = await import('./supabase');
    expect(typeof mod.isSupabaseConfigured).toBe('boolean');
    expect(typeof mod.checkSupabaseConfig).toBe('function');
    expect(typeof mod.checkSupabaseConfig()).toBe('boolean');
  });

  it('exports supabase client with from method', async () => {
    const mod = await import('./supabase');
    expect(mod.supabase).toBeDefined();
    expect(typeof mod.supabase.from).toBe('function');
    expect(typeof mod.supabase.rpc).toBe('function');
  });
});
