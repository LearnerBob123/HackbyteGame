import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Agent } from '../models/Agent';

interface DialogueModalProps {
  activeDialogue: Agent | null;
  setActiveDialogue: (agent: Agent | null) => void;
  dialogueView: "main" | "share" | "fact-check" | "chat" | "pinpad";
  setDialogueView: (view: "main" | "share" | "fact-check" | "chat" | "pinpad") => void;
  handleTalk: () => void;
  chatMessages: {sender: 'npc'|'player', text: string}[];
  chatOptions: {label: string, onClick: () => void}[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function DialogueModal({
  activeDialogue,
  setActiveDialogue,
  dialogueView,
  setDialogueView,
  handleTalk,
  chatMessages,
  chatOptions,
  chatEndRef
}: DialogueModalProps) {
  return (
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
  );
}
