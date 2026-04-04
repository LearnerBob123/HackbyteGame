/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Position, Rumor } from './types';
import { RUMORS } from './data/rumors';
import { LOCATIONS } from './data/locations';
import { MAP_SIZE, TILE_MAP } from './data/map';
import { DIALOGUE_FLAVOR } from './data/dialogue';
import { DAY_2_TIMER_LIMIT } from './data/config';
import { Agent } from './models/Agent';
import { SimulationEngine } from './models/Simulation';
import { cn } from './lib/utils';

// Components
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { TopBar } from './components/TopBar';
import { GameMap } from './components/GameMap';
import { AgentPhone } from './components/AgentPhone';
import { DayTransition } from './components/DayTransition';
import { PinpadModal } from './components/PinpadModal';
import { DialogueModal } from './components/DialogueModal';

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
  const [collectedClues, setCollectedClues] = useState<string[]>([]);
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
  const [dialogueView, setDialogueView] = useState<"main" | "share" | "fact-check" | "chat" | "pinpad">("main");
  const [showPinpad, setShowPinpad] = useState(false);
  
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
    } else if (day === 2 && Object.keys(verifiedRumors).length === 5) {
      setShowDayTransition(true);
      setTimeout(() => {
        setDay(3);
        engine.day = 3;
        setLogs(prev => [
          "🚨 BIG RED ALERT: The villain is tampering with the whole database of villagers! The Abandoned Warehouse is locked. You need to unlock it using the clues you found!",
          "DAY 3 STARTED: Stop the villain at the Abandoned Warehouse!",
          ...prev
        ]);
        setTimeout(() => {
          setShowDayTransition(false);
        }, 2000);
      }, 2000);
    }
  }, [playerKnownRumors.length, verifiedRumors, day, engine]);

  // Win Condition
  useEffect(() => {
    // Win condition is now handled by the PIN pad in Day 3
  }, []);

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

    if (day === 3 && locId === 'warehouse') {
      setShowPinpad(true);
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
        
        // Add clue
        if (loc.clue && !collectedClues.includes(loc.clue)) {
          setCollectedClues(prev => [...prev, loc.clue!]);
          setLogs(prev => [`You found a hidden number clue: [${loc.clue}]`, result.message, ...prev].slice(0, 500));
        } else {
          setLogs(prev => [result.message, ...prev].slice(0, 500));
        }
        
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
      <StartScreen 
        tempName={tempName} 
        setTempName={setTempName} 
        handleStartGame={handleStartGame} 
      />
    );
  }

  if (gameOver) {
    return (
      <GameOverScreen 
        gameOver={gameOver} 
        playerName={playerName} 
        playerReputation={playerReputation} 
        verifiedRumorsCount={Object.keys(verifiedRumors).length} 
        brainwashedMeter={brainwashedMeter} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 font-mono selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Game Map Section */}
        <div className="lg:col-span-8 space-y-4">
          <TopBar 
            day={day} 
            getTimeOfDay={getTimeOfDay} 
            brainwashedMeter={brainwashedMeter} 
            playerPos={playerPos} 
            playerReputation={playerReputation} 
          />

          <GameMap 
            playerPos={playerPos} 
            agents={agents} 
            verifiedRumors={verifiedRumors} 
            engine={engine} 
            day={day} 
            hasUnverifiedRumor={hasUnverifiedRumor} 
            verifyAtLocation={verifyAtLocation} 
            handleAgentClick={handleAgentClick} 
            playerName={playerName} 
          />
        </div>

        <AgentPhone 
          collectedClues={collectedClues} 
          playerKnownRumors={playerKnownRumors} 
          verifiedRumors={verifiedRumors} 
          logs={logs} 
        />
      </div>

      <DayTransition showDayTransition={showDayTransition} day={day} />

      <PinpadModal 
        showPinpad={showPinpad} 
        setShowPinpad={setShowPinpad} 
        setGameOver={setGameOver} 
        setLogs={setLogs} 
      />

      <DialogueModal 
        activeDialogue={activeDialogue} 
        setActiveDialogue={setActiveDialogue} 
        dialogueView={dialogueView} 
        setDialogueView={setDialogueView} 
        handleTalk={handleTalk} 
        chatMessages={chatMessages} 
        chatOptions={chatOptions} 
        chatEndRef={chatEndRef} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </div>
  );
}
