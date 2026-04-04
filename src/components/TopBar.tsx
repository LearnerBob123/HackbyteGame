import React from 'react';
import { motion } from 'motion/react';
import { User, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { Position } from '../types';

interface TopBarProps {
  day: number;
  getTimeOfDay: () => string;
  brainwashedMeter: number;
  playerPos: Position;
  playerReputation: number;
}

export function TopBar({ day, getTimeOfDay, brainwashedMeter, playerPos, playerReputation }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-700/70 bg-zinc-950/85 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-xl font-black tracking-tighter uppercase italic">Navagram Sim v3.0</h1>
          </div>
          <p className="text-zinc-400 text-[10px] font-bold mt-1 uppercase">Role: Truthseeker | Day {day} | {getTimeOfDay()}</p>
        </div>
        
        <div className="hidden md:flex items-center gap-3 bg-zinc-900/90 px-4 py-2 rounded-full border border-zinc-700">
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Brainwashed Meter</span>
          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ width: `${brainwashedMeter}%` }}
              className={cn(
                "h-full transition-colors duration-500",
                brainwashedMeter > 50 ? "bg-red-500" : brainwashedMeter > 25 ? "bg-yellow-500" : "bg-emerald-500"
              )}
            />
          </div>
          <span className={cn(
            "text-[10px] font-bold",
            brainwashedMeter > 50 ? "text-red-500" : "text-zinc-400"
          )}>{brainwashedMeter}%</span>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-end gap-4 text-xs font-bold text-zinc-400">
        <div className="flex items-center gap-1"><User size={14} /> POS: {playerPos.x},{playerPos.y}</div>
        <div className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> REP: {playerReputation}</div>
      </div>
    </div>
  );
}
