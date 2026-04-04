import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

interface PinpadModalProps {
  showPinpad: boolean;
  setShowPinpad: (show: boolean) => void;
  setGameOver: (state: "win" | "lose") => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function PinpadModal({ showPinpad, setShowPinpad, setGameOver, setLogs }: PinpadModalProps) {
  return (
    <AnimatePresence>
      {showPinpad && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <div className="bg-zinc-900 border-4 border-red-500 rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <ShieldAlert size={48} className="text-red-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Warehouse Locked</h2>
            <p className="text-zinc-400 text-sm">
              The villain has locked the door! Enter the correct sequence of clues you found to unlock it and stop them.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {["12345", "34251", "54321", "13524"].map((pin, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (pin === "34251") {
                      setShowPinpad(false);
                      setGameOver("win");
                    } else {
                      setLogs(prev => ["🚨 INCORRECT PIN! Access Denied.", ...prev].slice(0, 500));
                      setShowPinpad(false);
                    }
                  }}
                  className="bg-zinc-800 hover:bg-red-900/50 border-2 border-zinc-700 hover:border-red-500 text-white font-black text-xl py-4 rounded-xl transition-all active:scale-95"
                >
                  {pin}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowPinpad(false)}
              className="text-zinc-500 hover:text-white text-sm font-bold uppercase underline"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
