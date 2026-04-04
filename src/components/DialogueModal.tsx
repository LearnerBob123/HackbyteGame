import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoaderCircle, MessageSquare, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Agent } from '../models/Agent';
import { ChatMessage, ChatOption } from '../types';

interface DialogueModalProps {
  activeDialogue: Agent | null;
  setActiveDialogue: (agent: Agent | null) => void;
  dialogueView: "main" | "share" | "fact-check" | "chat" | "pinpad";
  setDialogueView: (view: "main" | "share" | "fact-check" | "chat" | "pinpad") => void;
  handleTalk: () => void;
  chatMessages: ChatMessage[];
  chatOptions: ChatOption[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  isChatbot: boolean;
  chatbotLoading: boolean;
  chatbotError: string | null;
  chatInput: string;
  setChatInput: (value: string) => void;
  sendChatInput: () => void;
  playerName: string;
  speechEnabled: boolean;
  setSpeechEnabled: (value: boolean) => void;
  voiceAvailable: boolean;
}

export function DialogueModal({
  activeDialogue,
  setActiveDialogue,
  dialogueView,
  setDialogueView,
  handleTalk,
  chatMessages,
  chatOptions,
  chatEndRef,
  isChatbot,
  chatbotLoading,
  chatbotError,
  chatInput,
  setChatInput,
  sendChatInput,
  playerName,
  speechEnabled,
  setSpeechEnabled,
  voiceAvailable
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
                    {isChatbot ? (
                      <Sparkles size={24} className="text-teal-500 group-hover:scale-110 transition-transform" />
                    ) : (
                      <MessageSquare size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[10px] font-bold uppercase text-gray-700">{isChatbot ? 'Talk To Byte Baba' : 'Talk'}</span>
                  </button>
                  {isChatbot && activeDialogue?.intro && (
                    <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-3 text-xs text-teal-900 shadow-sm leading-relaxed">
                      {activeDialogue.intro}
                    </div>
                  )}
                </div>
              ) : dialogueView === "chat" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">{isChatbot ? 'Whispers At The Edge' : 'Conversation'}</div>
                      {isChatbot && activeDialogue?.title && (
                        <div className="text-[11px] font-semibold text-teal-700">{activeDialogue.title}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isChatbot && (
                        <button
                          onClick={() => setSpeechEnabled(!speechEnabled)}
                          className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700"
                          title={voiceAvailable ? 'Toggle Byte Baba voice playback' : 'Configure ElevenLabs to enable Byte Baba voice playback'}
                        >
                          {speechEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                          {voiceAvailable ? (speechEnabled ? 'Voice On' : 'Voice Off') : 'Voice Setup'}
                        </button>
                      )}
                      <button onClick={() => setDialogueView("main")} className="text-[10px] text-blue-600 hover:underline font-bold">Back</button>
                    </div>
                  </div>
                  <div className="h-[260px] overflow-y-auto space-y-4 custom-scrollbar pr-2 flex flex-col rounded-xl bg-gradient-to-b from-slate-50 to-white p-3 border border-slate-200">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex max-w-[88%] flex-col gap-1", msg.sender === 'npc' ? 'self-start items-start' : 'self-end items-end')}>
                        <span className={cn(
                          "px-2 text-[10px] font-black uppercase tracking-wide",
                          msg.sender === 'npc' ? 'text-teal-700' : 'text-blue-700'
                        )}>
                          {msg.sender === 'npc' ? activeDialogue.name : playerName}
                        </span>
                        <div className={cn(
                          "p-3 rounded-2xl max-w-full text-xs border shadow-sm leading-relaxed",
                          msg.sender === 'npc'
                            ? "bg-white self-start rounded-tl-sm text-gray-800 border-teal-200"
                            : "bg-blue-500 self-end rounded-tr-sm text-white border-blue-600"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatbotLoading && (
                      <div className="flex max-w-[88%] flex-col gap-1 self-start items-start">
                        <span className="px-2 text-[10px] font-black uppercase tracking-wide text-teal-700">{activeDialogue.name}</span>
                        <div className="p-3 rounded-2xl max-w-full text-xs border border-teal-200 shadow-sm bg-teal-50 self-start rounded-tl-sm text-teal-900 flex items-center gap-2 leading-relaxed">
                          <LoaderCircle size={14} className="animate-spin" />
                          Byte Baba strokes his beard of static and considers your question...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {chatbotError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">
                      {chatbotError}
                    </div>
                  )}
                  {isChatbot && !voiceAvailable && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800">
                      Add ElevenLabs API settings on the backend to let Byte Baba speak with an old-man voice.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-gray-200">
                    {chatOptions.map((opt, i) => (
                      <button key={i} onClick={opt.onClick} disabled={chatbotLoading} className="p-3 bg-white hover:bg-gray-50 rounded-lg text-[10px] border-2 border-gray-200 transition-colors text-left font-bold text-gray-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {isChatbot && (
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <input
                        value={chatInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            sendChatInput();
                          }
                        }}
                        placeholder="Ask Byte Baba what to do next, where to go, or for a riddle"
                        className="flex-1 rounded-lg border-2 border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-teal-400"
                      />
                      <button
                        onClick={sendChatInput}
                        disabled={chatbotLoading || !chatInput.trim()}
                        className="rounded-lg bg-teal-500 px-3 py-2 text-[10px] font-bold uppercase text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
