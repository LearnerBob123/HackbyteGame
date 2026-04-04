import React from 'react';
import { motion } from 'motion/react';
import { MapPin, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Position } from '../types';
import { Agent } from '../models/Agent';
import { LOCATIONS } from '../data/locations';
import { RUMORS } from '../data/rumors';
import { MAP_SIZE, TILE_MAP } from '../data/map';
import { SimulationEngine } from '../models/Simulation';

interface GameMapProps {
  playerPos: Position;
  agents: Agent[];
  verifiedRumors: Record<string, boolean>;
  engine: SimulationEngine;
  day: number;
  hasUnverifiedRumor: (locName: string) => boolean;
  verifyAtLocation: (locId: string) => void;
  handleAgentClick: (agent: Agent) => void;
  playerName: string;
}

export function GameMap({
  playerPos,
  agents,
  verifiedRumors,
  engine,
  day,
  hasUnverifiedRumor,
  verifyAtLocation,
  handleAgentClick,
  playerName
}: GameMapProps) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-[#a8e671] border-4 border-zinc-800 rounded-b-xl overflow-hidden shadow-2xl shadow-emerald-900/10">
        <div 
          className="grid w-full h-full absolute inset-0" 
          style={{ gridTemplateColumns: `repeat(${MAP_SIZE}, 1fr)`, gridTemplateRows: `repeat(${MAP_SIZE}, 1fr)` }}
        >
          {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, i) => {
            const x = i % MAP_SIZE;
            const y = Math.floor(i / MAP_SIZE);
            const tile = TILE_MAP[y][x];
            
            let bgClass = "bg-[#7cb342] border border-[#689f38]/20"; // Grass
            if (tile === 1) bgClass = "bg-[#d7ccc8] border border-[#bcaaa4]/40"; // Path
            if (tile === 2) bgClass = "bg-[#78909c] border-t-4 border-[#546e7a] shadow-sm z-10"; // Wall
            if (tile === 3) bgClass = "bg-[#8d6e63] border-b-2 border-[#5d4037]"; // Wood
            if (tile === 4) bgClass = "bg-[#b0bec5] border border-[#90a4ae]"; // Tile
            
            return (
              <div key={i} className={cn("relative", bgClass)}>
                {tile === 5 && (
                  <div className="absolute inset-[-30%] bg-[#43a047] rounded-full shadow-md border-2 border-[#2e7d32] z-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Locations */}
        {LOCATIONS.map(loc => {
          const isPlayerInside = playerPos.x >= loc.x && playerPos.x < loc.x + loc.w && 
                               playerPos.y >= loc.y && playerPos.y < loc.y + loc.h;
          const hasRumor = hasUnverifiedRumor(loc.name);

          return (
            <div
              key={loc.id}
              onClick={() => verifyAtLocation(loc.id)}
              className={cn(
                "absolute border-2 overflow-hidden transition-all duration-300 cursor-pointer",
                loc.color, 
                loc.border,
                isPlayerInside && "ring-4 ring-white/50 z-30"
              )}
              style={{
                left: `${(loc.x / MAP_SIZE) * 100}%`,
                top: `${(loc.y / MAP_SIZE) * 100}%`,
                width: `${(loc.w / MAP_SIZE) * 100}%`,
                height: `${(loc.h / MAP_SIZE) * 100}%`,
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                <span className="text-2xl opacity-30 drop-shadow-md">{loc.emoji}</span>
                <span className="text-black/70 text-[10px] font-black pointer-events-none drop-shadow-md uppercase bg-white/60 px-2 py-0.5 rounded shadow-sm z-10">
                  {loc.name}
                </span>
                
                {day === 2 && hasRumor && isPlayerInside && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-2 bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg z-40 uppercase"
                  >
                    Verify Now
                  </motion.button>
                )}
                {day === 3 && loc.id === 'warehouse' && isPlayerInside && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-2 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 shadow-lg z-40 uppercase animate-pulse"
                  >
                    Unlock Door
                  </motion.button>
                )}
              </div>
            </div>
          );
        })}

        {/* Verification Pins */}
        {RUMORS.map(rumor => {
          if (verifiedRumors[rumor.id] !== undefined) return null;
          const loc = engine.rumorLocations[rumor.id];
          if (!loc) return null;
          
          return (
            <div
              key={`pin-${rumor.id}`}
              className="absolute w-[5%] h-[5%] flex items-center justify-center z-20 group"
              style={{ left: `${(loc.x / MAP_SIZE) * 100}%`, top: `${(loc.y / MAP_SIZE) * 100}%` }}
            >
              <MapPin className="text-red-600 animate-bounce drop-shadow-md" size={16} />
              <div className="absolute -top-6 bg-white text-black text-[8px] px-1.5 py-0.5 rounded border-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 font-bold shadow-sm">
                Investigate: {loc.name}
              </div>
            </div>
          );
        })}

        {agents.map(agent => (
          <motion.div
            key={agent.id}
            animate={{ left: `${(agent.pos.x / MAP_SIZE) * 100}%`, top: `${(agent.pos.y / MAP_SIZE) * 100}%` }}
            className={cn("absolute w-[5%] h-[5%] flex flex-col items-center justify-center z-10 group", !agent.isBackground && "cursor-pointer")}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            onClick={() => handleAgentClick(agent)}
          >
            {!agent.isBackground && (
              <div className="absolute -top-6 bg-white border-2 border-gray-400 text-black text-[8px] font-bold px-1 rounded-sm shadow-sm whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {agent.name.substring(0,2)}: 💬
              </div>
            )}
            <div className={cn("w-4 h-4 relative transition-transform", !agent.isBackground && "hover:scale-110")}>
              <div className="absolute top-0 left-1 w-2 h-2 rounded-full bg-[#fcd5b4] border border-black z-10"></div>
              <div className="absolute bottom-0 left-0.5 w-3 h-2.5 rounded-t-sm border border-black" style={{ backgroundColor: agent.color }}></div>
            </div>
          </motion.div>
        ))}

        <motion.div
          animate={{ left: `${(playerPos.x / MAP_SIZE) * 100}%`, top: `${(playerPos.y / MAP_SIZE) * 100}%` }}
          className="absolute w-[5%] h-[5%] flex flex-col items-center justify-center z-20"
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className="absolute -top-6 bg-emerald-100 border-2 border-emerald-500 text-emerald-900 text-[8px] font-bold px-1 rounded-sm shadow-sm whitespace-nowrap z-20">
            AGENT {playerName.toUpperCase()}
          </div>
          <div className="w-4 h-4 relative">
            <div className="absolute top-0 left-1 w-2 h-2 rounded-full bg-[#fcd5b4] border-2 border-emerald-500 z-10">
              <div className="absolute -top-1 -left-0.5 w-3 h-1.5 bg-emerald-600 rounded-t-full"></div>
            </div>
            <div className="absolute bottom-0 left-0.5 w-3 h-2.5 rounded-t-sm border-2 border-emerald-500 bg-emerald-500"></div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="bg-[#f8f9fa] px-3 py-2 rounded-lg border-2 border-[#cbd5e1] flex items-center gap-3 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <div /> <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowUp size={12} /></div> <div />
            <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowLeft size={12} /></div>
            <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowDown size={12} /></div>
            <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowRight size={12} /></div>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Move</span>
        </div>
      </div>
    </div>
  );
}
