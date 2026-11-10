import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  ChevronDown,
  Globe,
  Sliders,
  Plus,
  Brain,
  Check,
} from 'lucide-react';
import { ModelOption } from '../types';
import { NakoLivaLogo } from './NakoLivaLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  models: ModelOption[];
  enableSearch: boolean;
  onToggleSearch: () => void;
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  onSelectThinkingLevel: (level: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  onOpenPersona: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  selectedModel,
  onSelectModel,
  models,
  enableSearch,
  onToggleSearch,
  thinkingLevel,
  onSelectThinkingLevel,
  onOpenPersona,
  onNewChat,
}) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isThinkingMenuOpen, setIsThinkingMenuOpen] = useState(false);

  const currentModel = models.find((m) => m.id === selectedModel) || {
    id: 'gemini-3.1-flash-lite',
    name: 'NakoLiva Flash Lite',
    tagline: 'Ultra-fast, instant responses for conversation & coding',
    category: 'Speed Optimized',
    isDefault: true,
    supportsGrounding: true,
    supportsThinking: false,
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#131314]/90 backdrop-blur-md border-b border-[#282a2c]">
      {/* Left section: Hamburger & NakoLiva Brand & Model Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors cursor-pointer"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Gemini Brand & Model Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#1e1f20] border border-transparent hover:border-[#37393b] transition-all cursor-pointer"
          >
            {/* NakoLiva Brand & Model Switcher */}
            <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-[#1e2230] to-[#12141c] border border-blue-500/30 flex items-center justify-center p-1 shadow-md shadow-blue-500/10">
              <NakoLivaLogo className="w-full h-full" />
            </div>
            <div className="flex items-center gap-1.5 text-left">
              <span className="font-semibold text-white text-sm sm:text-base tracking-tight">
                NakoLiva
              </span>
              <span className="text-xs text-blue-400 font-medium hidden sm:inline">
                {currentModel.name}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#80868b]" />
          </button>

          {/* Model selection dropdown menu */}
          {isModelMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#1e1f20] border border-[#37393b] rounded-2xl shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#80868b] border-b border-[#282a2c] mb-1">
                Select Intelligence Model
              </div>
              <div className="space-y-1">
                {models.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                          : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{model.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#37393b] text-[#a8aaa8]">
                            {model.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#80868b] mt-0.5 leading-snug">
                          {model.tagline}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Reasoning Level, Search Grounding, Persona, New Chat */}
      <div className="flex items-center gap-2">
        {/* Thinking / Reasoning Dropdown */}
        {currentModel.supportsThinking && (
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsThinkingMenuOpen(!isThinkingMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#37393b] text-xs font-medium text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
              title="Reasoning / Thinking depth"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Thinking: {thinkingLevel}</span>
              <ChevronDown className="w-3 h-3 text-[#80868b]" />
            </button>

            {isThinkingMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[#1e1f20] border border-[#37393b] rounded-xl shadow-xl py-1 z-30">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      onSelectThinkingLevel(level);
                      setIsThinkingMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      thinkingLevel === level
                        ? 'bg-purple-500/20 text-purple-300 font-semibold'
                        : 'text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white'
                    }`}
                  >
                    <span>{level} Reasoning</span>
                    {thinkingLevel === level && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Grounding Quick Toggle */}
        <button
          type="button"
          onClick={onToggleSearch}
          title={enableSearch ? 'Google Search Grounding active' : 'Enable Search Grounding'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            enableSearch
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'bg-[#1e1f20] hover:bg-[#282a2c] border border-[#37393b] text-[#80868b] hover:text-[#c4c7c5]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* System Instructions / Persona modal button */}
        <button
          type="button"
          onClick={onOpenPersona}
          title="System Instructions & Personas"
          className="p-2 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#37393b] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          title="Start new chat"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New chat</span>
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md ml-1 select-none">
          L
        </div>
      </div>
    </header>
  );
};
