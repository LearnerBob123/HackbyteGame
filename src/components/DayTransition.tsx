import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DayTransitionProps {
  showDayTransition: boolean;
  day: number;
}

export function DayTransition({ showDayTransition, day }: DayTransitionProps) {
  return (
    <AnimatePresence>
      {showDayTransition && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            day === 3 ? "bg-red-950" : "bg-black"
          )}
        >
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={cn(
              "text-6xl font-black tracking-widest uppercase text-center px-4",
              day === 3 ? "text-red-500" : "text-white"
            )}
          >
            {day === 3 ? "DAY 3: THE WAREHOUSE" : "DAY 2: THE TRUTH"}
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
