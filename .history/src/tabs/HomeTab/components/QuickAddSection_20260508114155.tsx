import { Droplet, Settings } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface QuickAddSectionProps {
  quickAmounts: number[];
  handleAddWater: (amount: number, factor: number, name: string) => void;
  handleAddWater: (
    amount: number,
    factor: number,
    name: string
  ) => void;
  onEditQuickAmounts: () => void;
}

const QuickAddSection = React.memo(function QuickAddSection({ quickAmounts, handleAddWater, onEditQuickAmounts }: QuickAddSectionProps) {
const QuickAddSection = React.memo(function QuickAddSection({
  quickAmounts,
  handleAddWater,
  onEditQuickAmounts,
}: QuickAddSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2 px-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest opacity-85">
          {t('home.quick_add')}
        </span>
        <button
          onClick={onEditQuickAmounts}
          className="text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 active:scale-90"
        >
          <Settings size={14} />
        </button>
      </div>
      
      <div className="flex items-center justify-center gap-3 w-full">
        {quickAmounts.map((amount, index) => (
          <button
            key={`qa-${amount}-${index}`}
            onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
            className="flex-1 bg-gradient-to-br from-slate-200/60 to-slate-100/40 dark:from-slate-800/50 dark:to-slate-900/30 backdrop-blur-md border border-slate-300/50 dark:border-white/10 rounded-2xl px-3 py-5 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 hover:from-cyan-500/20 hover:to-cyan-400/10 dark:hover:from-cyan-500/15 dark:hover:to-cyan-600/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/30 active:scale-95 transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] group"
    <div className="px-5 mt-2 mb-7">
      <div className="
        relative overflow-hidden
        bg-slate-900/65
        backdrop-blur-2xl
        border border-white/[0.08]
        rounded-[2rem]
        shadow-[0_10px_40px_rgba(0,0,0,0.35)]
        p-2
      ">
        
        {/* ambient glow */}
        <div className="
          absolute inset-0
          bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_60%)]
          pointer-events-none
        " />

        <div className="relative flex items-center gap-2">
          
          {/* QUICK BUTTONS */}
          <div className="flex flex-1 items-center gap-2">
            {quickAmounts.map((amount, index) => (
              <motion.button
                key={`qa-${amount}-${index}`}
                whileTap={{ scale: 0.94 }}
                whileHover={{ y: -1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 18,
                }}
                onClick={() =>
                  handleAddWater(
                    amount,
                    1,
                    t('home.pure_water')
                  )
                }
                className="
                  relative flex-1
                  h-[64px]
                  rounded-2xl
                  overflow-hidden
                  group
                "
              >
                
                {/* glow bg */}
                <div className="
                  absolute inset-0
                  bg-gradient-to-b
                  from-cyan-500/10
                  to-cyan-600/5
                  border border-cyan-400/10
                  group-hover:border-cyan-300/20
                  transition-all duration-300
                " />

                {/* inner highlight */}
                <div className="
                  absolute inset-x-0 top-0 h-[1px]
                  bg-white/20
                " />

                {/* active glow */}
                <div className="
                  absolute inset-0 opacity-0
                  group-hover:opacity-100
                  transition-opacity duration-300
                  bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_70%)]
                " />

                <div className="
                  relative z-10
                  h-full
                  flex flex-col items-center justify-center
                ">
                  <div className="
                    w-8 h-8 rounded-full
                    bg-cyan-400/10
                    border border-cyan-400/10
                    flex items-center justify-center
                    mb-1.5
                    group-hover:scale-110
                    transition-transform duration-300
                  ">
                    <Droplet
                      size={15}
                      className="text-cyan-300"
                    />
                  </div>

                  <span className="
                    text-white
                    font-black
                    text-[15px]
                    tracking-tight
                  ">
                    +{amount}
                  </span>

                  <span className="
                    text-[9px]
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                    font-bold
                    mt-0.5
                  ">
                    ml
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* SETTINGS */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ rotate: 20 }}
            onClick={onEditQuickAmounts}
            className="
              relative shrink-0
              w-[58px] h-[64px]
              rounded-2xl
              overflow-hidden
              bg-white/[0.03]
              border border-white/[0.06]
              flex items-center justify-center
              group
            "
          >
            <Droplet size={22} className="text-cyan-500 dark:text-cyan-400 mb-1.5 group-hover:scale-125 transition-transform" />
            <span className="font-bold text-lg">+{amount}</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 font-semibold">ml</span>
          </button>
        ))}
      </div>
            <div className="
              absolute inset-0
              bg-gradient-to-b
              from-white/[0.03]
              to-transparent
            " />

            <Settings
              size={18}
              className="
                text-slate-400
                group-hover:text-white
                transition-colors
              "
            />
          </motion.button>
        </div>
    </div>
  );
});

export default QuickAddSection;