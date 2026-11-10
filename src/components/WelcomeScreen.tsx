import React from 'react';
import {
  Code,
  Compass,
  Lightbulb,
  FileSpreadsheet,
  Globe,
  Sparkles,
  Eye,
  Play,
  Volume2,
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    title: 'Code an interactive sandbox',
    prompt:
      'Write a complete, single-file HTML/CSS/JS application for an interactive particle network or mini arcade game with smooth controls and neon animations.',
    tag: 'Interactive Sandbox',
  },
  {
    icon: Compass,
    color: 'from-purple-500 to-pink-500',
    title: 'Explore deep AI reasoning',
    prompt:
      'Compare modern deep reasoning architectures with traditional transformer systems, focusing on multimodal efficiency and chain-of-thought thinking.',
    tag: 'Deep Reasoning',
  },
  {
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-500',
    title: 'Creative brainstorming',
    prompt:
      'Help me brainstorm 5 unique software product concepts that blend spatial computing, edge AI models, and real-time audio translation.',
    tag: 'Ideation',
  },
  {
    icon: FileSpreadsheet,
    color: 'from-emerald-500 to-teal-500',
    title: 'Executive strategic plan',
    prompt:
      'Draft a comprehensive 90-day AI transformation roadmap for an engineering team, with milestones, risks, and measurable KPIs.',
    tag: 'Productivity',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto w-full text-center animate-in fade-in duration-300">
      {/* Radiant Greeting */}
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3 sm:mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NakoLiva AI Studio</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-2">
          <span className="gemini-gradient-text">Hello, I'm Nakoliva AI.</span>
        </h1>
        <p className="text-base sm:text-xl text-[#a8aaa8] font-normal">
          How can I help you today?
        </p>
      </div>

      {/* Suggestion Cards Grid (Responsive CSS Grid) */}
      <div className="grid welcome-grid w-full mb-6 sm:mb-8 text-left">
        {STARTER_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#37393b] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#80868b] px-2 py-0.5 rounded-full bg-[#18191a]">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#a8aaa8] line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#80868b] group-hover:text-white transition-colors">
                <span>Start conversation</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Built-in capabilities badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#80868b]">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18191a] border border-[#282a2c]">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Multimodal Vision</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18191a] border border-[#282a2c]">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live Web Search</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18191a] border border-[#282a2c]">
          <Play className="w-3.5 h-3.5 text-purple-400" />
          <span>Live Code Sandbox</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18191a] border border-[#282a2c]">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Audio Speech Synthesis</span>
        </div>
      </div>
    </div>
  );
};
