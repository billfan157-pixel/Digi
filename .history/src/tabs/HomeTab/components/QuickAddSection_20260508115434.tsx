import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, SlidersHorizontal } from 'lucide-react';
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
    <section className="px-5 mt-5 mb-7">
      <div
        className="
          relative overflow-hidden
          rounded-[34px]
          border border-white/[0.07]
          bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(2,6,23,0.96)_100%)]
          backdrop-blur-2xl
          shadow-[0_25px_80px_rgba(0,0,0,0.45)]
          p-3
        "
      >
        {/* ambient glow */}
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.08),transparent_45%)]
            pointer-events-none
          "
        />

        {/* top subtle highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative flex items-stretch gap-3">
          {/* QUICK ACTIONS */}
          <div className="flex flex-1 gap-3">
            {quickAmounts.map((amount, index) => (
              <motion.button
                key={`quick-${amount}-${index}`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
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
                  min-h-[132px]
                  rounded-[28px]
                  overflow-hidden
                  group
                "
              >
                {/* card bg */}
                <div
                  className="
                    absolute inset-0
                    rounded-[28px]
                    border border-white/[0.06]
                    bg-[linear-gradient(180deg,rgba(51,65,85,0.22)_0%,rgba(15,23,42,0.9)_100%)]
                    transition-all duration-300
                    group-hover:border-cyan-300/20
                  "
                />

                {/* cyan glow */}
                <div
                  className="
                    absolute inset-0 opacity-0
                    group-hover:opacity-100
                    transition-opacity duration-500
                    bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_65%)]
                  "
                />

                {/* bottom glow */}
                <div
                  className="
                    absolute -bottom-10 left-1/2
                    -translate-x-1/2
                    w-24 h-24
                    bg-cyan-400/10
                    blur-3xl
                  "
                />

                {/* content */}
                <div
                  className="
                    relative z-10
                    h-full
                    flex flex-col
                    items-center
                    justify-between
                    py-4
                  "
                >
                  {/* icon bubble */}
                  <div
                    className="
                      w-16 h-16
                      rounded-full
                      border border-cyan-300/15
                      bg-cyan-400/10
                      flex items-center justify-center
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                      group-hover:scale-105
                      transition-transform duration-300
                    "
                  >
                    <Droplet
                      size={28}
                      className="text-cyan-300"
                      strokeWidth={2.2}
                    />
                  </div>

                  {/* amount */}
                  <div className="flex flex-col items-center">
                    <span
                      className="
                        text-white
                        text-[34px]
                        leading-none
                        font-black
                        tracking-[-0.05em]
                      "
                    >
                      +{amount}
                    </span>

                    <span
                      className="
                        mt-2
                        text-[13px]
                        uppercase
                        tracking-[0.35em]
                        font-black
                        text-slate-500
                      "
                    >
                      ML
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* EDIT BUTTON */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -2 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 18,
            }}
            onClick={onEditQuickAmounts}
            className="
              relative
              w-[96px]
              min-h-[132px]
              rounded-[28px]
              overflow-hidden
              shrink-0
              group
            "
          >
            {/* bg */}
            <div
              className="
                absolute inset-0
                rounded-[28px]
                border border-white/[0.06]
                bg-[linear-gradient(180deg,rgba(91,33,182,0.16)_0%,rgba(15,23,42,0.92)_100%)]
              "
            />

            {/* glow */}
            <div
              className="
                absolute inset-0 opacity-0
                group-hover:opacity-100
                transition-opacity duration-500
                bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.16),transparent_70%)]
              "
            />

            <div
              className="
                relative z-10
                h-full
                flex flex-col
                items-center justify-center
              "
            >
              <div
                className="
                  w-16 h-16
                  rounded-full
                  border border-white/10
                  bg-white/[0.05]
                  flex items-center justify-center
                  mb-4
                "
              >
                <SlidersHorizontal
                  size={26}
                  className="
                    text-slate-300
                    group-hover:text-white
                    transition-colors
                  "
                />
              </div>

              <span
                className="
                  text-[12px]
                  uppercase
                  tracking-[0.35em]
                  font-black
                  text-slate-500
                "
              >
                Edit
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </section>
  );
});

export default QuickAddSection;