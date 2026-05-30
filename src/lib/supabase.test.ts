import { describe, it, expect, vi } from 'vitest';

describe('supabase client', () => {
  it('exports isSupabaseConfigured and checkSupabaseConfig', async () => {
    const mod = await import('./supabase');
    expect(typeof mod.isSupabaseConfigured).toBe('boolean');
    expect(typeof mod.checkSupabaseConfig).toBe('function');
    expect(typeof mod.checkSupabaseConfig()).toBe('boolean');
  });

  it('exports supabase client with from and rpc methods', async () => {
    const mod = await import('./supabase');
    expect(mod.supabase).toBeDefined();
    expect(typeof mod.supabase.from).toBe('function');
    expect(typeof mod.supabase.rpc).toBe('function');
  });
});

describe('supabase RPC security functions', () => {
  it('check_ai_usage RPC accepts p_action text parameter', async () => {
    const mod = await import('./supabase');
    const rpcSpy = vi.spyOn(mod.supabase, 'rpc').mockResolvedValue({
      data: { allowed: true, limit: 5, remaining: 3 },
      error: null,
    } as never);

    const result = await mod.supabase.rpc('check_ai_usage', { p_action: 'advice' });
    expect(rpcSpy).toHaveBeenCalledWith('check_ai_usage', { p_action: 'advice' });
    expect(result.data).toEqual({ allowed: true, limit: 5, remaining: 3 });
    expect(result.error).toBeNull();

    rpcSpy.mockRestore();
  });

  it('consume_ai_usage RPC handles error gracefully', async () => {
    const mod = await import('./supabase');
    const rpcSpy = vi.spyOn(mod.supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'unauthorized', code: '42501' },
    } as never);

    const result = await mod.supabase.rpc('consume_ai_usage', { p_action: 'chat' });
    expect(rpcSpy).toHaveBeenCalledWith('consume_ai_usage', { p_action: 'chat' });
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('unauthorized');

    rpcSpy.mockRestore();
  });

  it('check_ai_usage RPC blocks when quota exhausted', async () => {
    const mod = await import('./supabase');
    const rpcSpy = vi.spyOn(mod.supabase, 'rpc').mockResolvedValue({
      data: { allowed: false, limit: 5, remaining: 0 },
      error: null,
    } as never);

    const result = await mod.supabase.rpc('check_ai_usage', { p_action: 'advice' });
    expect(result.data.allowed).toBe(false);
    expect(result.data.remaining).toBe(0);

    rpcSpy.mockRestore();
  });
});
