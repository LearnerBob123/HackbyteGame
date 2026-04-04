import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Keyboard, MessageCircleMore, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { Position } from '../types';
import { Agent } from '../models/Agent';
import { LOCATIONS } from '../data/locations';
import { RUMORS } from '../data/rumors';
import { MAP_SIZE, TILE_MAP } from '../data/map';
import { SimulationEngine } from '../models/Simulation';

const TILE_SIZE = 56;
const WORLD_SIZE = MAP_SIZE * TILE_SIZE;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateSize = () => {
      setViewportSize({ width: element.clientWidth, height: element.clientHeight });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const targetCamera = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) {
      return { x: 0, y: 0 };
    }

    const playerPixelX = (playerPos.x + 0.5) * TILE_SIZE;
    const playerPixelY = (playerPos.y + 0.5) * TILE_SIZE;

    return {
      x: clamp(viewportSize.width / 2 - playerPixelX, viewportSize.width - WORLD_SIZE, 0),
      y: clamp(viewportSize.height / 2 - playerPixelY, viewportSize.height - WORLD_SIZE, 0),
    };
  }, [playerPos.x, playerPos.y, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) {
      return;
    }

    let frameId = 0;

    const animate = () => {
      const current = cameraRef.current;
      const nextX = current.x + (targetCamera.x - current.x) * 0.16;
      const nextY = current.y + (targetCamera.y - current.y) * 0.16;

      const snappedX = Math.abs(targetCamera.x - nextX) < 0.35 ? targetCamera.x : nextX;
      const snappedY = Math.abs(targetCamera.y - nextY) < 0.35 ? targetCamera.y : nextY;
      const next = { x: snappedX, y: snappedY };

      cameraRef.current = next;
      setCamera(next);

      if (snappedX !== targetCamera.x || snappedY !== targetCamera.y) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [targetCamera, viewportSize.height, viewportSize.width]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border-4 border-zinc-800 bg-[#8ecf5c] shadow-2xl shadow-emerald-950/40" ref={viewportRef}>
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: WORLD_SIZE,
          height: WORLD_SIZE,
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0)`,
        }}
      >
        <div
          className="grid absolute inset-0"
          style={{
            width: WORLD_SIZE,
            height: WORLD_SIZE,
            gridTemplateColumns: `repeat(${MAP_SIZE}, ${TILE_SIZE}px)`,
            gridTemplateRows: `repeat(${MAP_SIZE}, ${TILE_SIZE}px)`,
          }}
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
                left: loc.x * TILE_SIZE,
                top: loc.y * TILE_SIZE,
                width: loc.w * TILE_SIZE,
                height: loc.h * TILE_SIZE,
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

        {RUMORS.map(rumor => {
          if (verifiedRumors[rumor.id] !== undefined) return null;
          const loc = engine.rumorLocations[rumor.id];
          if (!loc) return null;
          
          return (
            <div
              key={`pin-${rumor.id}`}
              className="absolute flex h-10 w-10 items-center justify-center z-20 group"
              style={{ left: loc.x * TILE_SIZE - 20, top: loc.y * TILE_SIZE - 28 }}
            >
              <MapPin className="text-red-600 animate-bounce drop-shadow-md" size={22} />
              <div className="absolute -top-6 bg-white text-black text-[8px] px-1.5 py-0.5 rounded border-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 font-bold shadow-sm">
                Investigate: {loc.name}
              </div>
            </div>
          );
        })}

        {agents.map(agent => (
          <motion.div
            key={agent.id}
            animate={{ left: agent.pos.x * TILE_SIZE + TILE_SIZE / 2, top: agent.pos.y * TILE_SIZE + TILE_SIZE / 2 }}
            className={cn("absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center z-10 group", !agent.isBackground && "cursor-pointer")}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
            onClick={() => handleAgentClick(agent)}
          >
            {!agent.isBackground && (
              <div className="absolute -top-6 bg-white border-2 border-gray-400 text-black text-[8px] font-bold px-1 rounded-sm shadow-sm whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {agent.role === 'oracle' ? 'AI: ✨' : `${agent.name.substring(0,2)}: 💬`}
              </div>
            )}
            <div className={cn("relative h-6 w-6 transition-transform", !agent.isBackground && "hover:scale-110")}>
              <div className={cn(
                "absolute left-2 top-0 h-3 w-3 rounded-full border border-black z-10",
                agent.role === 'oracle' ? 'bg-[#fde68a]' : 'bg-[#fcd5b4]'
              )}></div>
              <div
                className={cn(
                  "absolute bottom-0 left-1 h-4 w-4 rounded-t-sm border border-black",
                  agent.role === 'oracle' && 'shadow-[0_0_8px_rgba(20,184,166,0.8)]'
                )}
                style={{ backgroundColor: agent.color }}
              ></div>
            </div>
          </motion.div>
        ))}

        <motion.div
          animate={{ left: playerPos.x * TILE_SIZE + TILE_SIZE / 2, top: playerPos.y * TILE_SIZE + TILE_SIZE / 2 }}
          className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center z-20"
          transition={{ duration: 0.11, ease: 'linear' }}
        >
          <div className="absolute -top-6 bg-emerald-100 border-2 border-emerald-500 text-emerald-900 text-[8px] font-bold px-1 rounded-sm shadow-sm whitespace-nowrap z-20">
            AGENT {playerName.toUpperCase()}
          </div>
          <div className="relative h-7 w-7">
            <div className="absolute left-2 top-0 h-3 w-3 rounded-full bg-[#fcd5b4] border-2 border-emerald-500 z-10">
              <div className="absolute -left-0.5 -top-1 h-2 w-4 bg-emerald-600 rounded-t-full"></div>
            </div>
            <div className="absolute bottom-0 left-1 h-4 w-4 rounded-t-sm border-2 border-emerald-500 bg-emerald-500"></div>
          </div>
        </motion.div>

      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(9,9,11,0.18)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />

      <div className="absolute bottom-4 left-4 z-30 flex flex-wrap gap-2">
        <div className="bg-[#f8f9fa]/95 px-3 py-2 rounded-xl border-2 border-[#cbd5e1] flex items-center gap-3 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-1">
            <div /> <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowUp size={12} /></div> <div />
            <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowLeft size={12} /></div>
            <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowDown size={12} /></div>
            <div className="p-1 bg-white border border-gray-300 rounded shadow-sm text-gray-600"><ArrowRight size={12} /></div>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Move</span>
        </div>
        <div className="bg-[#f8f9fa]/95 px-3 py-2 rounded-xl border-2 border-[#cbd5e1] flex items-center gap-2 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700">
            <Keyboard size={12} />
            <span className="text-[10px] font-black">E</span>
          </div>
          <MessageCircleMore size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Interact</span>
        </div>
        <div className="bg-[#f8f9fa]/95 px-3 py-2 rounded-xl border-2 border-[#cbd5e1] flex items-center gap-2 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700">
            <Keyboard size={12} />
            <span className="text-[10px] font-black">P</span>
          </div>
          <Smartphone size={14} className="text-sky-600" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">Phone</span>
        </div>
      </div>
    </div>
  );
}
