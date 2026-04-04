import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StartScreenProps {
  tempName: string;
  setTempName: (name: string) => void;
  handleStartGame: () => void;
}

export function StartScreen({ tempName, setTempName, handleStartGame }: StartScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-mono">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border-4 border-emerald-500 p-8 rounded-2xl max-w-lg text-center space-y-6 shadow-2xl shadow-emerald-900/20"
      >
        <h1 className="text-5xl font-black text-white uppercase italic tracking-widest">Welcome to Navagram</h1>
        <div className="space-y-2">
          <p className="text-zinc-400 text-sm uppercase font-bold">Enter Your Agent Name:</p>
          <input 
            type="text" 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Mahabali"
            className="w-full bg-zinc-950 border-2 border-zinc-800 p-4 rounded-xl text-white text-center text-xl font-bold focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        <p className="text-zinc-400 text-sm">
          You are Agent <span className="text-white font-bold">{tempName || "Mahabali"}</span>. Your mission is to uncover the truth behind the strange whispers in Navagram.
        </p>
        <div className="space-y-4 text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <h3 className="text-emerald-500 font-bold uppercase text-xs">Mission Briefing:</h3>
          <ul className="text-[10px] text-zinc-300 space-y-2 list-disc pl-4">
            <li><strong className="text-white">Day 1:</strong> Talk to villagers at the Chai Nashta Point to collect all 5 rumors. Watch the Brainwashed Meter rise!</li>
            <li><strong className="text-white">Day 2:</strong> Explore the village and verify the rumors at their physical locations. <span className="text-red-500 font-bold">BEWARE:</span> You have a limited time to save Navagram!</li>
          </ul>
        </div>
        <button 
          onClick={handleStartGame}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-900/50"
        >
          Start Day 1
        </button>
      </motion.div>
    </div>
  );
}
