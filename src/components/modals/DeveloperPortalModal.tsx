import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Code, Key, Globe, Plus, Trash2, Copy, Check, ExternalLink,
  Webhook, BookOpen, AlertTriangle, Loader2, Zap, ChevronDown, ChevronUp,
  Terminal, RefreshCw, ShieldCheck, Gauge, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import {
  WEBHOOK_EVENTS, WEBHOOK_ENVELOPE, WEBHOOK_SIGNATURE_EXAMPLE, WEBHOOK_HEADERS,
} from '@/config/webhooks';
import { getSlowQueries } from '@/lib/supabase';
import { initWebVitals, getWebVitals } from '@/lib/webVitals';
import { getDailyAIUsage, calculateEstimatedCosts, getCostDisclaimer } from '@/lib/aiUsageQueries';

interface DeveloperPortalModalProps {
  open: boolean;
  onClose: () => void;
}

interface PublicApiKey {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  last_used_at: string | null;
}

interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  subscription_id?: string;
  event_type: string;
  response_status: number | null;
  response_body?: string | null;
  error_message: string | null;
  delivered_at: string;
}

type TabType = 'subscriptions' | 'events' | 'logs' | 'api-keys' | 'guide' | 'performance' | 'ai-costs';

export default function DeveloperPortalModal({ open, onClose }: DeveloperPortalModalProps) {
  const { t } = useTranslation();
  const profile = useAppStore(s => s.profile);
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');

  const [apiKeys, setApiKeys] = useState<PublicApiKey[]>([]);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [deliveryPage, setDeliveryPage] = useState(0);
  const pageSize = 20;

  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['*']);

  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showSignatureGuide, setShowSignatureGuide] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [, setWebVitals] = useState<ReturnType<typeof getWebVitals>>({
    fcp: null, lcp: null, cls: null, fid: null, ttfb: null
  });
  const [slowQueries, setSlowQueries] = useState<ReturnType<typeof getSlowQueries>>([]);
  const [aiCostData, setAiCostData] = useState<ReturnType<typeof calculateEstimatedCosts> | null>(null);
  const [isLoadingAiCost, setIsLoadingAiCost] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    const [keysResult, subsResult, deliveriesResult] = await Promise.all([
      supabase.from('public_api_keys').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('webhook_subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('webhook_deliveries').select('*', { count: 'exact' }).eq('user_id', profile.id).order('delivered_at', { ascending: false }).range(0, pageSize - 1),
    ]);
    if (keysResult.data) setApiKeys(keysResult.data as PublicApiKey[]);
    if (subsResult.data) setSubscriptions(subsResult.data as WebhookSubscription[]);
    if (deliveriesResult.data) {
      setDeliveries(deliveriesResult.data as WebhookDelivery[]);
      setDeliveryCount(deliveriesResult.count ?? 0);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (open && profile?.id) {
      loadData();
    }
  }, [open, profile?.id, loadData]);

  useEffect(() => {
    if (activeTab === 'performance') {
      initWebVitals();
      setWebVitals(getWebVitals());
      setSlowQueries(getSlowQueries());
    }
    if (activeTab === 'ai-costs' && profile?.id && !aiCostData) {
      setIsLoadingAiCost(true);
      getDailyAIUsage(profile.id, 30).then(usage => {
        setAiCostData(calculateEstimatedCosts(usage));
        setIsLoadingAiCost(false);
      }).catch(() => setIsLoadingAiCost(false));
    }
  }, [activeTab, profile?.id, aiCostData]);

  const loadMoreDeliveries = useCallback(async () => {
    if (!profile?.id) return;
    const nextPage = deliveryPage + 1;
    const { data } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('user_id', profile.id)
      .order('delivered_at', { ascending: false })
      .range(nextPage * pageSize, (nextPage + 1) * pageSize - 1);
    if (data) {
      setDeliveries(prev => [...prev, ...(data as WebhookDelivery[])]);
      setDeliveryPage(nextPage);
    }
  }, [profile?.id, deliveryPage]);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim() || !profile?.id) return;
    setIsCreatingKey(true);
    const { data, error } = await supabase.rpc('create_api_key', { key_name: newKeyName.trim() });
    setIsCreatingKey(false);
    if (error) { toast.error(error.message); return; }
    if (data) {
      setGeneratedKey(data as string);
      setNewKeyName('');
      loadData();
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: t('developer.delete_api_key_title'), message: t('developer.delete_api_key_msg'), confirmLabel: t('developer.delete_api_key_confirm'), variant: 'danger' });
    if (!ok) return;
    const { error } = await supabase.from('public_api_keys').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success(t('common.api_key_deleted'));
  };

  const handleCreateSubscription = async () => {
    if (!newWebhookUrl.trim() || !profile?.id) return;
    setIsCreatingWebhook(true);
    try {
      new URL(newWebhookUrl);
    } catch {
      toast.error(t('common.invalid_url'));
      setIsCreatingWebhook(false);
      return;
    }
    const { error } = await supabase.from('webhook_subscriptions').insert({
      user_id: profile.id,
      url: newWebhookUrl.trim(),
      events: webhookEvents,
      is_active: true,
    });
    setIsCreatingWebhook(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('common.webhook_created'));
    setNewWebhookUrl('');
    loadData();
  };

  const handleDeleteSubscription = async (id: string) => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: t('developer.delete_webhook_title'), message: t('developer.delete_webhook_msg'), confirmLabel: t('developer.delete_webhook_confirm'), variant: 'danger' });
    if (!ok) return;
    const { error } = await supabase.from('webhook_subscriptions').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    toast.success(t('common.webhook_deleted_toast'));
  };

  const handleToggleWebhook = async (sub: WebhookSubscription) => {
    const { error } = await supabase.from('webhook_subscriptions').update({ is_active: !sub.is_active }).eq('id', sub.id);
    if (error) { toast.error(error.message); return; }
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: !s.is_active } : s));
    toast.success(sub.is_active ? t('common.webhook_disabled') : t('common.webhook_enabled'));
  };

  const handleEventToggle = (event: string) => {
    if (event === '*') {
      setWebhookEvents(['*']);
      return;
    }
    setWebhookEvents(prev => {
      const withoutWildcard = prev.filter(e => e !== '*');
      if (withoutWildcard.includes(event)) {
        const next = withoutWildcard.filter(e => e !== event);
        return next.length === 0 ? ['*'] : next;
      }
      return [...withoutWildcard, event];
    });
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    const { error } = await supabase.functions.invoke('webhook-dispatcher', {
      body: {
        user_id: profile?.id,
        event_type: 'water_log.created',
        payload: { id: crypto.randomUUID(), user_id: profile?.id, amount: 250, name: 'Test', day: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() },
      },
    });
    setIsSendingTest(false);
    if (error) { toast.error(t('common.test_send_failed') + error.message); return; }
    toast.success(t('common.test_sent'));
    loadData();
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(t('common.copied_to_clipboard'));
  };

  if (!open) return null;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'subscriptions', label: t('developer.tab_webhooks'), icon: Webhook },
    { id: 'events', label: t('developer.tab_events'), icon: BookOpen },
    { id: 'logs', label: t('developer.tab_logs'), icon: Terminal },
    { id: 'api-keys', label: t('developer.tab_api_keys'), icon: Key },
    { id: 'guide', label: t('developer.tab_guide'), icon: Code },
    { id: 'performance', label: t('developer.tab_performance'), icon: Gauge },
    { id: 'ai-costs', label: t('developer.tab_ai_costs'), icon: DollarSign },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-h-[90vh] bg-slate-900 border-t border-white/10 rounded-t-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                <Code size={18} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-black text-base">{t('developer.portal_title')}</h2>
                <p className="text-[10px] text-slate-400 font-medium">{t('developer.portal_subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

          {/* TAB: Webhook Subscriptions */}
          {activeTab === 'subscriptions' && (
            <>
              {/* Create Form */}
              <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-4">
                <h3 className="text-[11px] font-black text-white mb-3 flex items-center gap-2">
                  <Plus size={12} className="text-cyan-400" />
                  {t('developer.add_webhook')}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('developer.endpoint_url')}</label>
                    <input
                      value={newWebhookUrl}
                      onChange={e => setNewWebhookUrl(e.target.value)}
                      placeholder={t('common.enter_webhook_url')}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{t('developer.events')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => handleEventToggle('*')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          webhookEvents.includes('*')
                         ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-950 border-white/10 text-slate-500 hover:text-slate-300'
                        }`}>{t('developer.all_events')}</button>
                      {WEBHOOK_EVENTS.filter(e => e.id !== 'streak.updated').map(ev => (
                        <button key={ev.id} onClick={() => handleEventToggle(ev.id)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                            webhookEvents.includes(ev.id)
                              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                              : 'bg-slate-950 border-white/10 text-slate-500 hover:text-slate-300'
                          }`}>{ev.label}</button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleCreateSubscription}
                    disabled={isCreatingWebhook || !newWebhookUrl.trim()}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {isCreatingWebhook ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    {t('developer.create_webhook')}
                  </button>
                </div>
              </div>

              {/* Subscription List */}
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Webhook size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">{t('developer.no_webhooks')}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{t('developer.no_webhooks_desc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="bg-slate-950/40 rounded-xl border border-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${sub.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span className="text-xs text-white font-medium truncate">{sub.url}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleToggleWebhook(sub)}
                            className={`p-1.5 rounded-lg text-[9px] font-bold transition-colors ${
                              sub.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-white/5'
                            }`}>{sub.is_active ? t('developer.webhook_active') : t('developer.webhook_inactive')}</button>
                          <button
                            onClick={handleSendTest}
                            disabled={isSendingTest}
                            className="p-1.5 rounded-lg text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          >{isSendingTest ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}</button>
                          <button onClick={() => copyToClipboard(sub.secret, `sec-${sub.id}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
                            {copiedId === `sec-${sub.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                          <button onClick={() => handleDeleteSubscription(sub.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <span>{t('developer.webhook_secret_label')} <code className="text-slate-400 bg-slate-950 px-1 rounded">{sub.secret.slice(0, 16)}...</code></span>
                        <span>|</span>
                        <span>{t('developer.webhook_events_list', { events: sub.events.join(', ') })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: Event Schema */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3">
                <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                  {t('developer.event_envelope_desc')}
                </p>
                <div className="mt-2 bg-slate-950 rounded-lg p-2.5 font-mono text-[9px] text-slate-400">
                  {`{
  "id":        "${WEBHOOK_ENVELOPE.id}",
  "event":     "${WEBHOOK_ENVELOPE.event}",
  "timestamp": "${WEBHOOK_ENVELOPE.timestamp}",
  "data":      { ... }
}`}
                </div>
              </div>

              {WEBHOOK_EVENTS.map(ev => (
                <div key={ev.id} className="bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Zap size={10} className="text-cyan-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white">{ev.label}</span>
                        <p className="text-[9px] text-slate-500">{ev.description}</p>
                      </div>
                    </div>
                    {expandedEvent === ev.id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </button>
                  {expandedEvent === ev.id && (
                    <div className="px-3 pb-3">
                      <div className="bg-slate-950 rounded-lg p-2.5">
                        <pre className="font-mono text-[9px] text-cyan-300 whitespace-pre-wrap">{ev.example}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB: Delivery Logs */}
          {activeTab === 'logs' && (
            <>
              {deliveries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Terminal size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">{t('developer.no_logs')}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {deliveries.map(d => (
                    <div key={d.id} className="bg-slate-950/40 rounded-xl border border-white/5 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            d.response_status && d.response_status >= 200 && d.response_status < 300
                              ? 'bg-emerald-400'
                              : 'bg-rose-400'
                          }`} />
                          <span className="text-[10px] font-bold text-white">{d.event_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-500">
                          <span className={d.response_status ? `font-bold ${d.response_status < 300 ? 'text-emerald-400' : 'text-rose-400'}` : 'text-slate-500'}>
                            {d.response_status || 'ERR'}
                          </span>
                          <span>{new Date(d.delivered_at).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      {d.error_message && (
                        <p className="text-[9px] text-rose-400 font-medium">{d.error_message}</p>
                      )}
                    </div>
                  ))}
                  {deliveryCount > deliveries.length && (
                    <button
                      onClick={loadMoreDeliveries}
                      className="w-full py-2 text-[10px] font-bold text-cyan-400 hover:bg-white/5 rounded-xl transition-colors"
                    >
                      {t('developer.load_more_logs', { count: deliveryCount - deliveries.length })}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB: API Keys */}
          {activeTab === 'api-keys' && (
            <>
              {/* Create Key */}
              {generatedKey ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    {t('developer.api_key_new')}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-950 rounded-lg px-3 py-2 text-[10px] text-amber-300 font-mono truncate">{generatedKey}</code>
                    <button onClick={() => copyToClipboard(generatedKey, 'new-key')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      {copiedId === 'new-key' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2">{t('developer.api_key_copy_warning')}</p>
                  <button onClick={() => setGeneratedKey(null)}
                    className="mt-2 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                    {t('developer.api_key_create_another')}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-4">
                  <h3 className="text-[11px] font-black text-white mb-3 flex items-center gap-2">
                    <Key size={12} className="text-cyan-400" />
                    {t('developer.create_api_key')}
                  </h3>
                  <div className="flex gap-2">
                    <input
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      placeholder={t('common.key_name_placeholder')}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                    />
                    <button
                      onClick={handleCreateApiKey}
                      disabled={isCreatingKey || !newKeyName.trim()}
                      className="px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-[10px] font-black flex items-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      {isCreatingKey ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {t('developer.create')}
                    </button>
                  </div>
                </div>
              )}

              {/* Key List */}
              {apiKeys.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Key size={20} className="mx-auto mb-2 opacity-50" />
                  <p className="text-[10px]">{t('developer.no_api_keys')}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {apiKeys.map(key => (
                    <div key={key.id} className="bg-slate-950/40 rounded-xl border border-white/5 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{key.name}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {t('developer.created_label', { date: new Date(key.created_at).toLocaleDateString('vi-VN') })}
                          {key.last_used_at && t('developer.last_used_label', { date: new Date(key.last_used_at).toLocaleDateString('vi-VN') })}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteApiKey(key.id)}
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: Performance Monitoring */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="bg-slate-950/40 rounded-xl border border-white/5 p-4">
                <h3 className="text-[11px] font-black text-white mb-3 flex items-center gap-2">
                  <RefreshCw size={12} className="text-amber-400" />
                  {t('developer.slow_queries')}
                </h3>
                <span className="text-[9px] text-slate-500">{t('developer.slow_queries_count', { count: slowQueries.length })}</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar mt-3">
                  {slowQueries.length === 0 ? (
                    <p className="text-center text-[10px] text-slate-500 py-4">{t('developer.no_slow_queries')}</p>
                  ) : (
                    slowQueries.map((query, idx) => (
                      <div key={idx} className="p-2 bg-slate-950 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[9px] text-slate-300 truncate flex-1">{query.query}</span>
                          <span className="text-amber-400 font-bold text-[9px] whitespace-nowrap">{query.duration.toFixed(0)}ms</span>
                        </div>
                        <div className="text-[8px] text-slate-600 mt-0.5">{new Date(query.timestamp).toLocaleString('vi-VN')}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI Cost Dashboard */}
          {activeTab === 'ai-costs' && (
            <div className="space-y-4">
              {isLoadingAiCost ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-cyan-400" />
                </div>
              ) : aiCostData ? (
                <>
                  {/* Summary */}
                  <div className="bg-slate-950/40 rounded-xl border border-white/5 p-4">
                    <h3 className="text-[11px] font-black text-white mb-3 flex items-center gap-2">
                      <DollarSign size={12} className="text-cyan-400" />
                      {t('developer.ai_cost_title')}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-cyan-400">${aiCostData.totalCostUSD.toFixed(6)}</span>
                      <span className="text-[10px] text-slate-500">{t('developer.ai_cost_vnd', { amount: aiCostData.totalCostVND.toFixed(0) })}</span>
                    </div>
                    <div className="flex gap-3 mt-2 text-[9px] text-slate-500">
                      <span>{t('developer.ai_cost_messages', { count: aiCostData.totalMessages })}</span>
                      <span>{t('developer.ai_cost_advice', { count: aiCostData.totalAdvice })}</span>
                      <span>{t('developer.ai_cost_scans', { count: aiCostData.totalScans })}</span>
                    </div>
                  </div>

                  {/* Daily Breakdown */}
                  <div className="bg-slate-950/40 rounded-xl border border-white/5 p-4">
                    <h3 className="text-[11px] font-black text-white mb-3">{t('developer.ai_cost_daily_title')}</h3>
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                      {aiCostData.dailyBreakdown.map(day => (
                        <div key={day.date} className="p-2 bg-slate-950 rounded-lg flex items-center justify-between text-[9px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 w-16">{day.date}</span>
                            <span className="text-slate-300">{day.messages} {t('developer.ai_cost_messages_suffix')}, {day.advice} {t('developer.ai_cost_advice_suffix')}, {day.scans} {t('developer.ai_cost_scans_suffix')}</span>
                          </div>
                          <span className="text-cyan-400 font-bold">${day.costUSD.toFixed(6)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[9px] text-amber-400/80 leading-relaxed p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <AlertTriangle size={10} className="inline mr-1" />
                    {getCostDisclaimer()}
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign size={20} className="mx-auto mb-2 opacity-50" />
                  <p className="text-[10px]">{t('developer.ai_cost_no_data')}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Integration Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 pb-4">
              {/* Headers */}
              <div className="bg-slate-950/40 rounded-xl border border-white/5 p-4">
                  <h3 className="text-[11px] font-black text-white mb-3 flex items-center gap-2">
                    <Globe size={12} className="text-cyan-400" />
                    {t('developer.webhook_headers')}
                  </h3>
                <div className="space-y-2">
                  {WEBHOOK_HEADERS.map(h => (
                    <div key={h.header} className="flex items-start gap-2 text-[10px]">
                      <code className="shrink-0 bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono">{h.header}</code>
                      <span className="text-slate-400">{h.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Verification */}
              <div className="bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setShowSignatureGuide(!showSignatureGuide)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-amber-400" />
                    <span className="text-[11px] font-bold text-white">{t('developer.hmac_guide_title')}</span>
                  </div>
                  {showSignatureGuide ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </button>
                {showSignatureGuide && (
                  <div className="px-4 pb-4">
                    <p className="text-[10px] text-slate-400 mb-2">{t('developer.hmac_guide_prefix')}<code className="text-cyan-300">x-digiwell-signature-256</code>{t('developer.hmac_guide_suffix')}</p>
                    <pre className="bg-slate-950 rounded-lg p-3 font-mono text-[9px] text-slate-300 whitespace-pre-wrap overflow-x-auto">{WEBHOOK_SIGNATURE_EXAMPLE}</pre>
                  </div>
                )}
              </div>

              {/* Rate Limits */}
              <div className="bg-slate-950/40 rounded-xl border border-white/5 p-4">
                  <h3 className="text-[11px] font-black text-white mb-2 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400" />
                    {t('developer.rate_limits')}
                  </h3>
                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <p>• <span className="text-white font-medium">Webhook:</span> {t('developer.rate_limits_webhook')}</p>
                    <p>• <span className="text-white font-medium">API:</span> {t('developer.rate_limits_api')}</p>
                    <p>• {t('developer.rate_limits_429')}</p>
                  </div>
              </div>

              {/* Error Codes */}
              <div className="bg-slate-950/40 rounded-xl border border-white/5 p-4">
                  <h3 className="text-[11px] font-black text-white mb-2 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-rose-400" />
                    {t('developer.error_codes')}
                  </h3>
                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <p><span className="text-emerald-400 font-bold">200</span> — {t('developer.error_200')}</p>
                    <p><span className="text-rose-400 font-bold">401</span> — {t('developer.error_401')}</p>
                    <p><span className="text-rose-400 font-bold">429</span> — {t('developer.error_429')}</p>
                    <p><span className="text-rose-400 font-bold">5xx</span> — {t('developer.error_5xx')}</p>
                  </div>
              </div>

              <div className="text-center pt-2">
                <a
                  href="/docs/API_DOCUMENTATION.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink size={12} />
                  {t('developer.full_docs')}
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
