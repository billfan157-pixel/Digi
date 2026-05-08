import React from 'react';
import { motion } from 'framer-motion';
import { Plus, SlidersHorizontal } from 'lucide-react';
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
          rounded-[32px]
          border border-white/[0.05]
          bg-slate-900/55
          backdrop-blur-2xl
          shadow-[0_10px_50px_rgba(0,0,0,0.35)]
          px-3 py-3
        "
      >
        {/* ambient cyan glow */}
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.06),transparent_65%)]
            pointer-events-none
          "
        />

        {/* inner highlight */}
        <div
          className="
            absolute inset-x-0 top-0 h-px
            bg-white/[0.06]
          "
        />

        <div className="relative flex items-center gap-2">
          
          {/* QUICK ACTIONS */}
          <div
            className="
              flex flex-1 items-center
              rounded-[26px]
              bg-white/[0.02]
              border border-white/[0.04]
              overflow-hidden
            "
          >
            {quickAmounts.map((amount, index) => (
              <React.Fragment key={index}>
                
                <motion.button
                  whileTap={{ scale: 0.94 }}
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
                    h-[58px]
                    group
                  "
                >
                  {/* hover glow */}
                  <div
                    className="
                      absolute inset-0 opacity-0
                      group-hover:opacity-100
                      transition-opacity duration-300
                      bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_75%)]
                    "
                  />

                  {/* active bg */}
                  <div
                    className="
                      absolute inset-0
                      bg-gradient-to-b
                      from-white/[0.015]
                      to-transparent
                    "
                  />

                  <div
                    className="
                      relative z-10
                      h-full
                      flex items-center justify-center gap-1
                    "
                  >
                    <Plus
                      size={14}
                      className="
                        text-cyan-300/90
                        transition-transform duration-300
                        group-hover:scale-110
                      "
                    />

                    <span
                      className="
                        text-white
                        font-black
                        text-[17px]
                        tracking-tight
                      "
                    >
                      {amount}
                    </span>

                    <span
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-slate-500
                        mt-[1px]
                      "
                    >
                      ml
                    </span>
                  </div>
                </motion.button>

                {/* divider */}
                {index !== quickAmounts.length - 1 && (
                  <div
                    className="
                      w-px h-6
                      bg-white/[0.05]
                    "
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* SETTINGS */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 18,
            }}
            onClick={onEditQuickAmounts}
            className="
              relative shrink-0
              w-[58px]
              h-[58px]
              rounded-[22px]
              overflow-hidden
              border border-white/[0.04]
              bg-white/[0.02]
              group
            "
          >
            {/* hover glow */}
            <div
              className="
                absolute inset-0 opacity-0
                group-hover:opacity-100
                transition-opacity duration-300
                bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_75%)]
              "
            />

            <div
              className="
                relative z-10
                h-full
                flex items-center justify-center
              "
            >
              <SlidersHorizontal
                size={18}
                className="
                  text-slate-400
                  group-hover:text-white
                  transition-colors duration-300
                "
              />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
});

export default QuickAddSection;