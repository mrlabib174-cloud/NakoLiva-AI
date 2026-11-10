import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowUp,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Globe,
  X,
  Plus,
} from 'lucide-react';
import { ImageAttachment } from '../types';
import { VoiceHelper } from '../utils/speech';

interface PromptBarProps {
  onSendMessage: (text: string, images: ImageAttachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
}

export const PromptBar: React.FC<PromptBarProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  enableSearch,
  onToggleSearch,
}) => {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceSessionRef = useRef<{ stop: () => void } | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && images.length === 0) || isStreaming) return;
    onSendMessage(input.trim(), images);
    setInput('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Clean base64
        const base64Data = result.split(',')[1] || '';
        const newAttachment: ImageAttachment = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          mimeType: file.type,
          data: base64Data,
          previewUrl: result,
        };
        setImages((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Voice recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      voiceSessionRef.current?.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const session = VoiceHelper.startListening(
        (transcript) => {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        (err) => {
          console.warn('Voice error:', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
      voiceSessionRef.current = session;
    }
  };

  // Paste image handler (Ctrl+V / Cmd+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1] || '';
            const newAttachment: ImageAttachment = {
              id: `paste-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: 'Pasted Image',
              mimeType: file.type,
              data: base64Data,
              previewUrl: result,
            };
            setImages((prev) => [...prev, newAttachment]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const canSubmit = (input.trim().length > 0 || images.length > 0) && !isStreaming;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 mobile-prompt-bar">
      {/* Container */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#1e1f20] border border-[#37393b] focus-within:border-[#525559] focus-within:shadow-[0_0_20px_rgba(66,133,244,0.15)] transition-all shadow-xl">
        {/* Attached images preview strip */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 px-4 pt-3 pb-1 border-b border-[#282a2c]">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-[#37393b] w-16 h-16 bg-black/50"
              >
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input area */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isRecording
                ? 'Listening to your voice...'
                : 'Ask NakoLiva AI, brainstorm ideas, analyze code, or attach photos...'
            }
            rows={1}
            className="w-full bg-transparent text-[#e3e3e3] placeholder-[#80868b] text-sm sm:text-base resize-none focus:outline-none max-h-48 leading-relaxed"
          />
        </div>

        {/* Action bar inside prompt box */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left tools: Upload, Search Grounding, Voice */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Add photos or screenshots"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#37393b] text-[#c4c7c5] hover:text-white text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Google Search Grounding toggle */}
            <button
              type="button"
              onClick={onToggleSearch}
              title="Search the web in real-time"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                enableSearch
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-[#282a2c] hover:bg-[#37393b] text-[#80868b] hover:text-[#c4c7c5]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search Web</span>
            </button>

            {/* Voice input button */}
            <button
              type="button"
              onClick={toggleRecording}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-[#a8aaa8] hover:text-white hover:bg-[#282a2c]'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right tool: Send or Stop */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                title="Stop response"
                className="p-2 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-md cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSubmit}
                title="Send message"
                className={`p-2 rounded-full transition-all shadow-md cursor-pointer ${
                  canSubmit
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-blue-500/20'
                    : 'bg-[#282a2c] text-[#5f6368] cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NakoLiva footer disclaimer */}
      <p className="text-center text-[11px] text-[#70757a] mt-2">
        NakoLiva AI may display inaccurate info, including about people, so double-check its responses.
      </p>
    </div>
  );
};
