import { Droplet, Settings2 } from 'lucide-react';
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
          rounded-[30px]
          border border-white/[0.07]
          bg-slate-900/65
          backdrop-blur-2xl
          shadow-[0_10px_40px_rgba(0,0,0,0.45)]
          p-2.5
        "
      >
        {/* ambient glow */}
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_65%)]
            pointer-events-none
          "
        />

        <div className="relative flex items-center gap-2">
          
          {/* QUICK BUTTONS */}
          <div className="flex flex-1 gap-2">
            {quickAmounts.map((amount, index) => (
              <motion.button
                key={`qa-${amount}-${index}`}
                whileTap={{ scale: 0.96 }}
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
                  min-w-0
                  h-[92px]
                  rounded-[24px]
                  overflow-hidden
                  group
                "
              >
                {/* background */}
                <div
                  className="
                    absolute inset-0
                    bg-gradient-to-b
                    from-cyan-400/10
                    via-slate-800/80
                    to-slate-900/90
                    border border-cyan-400/10
                    group-hover:border-cyan-300/20
                    transition-all duration-300
                  "
                />

                {/* top highlight */}
                <div
                  className="
                    absolute inset-x-0 top-0 h-px
                    bg-white/20
                  "
                />

                {/* hover glow */}
                <div
                  className="
                    absolute inset-0 opacity-0
                    group-hover:opacity-100
                    transition-opacity duration-300
                    bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_70%)]
                  "
                />

                <div
                  className="
                    relative z-10
                    h-full
                    flex flex-col items-center justify-center
                  "
                >
                  {/* ICON */}
                  <div
                    className="
                      mb-2
                      flex items-center justify-center
                      w-9 h-9
                      rounded-full
                      bg-cyan-400/10
                      border border-cyan-400/10
                      shadow-inner
                    "
                  >
                    <Droplet
                      size={16}
                      className="
                        text-cyan-300
                        group-hover:scale-110
                        transition-transform duration-300
                      "
                    />
                  </div>

                  {/* NUMBER */}
                  <span
                    className="
                      text-white
                      font-black
                      text-[18px]
                      leading-none
                      tracking-tight
                    "
                  >
                    +{amount}
                  </span>

                  {/* UNIT */}
                  <span
                    className="
                      mt-1
                      text-[10px]
                      uppercase
                      tracking-[0.22em]
                      text-slate-500
                      font-bold
                    "
                  >
                    ML
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* SETTINGS BUTTON */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ rotate: 15 }}
            onClick={onEditQuickAmounts}
            className="
              relative shrink-0
              w-[64px]
              h-[92px]
              rounded-[24px]
              overflow-hidden
              bg-white/[0.03]
              border border-white/[0.06]
              flex items-center justify-center
              group
            "
          >
            <div
              className="
                absolute inset-0
                bg-gradient-to-b
                from-white/[0.04]
                to-transparent
              "
            />

            <div
              className="
                absolute inset-0 opacity-0
                group-hover:opacity-100
                transition-opacity duration-300
                bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]
              "
            />

            <Settings2
              size={20}
              className="
                relative z-10
                text-slate-400
                group-hover:text-white
                transition-colors duration-300
              "
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
});

export default QuickAddSection;