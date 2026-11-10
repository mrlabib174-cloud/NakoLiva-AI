import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Message } from '../types';
import { parseMarkdownWithCodeBlocks, ExtractedCodeBlock } from '../utils/markdown';
import { VoiceHelper } from '../utils/speech';
import { NakoLivaLogo } from './NakoLivaLogo';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onModifyTone?: (tone: 'shorter' | 'longer' | 'simpler' | 'casual' | 'professional') => void;
  onOpenArtifact?: (block: ExtractedCodeBlock) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onModifyTone,
  onOpenArtifact,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [isModifyMenuOpen, setIsModifyMenuOpen] = useState(false);
  const [parsedData, setParsedData] = useState<{
    html: string;
    codeBlocks: ExtractedCodeBlock[];
  }>({ html: '', codeBlocks: [] });

  // Parse markdown when message content changes
  useEffect(() => {
    if (!isUser && message.content) {
      const parsed = parseMarkdownWithCodeBlocks(message.content);
      setParsedData(parsed);
    }
  }, [message.content, isUser]);

  // Handle clicks inside parsed html (e.g. copy code button, preview button)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Check if clicked copy button or its child
    const copyBtn = target.closest('.gemini-copy-btn') as HTMLElement;
    if (copyBtn) {
      const blockId = copyBtn.getAttribute('data-id');
      const found = parsedData.codeBlocks.find((b) => b.id === blockId);
      if (found) {
        navigator.clipboard.writeText(found.code);
        copyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span class="text-emerald-400 font-medium">Copied!</span>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          `;
        }, 2000);
      }
      return;
    }

    // Check if clicked preview button or its child
    const runBtn = target.closest('.gemini-run-btn') as HTMLElement;
    if (runBtn) {
      const blockId = runBtn.getAttribute('data-id');
      const found = parsedData.codeBlocks.find((b) => b.id === blockId);
      if (found && onOpenArtifact) {
        onOpenArtifact(found);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeak = () => {
    if (isPlayingVoice) {
      VoiceHelper.stopSpeaking();
      setIsPlayingVoice(false);
    } else {
      setIsPlayingVoice(true);
      VoiceHelper.speak(message.content, () => {
        setIsPlayingVoice(false);
      });
    }
  };

  return (
    <div
      className={`group w-full py-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#18191a]/40'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-xs shadow-md">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-b from-[#1e2230] to-[#12141c] border border-blue-500/30 flex items-center justify-center p-1.5 shadow-md shadow-blue-500/10">
              <NakoLivaLogo className="w-full h-full" />
              {message.isStreaming && (
                <span className="absolute -inset-1 rounded-xl bg-blue-500/20 animate-ping" />
              )}
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-white tracking-wide">
              {isUser ? 'You' : 'NakoLiva'}
            </span>
            {!isUser && message.modelUsed && (
              <span className="text-[11px] font-medium text-[#a8aaa8] px-2 py-0.5 rounded-full bg-[#282a2c]">
                {message.modelUsed}
              </span>
            )}
            <span className="text-[11px] text-[#70757a]">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* User attached images */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mb-3">
              {message.images.map((img) => (
                <div
                  key={img.id}
                  className="relative group/img rounded-xl overflow-hidden border border-[#37393b] bg-black/40 max-w-[240px] max-h-[200px]"
                >
                  <img
                    src={img.previewUrl || `data:${img.mimeType};base64,${img.data}`}
                    alt={img.name || 'Attached multimodal image'}
                    className="w-full h-full object-cover"
                  />
                  {img.name && (
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-black/70 text-[10px] text-white truncate backdrop-blur-xs">
                      {img.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thinking / Reasoning Accordion */}
          {!isUser && message.thought && (
            <div className="mb-4 rounded-xl border border-[#37393b] bg-[#1e1f20]/60 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-[#c4c7c5] hover:text-white hover:bg-[#282a2c]/50 transition-colors"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Thinking Process</span>
                  {message.thoughtDurationSec && (
                    <span className="text-[10px] text-[#80868b]">
                      ({message.thoughtDurationSec}s)
                    </span>
                  )}
                </div>
                {isThinkingOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#80868b]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#80868b]" />
                )}
              </button>
              {isThinkingOpen && (
                <div className="p-3.5 border-t border-[#37393b] bg-[#131314]/80 text-[#a8aaa8] whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                  {message.thought}
                </div>
              )}
            </div>
          )}

          {/* Grounding Sources (Google Search) */}
          {!isUser && message.groundingLinks && message.groundingLinks.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Search Grounding Sources</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.groundingLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#282a2c] hover:bg-[#37393b] text-[#c4c7c5] hover:text-white text-xs border border-[#37393b] transition-all truncate max-w-xs"
                    title={link.title || link.url}
                  >
                    <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{link.title || link.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {isUser ? (
            <div className="text-sm sm:text-base text-[#e3e3e3] whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div
              onClick={handleContentClick}
              className="prose prose-invert max-w-none text-sm sm:text-base text-[#e3e3e3] leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parsedData.html || escapeFallbackHtml(message.content),
              }}
            />
          )}

          {/* Streaming cursor indicator */}
          {!isUser && message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse rounded-xs" />
          )}

          {/* Error notice */}
          {message.error && (
            <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              {message.error}
            </div>
          )}

          {/* Action buttons bar for Gemini response */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="flex items-center flex-wrap gap-1 mt-4 pt-2 text-[#a8aaa8]">
              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy response"
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#282a2c] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Text-to-speech */}
              <button
                type="button"
                onClick={toggleSpeak}
                title={isPlayingVoice ? 'Stop audio' : 'Listen to response'}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPlayingVoice
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'hover:text-white hover:bg-[#282a2c]'
                }`}
              >
                {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Thumbs up */}
              <button
                type="button"
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                title="Good response"
                className={`p-1.5 rounded-lg transition-colors ${
                  feedback === 'up'
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'hover:text-white hover:bg-[#282a2c]'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              {/* Thumbs down */}
              <button
                type="button"
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                title="Bad response"
                className={`p-1.5 rounded-lg transition-colors ${
                  feedback === 'down'
                    ? 'text-rose-400 bg-rose-500/20'
                    : 'hover:text-white hover:bg-[#282a2c]'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>

              {/* Modify Response Dropdown */}
              {onModifyTone && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModifyMenuOpen(!isModifyMenuOpen)}
                    title="Modify response"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:text-white hover:bg-[#282a2c] text-xs transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Modify</span>
                  </button>

                  {isModifyMenuOpen && (
                    <div className="absolute left-0 mt-1 w-44 bg-[#1e1f20] border border-[#37393b] rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#80868b]">
                        Change length or tone
                      </div>
                      {[
                        { id: 'shorter', label: 'Shorter' },
                        { id: 'longer', label: 'Longer' },
                        { id: 'simpler', label: 'Simpler' },
                        { id: 'casual', label: 'More casual' },
                        { id: 'professional', label: 'More professional' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setIsModifyMenuOpen(false);
                            onModifyTone(item.id as any);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Regenerate */}
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-[#282a2c] transition-colors ml-auto"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function escapeFallbackHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
