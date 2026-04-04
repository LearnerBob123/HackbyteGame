import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface GameOverScreenProps {
  gameOver: "win" | "lose";
  playerName: string;
  playerReputation: number;
  verifiedRumorsCount: number;
  brainwashedMeter: number;
}

export function GameOverScreen({ gameOver, playerName, playerReputation, verifiedRumorsCount, brainwashedMeter }: GameOverScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-mono">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "p-12 rounded-3xl text-center space-y-8 max-w-2xl border-8 shadow-2xl",
          gameOver === "win" ? "bg-emerald-950 border-emerald-500 shadow-emerald-900/40" : "bg-red-950 border-red-500 shadow-red-900/40"
        )}
      >
        <div className="space-y-2">
          <h1 className="text-7xl font-black text-white uppercase italic tracking-tighter">
            {gameOver === "win" ? "MISSION SUCCESS" : "MISSION FAILED"}
          </h1>
          <p className="text-white/60 text-xl font-bold uppercase tracking-widest">
            {gameOver === "win" ? "Villain Caught! Navagram is Saved!" : "Navagram has fallen to Misinformation"}
          </p>
        </div>

        <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-bold uppercase opacity-60">Agent Name</span>
            <span className="text-xl font-black italic uppercase">{playerName}</span>
          </div>
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-bold uppercase opacity-60">Reputation</span>
            <span className="text-xl font-black italic uppercase">{playerReputation}</span>
          </div>
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-bold uppercase opacity-60">Truths Uncovered</span>
            <span className="text-xl font-black italic uppercase">{verifiedRumorsCount} / 5</span>
          </div>
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-bold uppercase opacity-60">Brainwashed Meter</span>
            <span className="text-xl font-black italic uppercase">{brainwashedMeter}%</span>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className={cn(
            "w-full py-6 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all active:scale-95 shadow-xl",
            gameOver === "win" ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950" : "bg-red-500 hover:bg-red-400 text-red-950"
          )}
        >
          Retry Mission
        </button>
      </motion.div>
    </div>
  );
}
