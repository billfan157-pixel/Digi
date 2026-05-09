import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Clock, Bluetooth, Loader2 } from 'lucide-react';
import type { WaterLog } from '../../models';

interface SelectedDateModalProps {
  selectedDateModal: { date: string; ml: number } | null;
  onClose: () => void;
  dayLogs: WaterLog[];
  isDayLogsLoading: boolean;
  waterEntries: WaterLog[];
  waterIntake: number;
}

export default function SelectedDateModal({
  selectedDateModal,
  onClose,
  dayLogs,
  isDayLogsLoading,
  waterEntries,
  waterIntake
}: SelectedDateModalProps) {
  return (
    <AnimatePresence>
      {selectedDateModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md rounded-t-[2rem] p-6 pb-12 glass-card-strong border-t border-white/10 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0" />

            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Nhật ký ngày
                </p>
                <h3 className="text-2xl font-black text-white">
                  {new Date(selectedDateModal.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h3>
              </div>
              <button onClick={onClose} aria-label="Đóng nhật ký" title="Đóng" className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {(() => {
              const now = new Date();
              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              const isSelectedToday = selectedDateModal.date === todayStr;
              
              const entriesInStore = waterEntries?.filter((e: any) => e.day === selectedDateModal.date) || [];
              const hasEntriesInStore = entriesInStore.length > 0;
              
              const displayLogs = hasEntriesInStore ? entriesInStore : dayLogs;
              const displayTotalMl = hasEntriesInStore ? entriesInStore.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) : (isSelectedToday ? waterIntake : selectedDateModal.ml);
              
              if (isDayLogsLoading) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 flex-1">
                    <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Đang tải lịch sử...</p>
                  </div>
                );
              }
              
              if (displayLogs.length === 0) {
                return (
                  <div className="text-center py-16 flex-1">
                    <div className="w-16 h-16 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Droplets size={30} className="text-slate-600" />
                    </div>
                    <p className="text-slate-300 font-bold mb-1">Chưa có dữ liệu</p>
                    <p className="text-meta text-sm mb-6">Bạn chưa ghi nhận lần uống nước nào cho ngày này.</p>
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl bg-cyan-500/10 text-cyan-300 font-bold text-sm active:scale-95 transition-transform border border-cyan-500/20 hover:bg-cyan-500/20">
                      Đóng
                    </button>
                  </div>
                );
              }
              
              return (
                <>
                  <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide flex-1">
                    {displayLogs.map((entry: any, index: number) => {
                      const timeStr = new Date(entry.created_at || entry.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                      const amount = entry.amount || 0;

                      return (
                        <div key={entry.id || index} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                            <Droplets size={18} className="text-cyan-400" />
                          </div>
                          {/* Removed the decorative Droplets container here to clean up the UI */}
                          
                          <div className="flex-1">
                            <p className="font-black text-white text-lg">
                              {amount}<span className="text-xs text-meta ml-1">ml</span>
                            </p>
                            <div className="flex items-center gap-2 text-meta text-[10px] font-bold uppercase tracking-wider mt-0.5">
                              <Clock size={10} />
                              {timeStr} •
                              {entry.name === 'DigiBottle' ? (
                                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 border border-cyan-500/20">
                                  <Bluetooth size={10} /> Từ DigiBottle
                                </span>
                              ) : (
                                <span>{entry.name || 'Nước lọc'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-end shrink-0">
                    <div>
                      <p className="text-[10px] text-meta font-black uppercase tracking-widest">Tổng nạp</p>
                      <p className="text-3xl font-black text-white">
                        {displayTotalMl}
                        <span className="text-sm text-cyan-500 ml-1">ml</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-meta font-black uppercase tracking-widest">{displayLogs.length} lần uống</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
