/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  Search, 
  ShieldAlert, 
  MessageSquare, 
  HelpCircle, 
  Activity,
  Monitor,
  MapPin,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  Heart,
  Share2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Position, Rumor, RUMORS, MAP_SIZE, DIALOGUE_FLAVOR, LOCATIONS, TILE_MAP, DAY_2_TIMER_LIMIT } from './types';
import { Agent } from './models/Agent';
import { SimulationEngine } from './models/Simulation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // The engine is the source of truth
  const [engine] = useState(() => new SimulationEngine());
  const [tick, setTick] = useState(0); // For forcing re-renders
  
  // We mirror some state for React reactivity
  const [agents, setAgents] = useState<Agent[]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 10, y: 10 });
  const [playerKnownRumors, setPlayerKnownRumors] = useState<string[]>([]);
  const [playerReputation, setPlayerReputation] = useState(50);
  const [brainwashedMeter, setBrainwashedMeter] = useState(0);
  const [verifiedRumors, setVerifiedRumors] = useState<Record<string, boolean>>({});
  const [day, setDay] = useState(1);
  const [showDayTransition, setShowDayTransition] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  
  // Player info
  const [playerName, setPlayerName] = useState("Mahabali");
  const [tempName, setTempName] = useState("Mahabali");
  
  // Day 2 Timer
  const [timeLeft, setTimeLeft] = useState(DAY_2_TIMER_LIMIT);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [activeDialogue, setActiveDialogue] = useState<Agent | null>(null);
  const [dialogueView, setDialogueView] = useState<"main" | "share" | "fact-check" | "chat">("main");
  
  const [chatMessages, setChatMessages] = useState<{sender: 'npc'|'player', text: string}[]>([]);
  const [chatOptions, setChatOptions] = useState<{label: string, onClick: () => void}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Sync with engine
  useEffect(() => {
    setAgents([...engine.agents]);
    setVerifiedRumors({ ...engine.verifiedRumors });
    setLogs(["Navagram Sim initialized. Watch the Brainwashed Meter!", "Talk to NPCs to learn rumors."]);
  }, [engine]);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameStarted || gameOver) return;
      const gossip = engine.step(activeDialogue?.id);
      setAgents([...engine.agents]);
      if (gossip.length > 0) {
        setLogs(prev => [...gossip, ...prev].slice(0, 500));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [engine, activeDialogue, gameStarted, gameOver]);

  // Day 2 Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && day === 2 && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver("lose");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, day, gameOver]);

  // Brainwashed Meter Logic
  useEffect(() => {
    if (day === 1) {
      setBrainwashedMeter((playerKnownRumors.length / 5) * 100);
    }
  }, [playerKnownRumors.length, day]);

  // Day Progression Logic
  useEffect(() => {
    if (day === 1 && playerKnownRumors.length >= 5) {
      setShowDayTransition(true);
      setTimeout(() => {
        setDay(2);
        engine.day = 2;
        setLogs(prev => [
          "DAY 2 STARTED: You have collected all the whispers. Now, explore the village and verify these claims at their respective locations!",
          "DAY 1 COMPLETE: All hints collected.",
          ...prev
        ]);
        setTimeout(() => {
          setShowDayTransition(false);
        }, 2000);
      }, 2000);
    }
  }, [playerKnownRumors.length, day, engine]);

  // Win Condition
  useEffect(() => {
    if (day === 2 && Object.keys(verifiedRumors).length === 5 && !gameOver) {
      setGameOver("win");
    }
  }, [verifiedRumors, day, gameOver]);

  const getTimeOfDay = () => {
    if (day > 1) return `⌛ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
    const count = playerKnownRumors.length;
    if (count === 0) return "🌅 Morning";
    if (count === 1 || count === 2) return "☀️ Afternoon";
    if (count === 3 || count === 4) return "🌇 Evening";
    return "🌙 Night";
  };

  // Player Movement
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activeDialogue || gameOver) return;

    setPlayerPos(prev => {
      const newPos = { ...prev };
      if (e.key === 'ArrowUp' || e.key === 'w') newPos.y = Math.max(0, prev.y - 1);
      if (e.key === 'ArrowDown' || e.key === 's') newPos.y = Math.min(MAP_SIZE - 1, prev.y + 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') newPos.x = Math.max(0, prev.x - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') newPos.x = Math.min(MAP_SIZE - 1, prev.x + 1);
      
      const tile = TILE_MAP[newPos.y][newPos.x];
      if (tile === 2 || tile === 5) return prev; // Block movement
      
      return newPos;
    });
  }, [activeDialogue, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleAgentClick = (agent: Agent) => {
    if (agent.isBackground || gameOver) return; // Cannot interact with background agents

    const isNearby = Math.abs(agent.pos.x - playerPos.x) <= 2 && Math.abs(agent.pos.y - playerPos.y) <= 2;
    if (isNearby) {
      setActiveDialogue(agent);
      setDialogueView("main");
    } else {
      setLogs(prev => [`You are too far away to talk to ${agent.name}. Move closer!`, ...prev.slice(0, 5)]);
    }
  };

  const handleTalk = () => {
    if (!activeDialogue) return;
    
    setAgents([...engine.agents]);

    const unknownRumors = activeDialogue.knownRumors.filter(id => !playerKnownRumors.includes(id));
    const flavor = DIALOGUE_FLAVOR[Math.floor(Math.random() * DIALOGUE_FLAVOR.length)];
    
    let rumorToShare: Rumor | undefined;
    if (unknownRumors.length > 0) {
      const rumorId = unknownRumors[Math.floor(Math.random() * unknownRumors.length)];
      rumorToShare = RUMORS.find(r => r.id === rumorId);
    } else if (activeDialogue.knownRumors.length > 0 && Math.random() > 0.5) {
      const rumorId = activeDialogue.knownRumors[Math.floor(Math.random() * activeDialogue.knownRumors.length)];
      rumorToShare = RUMORS.find(r => r.id === rumorId);
    }

    if (rumorToShare && !playerKnownRumors.includes(rumorToShare.id)) {
      setPlayerKnownRumors(prev => [...prev, rumorToShare!.id]);
      setLogs(prev => [`${activeDialogue.name} shared a hint: "${rumorToShare!.text}"`, ...prev].slice(0, 500));
    }

    setChatMessages([
      { sender: 'player', text: "Hey, what's going on?" },
      { sender: 'npc', text: rumorToShare ? `${flavor} Did you hear? ${rumorToShare.text}` : "Nothing much happening right now." }
    ]);
    
    setChatOptions([
      { label: "Interesting...", onClick: () => endChat("Interesting...", "Yeah, makes you think.") },
      { label: "I don't believe it.", onClick: () => endChat("I don't believe it.", "Suit yourself.") },
      { label: "End Talk", onClick: () => setDialogueView("main") }
    ]);
    
    setDialogueView("chat");
  };

  const endChat = (playerReply: string, npcReply: string) => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'player', text: playerReply },
      { sender: 'npc', text: npcReply }
    ]);
    setChatOptions([
      { label: "End Talk", onClick: () => setDialogueView("main") }
    ]);
  };

  const verifyAtLocation = (locId: string) => {
    const loc = LOCATIONS.find(l => l.id === locId);
    if (!loc) return;

    const isInside = playerPos.x >= loc.x && playerPos.x < loc.x + loc.w && 
                    playerPos.y >= loc.y && playerPos.y < loc.y + loc.h;

    if (!isInside) {
      setLogs(prev => [`You must be inside the ${loc.name} to verify rumors!`, ...prev].slice(0, 500));
      return;
    }

    const unverifiedRumorsAtLoc = RUMORS.filter(r => {
      const rumorLoc = engine.rumorLocations[r.id];
      return rumorLoc && rumorLoc.name === loc.name && verifiedRumors[r.id] === undefined;
    });

    if (unverifiedRumorsAtLoc.length > 0) {
      unverifiedRumorsAtLoc.forEach(rumor => {
        const result = engine.investigate(rumor.id);
        setVerifiedRumors({ ...engine.verifiedRumors });
        setLogs(prev => [result.message, ...prev].slice(0, 500));
        setPlayerReputation(prev => Math.min(100, prev + 5));
        setBrainwashedMeter(prev => Math.max(0, prev - 20));
      });
      setTick(t => t + 1);
    } else {
      setLogs(prev => [`Nothing new to verify at ${loc.name}.`, ...prev].slice(0, 500));
    }
  };

  const isCafe = (x: number, y: number) => {
    const cafe = LOCATIONS.find(l => l.id === 'cafe');
    if (!cafe) return false;
    return x >= cafe.x && x < cafe.x + cafe.w && y >= cafe.y && y < cafe.y + cafe.h;
  };

  const hasUnverifiedRumor = (locName: string) =>
    RUMORS.some(r => {
      const loc = engine.rumorLocations[r.id];
      return loc && loc.name === locName && verifiedRumors[r.id] === undefined;
    });

  const handleStartGame = () => {
    setPlayerName(tempName || "Mahabali");
    setGameStarted(true);
  };

  if (!gameStarted) {
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

  if (gameOver) {
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
              {gameOver === "win" ? "Navagram is Saved!" : "Navagram has fallen to Misinformation"}
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
              <span className="text-xl font-black italic uppercase">{Object.keys(verifiedRumors).length} / 5</span>
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 font-mono selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Game Map Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-t-xl border-x border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <h1 className="text-xl font-black tracking-tighter uppercase italic">Navagram Sim v3.0</h1>
                </div>
                <p className="text-zinc-400 text-[10px] font-bold mt-1 uppercase">Role: Truthseeker | Day {day} | {getTimeOfDay()}</p>
              </div>
              
              <div className="hidden md:flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-full border border-zinc-800">
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
            
            <div className="flex gap-4 text-xs font-bold text-zinc-500">
              <div className="flex items-center gap-1"><User size={14} /> POS: {playerPos.x},{playerPos.y}</div>
              <div className="flex items-center gap-1"><Heart size={14} className="text-red-500" /> REP: {playerReputation}</div>
            </div>
          </div>

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

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#f8f9fa] border-4 border-[#cbd5e1] rounded-xl flex flex-col h-[400px] shadow-lg text-black font-sans">
            <div className="p-4 border-b-4 border-[#cbd5e1] bg-[#e2e8f0] flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold uppercase text-gray-700">AGENT PHONE 📱</h3>
            </div>
            <div className="flex-1 p-4">
              {playerKnownRumors.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <Search size={24} className="opacity-50" />
                  <p className="text-xs font-bold uppercase text-center">Talk to villagers at Chai Nashta Point to collect rumors</p>
                </div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
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
      </div>

      <AnimatePresence>
        {showDayTransition && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-6xl font-black text-white tracking-widest uppercase"
            >
              DAY 2: THE TRUTH
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeDialogue && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[#f8f9fa] border-4 border-[#cbd5e1] rounded-xl shadow-2xl overflow-hidden text-black font-sans">
              <div className="p-4 bg-[#e2e8f0] flex items-center justify-between border-b-4 border-[#cbd5e1]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 relative">
                    <div className="absolute top-0 left-1 w-3 h-3 rounded-full bg-[#fcd5b4] border border-black z-10"></div>
                    <div className="absolute bottom-0 left-0 w-5 h-4 rounded-t-sm border border-black" style={{ backgroundColor: activeDialogue.color }}></div>
                  </div>
                  <span className="font-bold text-sm">[{activeDialogue.name}]</span>
                </div>
                <button onClick={() => setActiveDialogue(null)} className="text-gray-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 bg-white">
                {dialogueView === "main" ? (
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={handleTalk} className="flex flex-col items-center gap-2 p-4 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-xl transition-all group shadow-sm">
                      <MessageSquare size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase text-gray-700">Talk</span>
                    </button>
                  </div>
                ) : dialogueView === "chat" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Conversation</span>
                      <button onClick={() => setDialogueView("main")} className="text-[10px] text-blue-600 hover:underline font-bold">Back</button>
                    </div>
                    <div className="h-[200px] overflow-y-auto space-y-3 custom-scrollbar pr-2 flex flex-col">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={cn(
                          "p-3 rounded-xl max-w-[85%] text-xs border border-gray-200 shadow-sm",
                          msg.sender === 'npc' ? "bg-gray-100 self-start rounded-tl-sm text-gray-800" : "bg-blue-500 self-end rounded-tr-sm text-white border-blue-600"
                        )}>
                          {msg.text}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t-2 border-gray-200">
                      {chatOptions.map((opt, i) => (
                        <button key={i} onClick={opt.onClick} className="p-3 bg-white hover:bg-gray-50 rounded-lg text-[10px] border-2 border-gray-200 transition-colors text-left font-bold text-gray-700 shadow-sm">
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </div>
  );
}
