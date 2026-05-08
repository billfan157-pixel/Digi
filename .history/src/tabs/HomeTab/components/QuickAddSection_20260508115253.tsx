import { Droplet, SlidersHorizontal } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface QuickAddSectionProps {
  quickAmounts: number[];
  handleAddWater: (
    amount: number,
    factor: number,
    name: string
  ) => void;
  onEditQuickAmounts: () => void;
}

const QuickAddSection = React.memo(function QuickAddSection({
  quickAmounts,
  handleAddWater,
  onEditQuickAmounts,
}: QuickAddSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-5 mt-3 mb-7">
      <div
        className="
          relative overflow-hidden
          rounded-[2.4rem]
          border border-white/[0.08]
          bg-slate-900/70
          backdrop-blur-2xl
          shadow-[0_10px_40px_rgba(0,0,0,0.4)]
          p-3
        "
      >
        {/* ambient glow */}
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.10),transparent_55%)]
            pointer-events-none
          "
        />

        {/* top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative flex gap-3">
          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-3 gap-3 flex-1">
            {quickAmounts.map((amount, index) => (
              <motion.button
                key={`qa-${amount}-${index}`}
                whileTap={{ scale: 0.93 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 20,
                }}
                onClick={() =>
                  handleAddWater(
                    amount,
                    1,
                    t('home.pure_water')
                  )
                }
                className="
                  relative overflow-hidden
                  rounded-[1.8rem]
                  h-[112px]
                  flex flex-col items-center justify-center
                  bg-gradient-to-b
                  from-slate-800/90
                  to-slate-900/95
                  border border-white/[0.06]
                  active:border-cyan-400/30
                  active:shadow-[0_0_25px_rgba(34,211,238,0.15)]
                  transition-all duration-300
                "
              >
                {/* glow */}
                <div
                  className="
                    absolute inset-0 opacity-0
                    active:opacity-100
                    transition-opacity duration-300
                    bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_70%)]
                  "
                />

                {/* icon bubble */}
                <div
                  className="
                    relative z-10
                    w-12 h-12 rounded-full
                    bg-cyan-400/10
                    border border-cyan-300/10
                    flex items-center justify-center
                    mb-3
                    shadow-inner
                  "
                >
                  <Droplet
                    size={22}
                    className="text-cyan-300"
                  />
                </div>

                {/* amount */}
                <div className="relative z-10 text-center">
                  <p
                    className="
                      text-[2rem]
                      leading-none
                      font-black
                      tracking-tight
                      text-white
                    "
                  >
                    +{amount}
                  </p>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      uppercase
                      tracking-[0.3em]
                      text-slate-500
                      font-black
                    "
                  >
                    ML
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* SETTINGS BUTTON */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onEditQuickAmounts}
            className="
              shrink-0
              w-[76px]
              rounded-[1.8rem]
              border border-white/[0.06]
              bg-gradient-to-b
              from-slate-800/90
              to-slate-900/95
              flex items-center justify-center
              relative overflow-hidden
              active:border-purple-400/30
              transition-all
            "
          >
            <div
              className="
                absolute inset-0
                bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.10),transparent_70%)]
              "
            />

            <div className="relative z-10 flex flex-col items-center">
              <div
                className="
                  w-12 h-12 rounded-full
                  bg-white/[0.04]
                  border border-white/[0.06]
                  flex items-center justify-center
                  mb-2
                "
              >
                <SlidersHorizontal
                  size={22}
                  className="text-slate-300"
                />
              </div>

              <span
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.25em]
                  text-slate-500
                  font-black
                "
              >
                Edit
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
});

export default QuickAddSection;