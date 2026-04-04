/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Smartphone, ScrollText } from 'lucide-react';
import { ChatMessage, ChatOption, Position, Rumor } from './types';
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
  const oracleQuickActions = [
    {
      label: 'What Next?',
      prompt: 'Byte Baba, look at my progress and tell me exactly what I should do next in Navagram.',
    },
    {
      label: 'Need A Hint',
      prompt: 'Byte Baba, give me a short in-world hint without spoiling everything.',
    },
    {
      label: 'Riddle Me',
      prompt: 'Byte Baba, tell me a short riddle about rumors, trust, or truth.',
    },
    {
      label: 'Village Joke',
      prompt: 'Byte Baba, tell me a clean village joke.',
    },
    {
      label: 'Meme This',
      prompt: 'Byte Baba, give me a text-only meme idea about misinformation in Navagram.',
    },
  ];

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
  const [showPhone, setShowPhone] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOptions, setChatOptions] = useState<ChatOption[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatbotError, setChatbotError] = useState<string | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const clearKeys = () => {
      pressedKeysRef.current.clear();
    };

    window.addEventListener('blur', clearKeys);
    return () => window.removeEventListener('blur', clearKeys);
  }, []);

  // Sync with engine
  useEffect(() => {
    setAgents([...engine.agents]);
    setVerifiedRumors({ ...engine.verifiedRumors });
    setLogs([
      "Navagram Sim initialized. Watch the Brainwashed Meter!",
      "Controls: Move with arrows or WASD, press E to interact, press P to open the phone.",
      "Talk to NPCs to learn rumors.",
    ]);
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

  const handleAgentClick = (agent: Agent) => {
    if (agent.isBackground || gameOver) return; // Cannot interact with background agents

    const isNearby = Math.abs(agent.pos.x - playerPos.x) <= 2 && Math.abs(agent.pos.y - playerPos.y) <= 2;
    if (isNearby) {
      setShowPhone(false);
      setActiveDialogue(agent);
      setDialogueView("main");
      setChatbotError(null);
      setChatInput('');
    } else {
      setLogs(prev => [`You are too far away to talk to ${agent.name}. Move closer!`, ...prev.slice(0, 5)]);
    }
  };

  const isOracle = activeDialogue?.role === 'oracle';

  const knownRumorDetails = playerKnownRumors
    .map((id) => {
      const rumor = RUMORS.find((entry) => entry.id === id);
      if (!rumor) return null;

      const verdict = verifiedRumors[id];
      return {
        id: rumor.id,
        text: rumor.text,
        verified: verdict === undefined ? 'unverified' : verdict ? 'true' : 'false',
      };
    })
    .filter(Boolean);

  const currentObjective = (() => {
    if (day === 1) {
      return `Collect all 5 rumors by talking to villagers. You currently know ${playerKnownRumors.length} of 5.`;
    }

    if (day === 2) {
      return `Visit marked locations and verify all rumors. You have verified ${Object.keys(verifiedRumors).length} of 5 rumors.`;
    }

    return `Use the clue digits you found and unlock the Abandoned Warehouse. You currently have ${collectedClues.length} clue digits.`;
  })();

  const sendOracleMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setChatbotError(null);
    setChatbotLoading(true);
    setChatMessages(prev => [...prev, { sender: 'player', text: trimmed }]);

    try {
      const historyForRequest = [...chatMessagesRef.current, { sender: 'player', text: trimmed }];
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: historyForRequest,
          playerName,
          gameState: {
            day,
            currentObjective,
            playerReputation,
            brainwashedMeter,
            knownRumorsCount: playerKnownRumors.length,
            verifiedRumorsCount: Object.keys(verifiedRumors).length,
            collectedClues,
            playerPosition: playerPos,
            timer: day === 2 ? timeLeft : null,
            knownRumors: knownRumorDetails,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Chatbot request failed.');
      }

      const reply = typeof data?.text === 'string' ? data.text : 'Byte Baba stares into the static and says nothing.';
      setVoiceAvailable(Boolean(data?.speechEnabled));
      setChatMessages(prev => [...prev, { sender: 'npc', text: reply }]);
      setChatOptions(createOracleOptions());
      setLogs(prev => [`Byte Baba replied: ${reply}`, ...prev].slice(0, 500));

      if (speechEnabled && data?.speech?.audioBase64 && data?.speech?.audioMimeType) {
        const binary = atob(data.speech.audioBase64);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const blob = new Blob([bytes], { type: data.speech.audioMimeType });
        const audioUrl = URL.createObjectURL(blob);

        currentAudioRef.current?.pause();
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        }

        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        currentAudioUrlRef.current = audioUrl;

        audio.addEventListener(
          'ended',
          () => {
            if (currentAudioUrlRef.current === audioUrl) {
              URL.revokeObjectURL(audioUrl);
              currentAudioUrlRef.current = null;
            }
          },
          { once: true },
        );

        void audio.play().catch(() => {
          setLogs(prev => ['Byte Baba has a voice ready, but the browser blocked autoplay. Ask again after interacting once.', ...prev].slice(0, 500));
        });
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Chatbot request failed.';
      setChatbotError(messageText);
      setChatMessages(prev => [
        ...prev,
        { sender: 'npc', text: 'My signal is weak right now. Check the Gemini server and try again.' },
      ]);
    } finally {
      setChatbotLoading(false);
    }
  }, [brainwashedMeter, collectedClues, currentObjective, day, knownRumorDetails, playerKnownRumors.length, playerName, playerPos, playerReputation, speechEnabled, timeLeft, verifiedRumors]);

  function createOracleOptions(): ChatOption[] {
    return [
      ...oracleQuickActions.map((action) => ({
        label: action.label,
        onClick: () => sendOracleMessage(action.prompt),
      })),
      { label: 'Back', onClick: () => setDialogueView('main') },
    ];
  }

  const handleTalk = () => {
    if (!activeDialogue) return;

    if (activeDialogue.role === 'oracle') {
      setChatMessages([
        {
          sender: 'npc',
          text: `Ah, ${playerName}. Sit by the edge and speak plainly. I can guide you through Navagram, tell you what to do next, or trade you a riddle, a joke, or a meme spun from village gossip. If my old-man voice is configured, I will speak as well as whisper.`,
        },
      ]);
      setChatOptions(createOracleOptions());
      setDialogueView('chat');
      return;
    }
    
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

  const sendChatInput = useCallback(() => {
    if (!isOracle || chatbotLoading) return;
    const message = chatInput.trim();
    if (!message) return;

    setChatInput('');
    void sendOracleMessage(message);
  }, [chatInput, chatbotLoading, isOracle, sendOracleMessage]);

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

  const movePlayerStep = useCallback(() => {
    if (activeDialogue || gameOver || showPhone || showPinpad) return;

    const pressed = pressedKeysRef.current;
    if (pressed.size === 0) return;

    setPlayerPos(prev => {
      const newPos = { ...prev };

      if (pressed.has('arrowup') || pressed.has('w')) newPos.y = Math.max(0, prev.y - 1);
      else if (pressed.has('arrowdown') || pressed.has('s')) newPos.y = Math.min(MAP_SIZE - 1, prev.y + 1);
      else if (pressed.has('arrowleft') || pressed.has('a')) newPos.x = Math.max(0, prev.x - 1);
      else if (pressed.has('arrowright') || pressed.has('d')) newPos.x = Math.min(MAP_SIZE - 1, prev.x + 1);

      const tile = TILE_MAP[newPos.y][newPos.x];
      if (tile === 2 || tile === 5) return prev;

      return newPos;
    });
  }, [activeDialogue, gameOver, showPhone, showPinpad]);

  const tryInteract = useCallback(() => {
    if (gameOver || showPhone || showPinpad) return;

    if (activeDialogue) {
      if (dialogueView === 'main') {
        handleTalk();
      }
      return;
    }

    const nearestAgent = agents
      .filter((agent) => !agent.isBackground)
      .find((agent) => Math.abs(agent.pos.x - playerPos.x) <= 2 && Math.abs(agent.pos.y - playerPos.y) <= 2);

    if (nearestAgent) {
      handleAgentClick(nearestAgent);
      return;
    }

    const interactableLocation = LOCATIONS.find((loc) => {
      const isInside = playerPos.x >= loc.x && playerPos.x < loc.x + loc.w &&
        playerPos.y >= loc.y && playerPos.y < loc.y + loc.h;

      if (!isInside) return false;
      if (day === 3 && loc.id === 'warehouse') return true;
      return day === 2 && hasUnverifiedRumor(loc.name);
    });

    if (interactableLocation) {
      verifyAtLocation(interactableLocation.id);
      return;
    }

    setLogs(prev => ['Nothing nearby to interact with right now.', ...prev].slice(0, 500));
  }, [activeDialogue, agents, day, dialogueView, gameOver, playerPos, showPhone, showPinpad, verifiedRumors]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      movePlayerStep();
    }, 110);

    return () => window.clearInterval(interval);
  }, [movePlayerStep]);

  // Player Movement and hotkeys
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isTypingTarget = Boolean(
      target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
    );

    if (isTypingTarget) {
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (e.repeat) return;
      if (!activeDialogue && !showPinpad) {
        setShowPhone(prev => !prev);
      }
      return;
    }

    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      if (e.repeat) return;
      tryInteract();
      return;
    }

    if (e.key === 'Escape') {
      if (showPhone) {
        setShowPhone(false);
        return;
      }
      if (activeDialogue) {
        setActiveDialogue(null);
        return;
      }
    }

    const key = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      e.preventDefault();
      pressedKeysRef.current.add(key);
      if (!e.repeat) {
        movePlayerStep();
      }
    }
  }, [activeDialogue, gameOver, showPhone, showPinpad, tryInteract]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    pressedKeysRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1f2937_0%,#09090b_55%,#020617_100%)] text-zinc-100 font-mono selection:bg-emerald-500/30">
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 p-3 sm:p-4 lg:p-6">
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

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-4 lg:p-6">
          <div className="pointer-events-auto mx-auto max-w-6xl">
            <TopBar 
              day={day} 
              getTimeOfDay={getTimeOfDay} 
              brainwashedMeter={brainwashedMeter} 
              playerPos={playerPos} 
              playerReputation={playerReputation} 
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-30 flex gap-3">
          <button
            onClick={() => setShowPhone(true)}
            className="flex items-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/15 px-4 py-3 text-xs font-black uppercase tracking-wide text-sky-100 shadow-xl backdrop-blur-md transition hover:bg-sky-500/25"
          >
            <Smartphone size={16} />
            Open Phone (P)
          </button>
          <button
            onClick={tryInteract}
            className="flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-100 shadow-xl backdrop-blur-md transition hover:bg-emerald-500/25"
          >
            Interact (E)
          </button>
        </div>

        <div className="absolute bottom-4 right-4 z-30 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-950/88 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <ScrollText size={14} className="text-emerald-400" />
              Field Logs
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="max-h-56 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {logs.slice(0, 10).map((log, i) => (
              <div key={i} className={cn(
                "rounded-xl border-l-4 px-3 py-2 text-[10px] shadow-sm",
                log.startsWith("You ") || log.includes("You investigated") || log.includes("You shared") || log.includes("You decided") || log.includes("You are now friends") || log.includes("You need to verify") || log.includes("🕵️") || log.includes("🔍") ? "border-emerald-500 bg-emerald-500/10 text-emerald-100" :
                log.includes("shared") ? "border-blue-500 bg-blue-500/10 text-blue-100" :
                log.includes("verified") ? "border-emerald-500 bg-emerald-500/10 text-emerald-100" :
                log.includes("📢") ? "border-purple-500 bg-purple-500/10 text-purple-100" :
                "border-zinc-600 bg-zinc-900/90 text-zinc-300"
              )}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AgentPhone 
        collectedClues={collectedClues} 
        playerKnownRumors={playerKnownRumors} 
        verifiedRumors={verifiedRumors} 
        isOpen={showPhone}
        onClose={() => setShowPhone(false)}
      />

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
        isChatbot={isOracle}
        chatbotLoading={chatbotLoading}
        chatbotError={chatbotError}
        chatInput={chatInput}
        setChatInput={setChatInput}
        sendChatInput={sendChatInput}
        playerName={playerName}
        speechEnabled={speechEnabled}
        setSpeechEnabled={setSpeechEnabled}
        voiceAvailable={voiceAvailable}
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
