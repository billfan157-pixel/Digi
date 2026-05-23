import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Loader2, Award, ClipboardCheck, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/store/useUIStore';

interface WaitlistRecord {
  id: string;
  user_id: string;
  email: string;
  tier_interest: 'standard' | 'pro_kit';
  quantity: number;
  created_at: string;
  status: 'pending' | 'notified' | 'purchased' | 'cancelled';
}

export default function HardwareWaitlistModal() {
  const showHardwareWaitlist = useUIStore(s => s.showHardwareWaitlist);
  const setShowHardwareWaitlist = useUIStore(s => s.setShowHardwareWaitlist);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [email, setEmail] = useState('');
  const [tierInterest, setTierInterest] = useState<'standard' | 'pro_kit'>('standard');
  const [quantity, setQuantity] = useState(1);
  
  // Waitlist data if already registered
  const [existingRecord, setExistingRecord] = useState<WaitlistRecord | null>(null);
  const [waitlistRank, setWaitlistRank] = useState<number | null>(null);

  // Fetch email and check registration
  useEffect(() => {
    if (!showHardwareWaitlist) return;

    const checkStatus = async () => {
      setFetching(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          
          // Check if already registered
          const { data, error } = await supabase
            .from('hardware_waitlist')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error checking waitlist:', error);
          } else if (data) {
            setExistingRecord(data);
            setTierInterest(data.tier_interest as 'standard' | 'pro_kit');
            setQuantity(data.quantity);
            
            // Get rank
            const { data: rank, error: rankError } = await supabase
              .rpc('get_waitlist_rank');
            if (!rankError) {
              setWaitlistRank(rank);
            }
          } else {
            setExistingRecord(null);
            setWaitlistRank(null);
          }
        }
      } catch (error) {
        console.error('Error fetching waitlist state:', error);
      } finally {
        setFetching(false);
      }
    };

    checkStatus();
  }, [showHardwareWaitlist]);

  if (!showHardwareWaitlist) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Không tìm thấy thông tin email của bạn.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const payload = {
        user_id: user.id,
        email,
        tier_interest: tierInterest,
        quantity,
        status: 'pending'
      };

      if (existingRecord) {
        // Update
        const { error } = await supabase
          .from('hardware_waitlist')
          .update({
            tier_interest: tierInterest,
            quantity
          })
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Cập nhật đăng ký danh sách chờ thành công!');
      } else {
        // Insert
        const { error } = await supabase
          .from('hardware_waitlist')
          .insert(payload);

        if (error) throw error;
        toast.success('Đăng ký danh sách chờ DigiBottle thành công!');
      }

      // Re-fetch waitlist state
      const { data } = await supabase
        .from('hardware_waitlist')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setExistingRecord(data);

      const { data: rank } = await supabase.rpc('get_waitlist_rank');
      setWaitlistRank(rank);
    } catch (error: unknown) {
      console.error('Waitlist submission failed:', error);
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi đăng ký.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký danh sách chờ DigiBottle?')) {
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('hardware_waitlist')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Đã hủy đăng ký danh sách chờ DigiBottle.');
      setExistingRecord(null);
      setWaitlistRank(null);
      setQuantity(1);
      setTierInterest('standard');
    } catch (error: unknown) {
      console.error('Cancel waitlist failed:', error);
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy đăng ký.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Glassmorphic Modal styling matching theme
  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={() => setShowHardwareWaitlist(false)}
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-cyan-500/20 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px]" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles size={16} />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Đặt Trước DigiBottle</h3>
          </div>
          <button 
            onClick={() => setShowHardwareWaitlist(false)} 
            className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
            <p className="text-xs font-semibold">Đang tải trạng thái danh sách chờ...</p>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            {/* Display Ranking Position if registered */}
            {existingRecord && waitlistRank !== null && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2 text-cyan-400">
                  <Award size={24} />
                </div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thứ hạng của bạn</h4>
                <p className="text-4xl font-black text-white mt-1">#{waitlistRank}</p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-cyan-400 font-bold mt-2 bg-cyan-500/10 px-3 py-1 rounded-full w-fit mx-auto">
                  <ClipboardCheck size={12} />
                  <span>Đăng ký chờ thành công</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pre-filled Email field */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Email liên hệ</label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold outline-none cursor-not-allowed" 
                />
              </div>

              {/* Version/Tier Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Phiên bản DigiBottle</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTierInterest('standard')}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      tierInterest === 'standard'
                        ? 'bg-cyan-500/10 border-cyan-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-black">Standard Bottle</p>
                    <p className="text-[10px] text-slate-500 mt-1">Bản cơ bản đầy đủ tính năng kết nối thông minh.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTierInterest('pro_kit')}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      tierInterest === 'pro_kit'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-black text-amber-400">Pro Kit</p>
                    <p className="text-[10px] text-slate-500 mt-1">Bao gồm Bình, Đế sạc nhanh & Khung silicone chống sốc.</p>
                  </button>
                </div>
              </div>

              {/* Quantity selector */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Số lượng (Tối đa 10)</label>
                <div className="flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800 w-fit">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-slate-400 hover:text-white border border-slate-800"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-black text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-slate-400 hover:text-white border border-slate-800"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                    loading ? 'bg-cyan-600/50 cursor-not-allowed' : 'bg-cyan-400 hover:bg-cyan-300'
                  }`}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>{existingRecord ? 'Cập nhật đăng ký' : 'Tham gia danh sách chờ'}</span>
                  {!loading && <ArrowRight size={14} />}
                </button>

                {existingRecord && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 active:scale-[0.98] transition-all"
                  >
                    Hủy đăng ký chờ
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <AlertCircle className="text-slate-500 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Khi đến lượt đặt mua của bạn, chúng tôi sẽ gửi thông báo xác nhận và thông tin thanh toán đến email đã đăng ký. Bạn có thể thay đổi hoặc hủy đăng ký bất cứ lúc nào mà không tốn phí.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
