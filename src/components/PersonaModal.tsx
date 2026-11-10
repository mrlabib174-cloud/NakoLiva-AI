import React, { useState } from 'react';
import { X, Sparkles, Check, Terminal, BookOpen, Compass, FileText, User } from 'lucide-react';

interface PersonaModalProps {
  currentInstruction?: string;
  onSave: (instruction: string) => void;
  onClose: () => void;
}

const PRESETS = [
  {
    id: 'default',
    title: 'Helpful Assistant',
    description: 'Balanced, conversational, objective, and deeply knowledgeable.',
    icon: Sparkles,
    prompt: '',
  },
  {
    id: 'coder',
    title: 'Senior Software Engineer',
    description: 'Expert coding mentor. Clean, production-ready code, strict types, and robust architectures.',
    icon: Terminal,
    prompt:
      'You are a senior full-stack engineer and software architect. Provide clean, secure, production-grade code, concise explanations, and modern best practices.',
  },
  {
    id: 'writer',
    title: 'Creative Storyteller',
    description: 'Engaging, vivid narratives, witty prose, and captivating tone.',
    icon: BookOpen,
    prompt:
      'You are a master creative writer and essayist. Use evocative language, vivid sensory details, emotional resonance, and thoughtful pacing.',
  },
  {
    id: 'analyst',
    title: 'Concise Analyst',
    description: 'Executive summaries, bulleted insights, data-focused, no preamble.',
    icon: FileText,
    prompt:
      'You are an executive analyst. Respond in concise bullet points, highlighting key takeaways, metrics, and actionable recommendations without fluff.',
  },
  {
    id: 'tutor',
    title: 'Socratic Tutor',
    description: 'Asks guiding questions to stimulate deep understanding and conceptual thinking.',
    icon: Compass,
    prompt:
      'You are an empathetic Socratic tutor. Guide the learner to uncover solutions on their own through clear questions, bite-sized analogies, and positive feedback.',
  },
];

export const PersonaModal: React.FC<PersonaModalProps> = ({
  currentInstruction = '',
  onSave,
  onClose,
}) => {
  const [instruction, setInstruction] = useState(currentInstruction);

  const applyPreset = (prompt: string) => {
    setInstruction(prompt);
  };

  const handleSave = () => {
    onSave(instruction.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl bg-[#1e1f20] border border-[#37393b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#282a2c] border-b border-[#37393b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">System Instructions & Personas</h3>
              <p className="text-xs text-[#a8aaa8]">Customize how NakoLiva responds across this conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-white hover:bg-[#37393b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#a8aaa8] block mb-3">
              Preset Styles
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = instruction === p.prompt;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.prompt)}
                    className={`flex items-start gap-3 p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-white'
                        : 'bg-[#18191a] border-[#37393b] text-[#c4c7c5] hover:border-[#4f5255] hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                        isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-[#a8aaa8]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center justify-between">
                        {p.title}
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-[#a8aaa8] leading-tight mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#a8aaa8] block mb-2">
              Custom System Prompt
            </label>
            <textarea
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Always respond in markdown with bullet points and practical code examples..."
              className="w-full px-4 py-3 bg-[#131314] border border-[#37393b] rounded-xl text-sm text-[#e3e3e3] placeholder-[#80868b] focus:outline-none focus:border-blue-500 transition-colors resize-none font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#282a2c] border-t border-[#37393b]">
          <button
            onClick={() => setInstruction('')}
            className="px-4 py-2 text-xs font-medium text-[#c4c7c5] hover:text-white transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md"
          >
            Apply Instructions
          </button>
        </div>
      </div>
    </div>
  );
};
