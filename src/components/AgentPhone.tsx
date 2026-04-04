import React from 'react';
import { Search, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { RUMORS } from '../data/rumors';

interface AgentPhoneProps {
  collectedClues: string[];
  playerKnownRumors: string[];
  verifiedRumors: Record<string, boolean>;
  logs: string[];
}

export function AgentPhone({ collectedClues, playerKnownRumors, verifiedRumors, logs }: AgentPhoneProps) {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="bg-[#f8f9fa] border-4 border-[#cbd5e1] rounded-xl flex flex-col h-[400px] shadow-lg text-black font-sans">
        <div className="p-4 border-b-4 border-[#cbd5e1] bg-[#e2e8f0] flex items-center gap-2">
          <Activity size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold uppercase text-gray-700">AGENT PHONE 📱</h3>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-4">
          {collectedClues.length > 0 && (
            <div className="bg-zinc-800 text-white p-3 rounded-lg border-2 border-zinc-700 shadow-inner">
              <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Collected Clues</h4>
              <div className="flex gap-2 flex-wrap">
                {collectedClues.map((clue, i) => (
                  <span key={i} className="bg-zinc-950 text-emerald-400 font-black px-2 py-1 rounded border border-zinc-700 text-sm">
                    {clue}
                  </span>
                ))}
              </div>
            </div>
          )}
          {playerKnownRumors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <Search size={24} className="opacity-50" />
              <p className="text-xs font-bold uppercase text-center">Talk to villagers at Chai Nashta Point to collect rumors</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              {playerKnownRumors.map(id => {
                const r = RUMORS.find(rum => rum.id === id);
                const isVerified = verifiedRumors[id] !== undefined;
                return (
                  <div key={id} className={cn(
                    "p-3 bg-white rounded-lg text-xs border-l-4 flex items-center justify-between gap-2 shadow-sm",
                    !isVerified ? "border-gray-400" : verifiedRumors[id] ? "border-emerald-500" : "border-red-500"
                  )}>
                    <span className="flex-1 font-medium text-gray-700">{r?.text}</span>
                    {isVerified && (
                      <div className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase border",
                        verifiedRumors[id] ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {verifiedRumors[id] ? "True" : "False"}
                      </div>
                    )}
                    {!isVerified && (
                      <div className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200">
                        Unverified
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#f8f9fa] border-4 border-[#cbd5e1] rounded-xl flex flex-col h-[400px] shadow-lg text-black font-sans">
        <div className="p-4 border-b-4 border-[#cbd5e1] bg-[#e2e8f0] flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-gray-700">Log Output</h3>
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse border-2 border-white shadow-sm" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] custom-scrollbar bg-white">
          {logs.map((log, i) => (
            <div key={i} className={cn(
              "p-2 rounded border-l-4 shadow-sm",
              log.startsWith("You ") || log.includes("You investigated") || log.includes("You shared") || log.includes("You decided") || log.includes("You are now friends") || log.includes("You need to verify") || log.includes("🕵️") || log.includes("🔍") ? "bg-emerald-50 border-emerald-500 text-emerald-700" :
              log.includes("shared") ? "bg-blue-50 border-blue-500 text-blue-700" :
              log.includes("verified") ? "bg-emerald-50 border-emerald-500 text-emerald-700" :
              log.includes("📢") ? "bg-purple-50 border-purple-500 text-purple-700" :
              "bg-gray-50 border-gray-300 text-gray-600"
            )}>
              <span className="text-gray-400 mr-2 font-bold">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
