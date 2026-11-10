import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, ModelOption, ImageAttachment } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { PromptBar } from './components/PromptBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ArtifactModal } from './components/ArtifactModal';
import { PersonaModal } from './components/PersonaModal';
import { ExtractedCodeBlock } from './utils/markdown';

const STORAGE_KEY = 'nakoliva_conversations_v1';
const ACTIVE_CHAT_KEY = 'nakoliva_active_chat_id';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        // Ensure clean state without dangling streaming flags
        return parsed.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({ ...m, isStreaming: false })),
        }));
      }
    } catch (_) {}
    return [];
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    try {
      const savedActive = localStorage.getItem(ACTIVE_CHAT_KEY);
      const savedConvs = localStorage.getItem(STORAGE_KEY);
      const parsedConvs = savedConvs ? JSON.parse(savedConvs) : [];
      if (savedActive && parsedConvs.some((c: any) => c.id === savedActive)) {
        return savedActive;
      }
      if (parsedConvs.length > 0) {
        return parsedConvs[0].id;
      }
    } catch (_) {}
    return null;
  });

  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [thinkingLevel, setThinkingLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [systemInstruction, setSystemInstruction] = useState<string>('');

  const [models, setModels] = useState<ModelOption[]>([
    {
      id: 'gemini-3.1-flash-lite',
      name: 'NakoLiva Flash Lite',
      tagline: 'Ultra-fast, instant responses for conversation & coding',
      category: 'Speed Optimized',
      isDefault: true,
      supportsGrounding: true,
      supportsThinking: false,
    },
    {
      id: 'gemini-3.8-flash',
      name: 'NakoLiva Pro (Reasoning)',
      tagline: 'Multimodal intelligence with deep reasoning',
      category: 'Balanced & Reasoning',
      isDefault: false,
      supportsGrounding: true,
      supportsThinking: true,
    },
    {
      id: 'gemini-4-argon',
      name: 'NakoLiva Ultra (Argon)',
      tagline: 'Deep STEM reasoning and complex software engineering',
      category: 'Maximum Reasoning',
      isDefault: false,
      supportsGrounding: true,
      supportsThinking: true,
    },
  ]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ExtractedCodeBlock | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore settings from active conversation on first load
  useEffect(() => {
    if (activeChatId && conversations.length > 0) {
      const active = conversations.find((c) => c.id === activeChatId);
      if (active) {
        if (active.model) setSelectedModel(active.model);
        if (active.enableSearch !== undefined) setEnableSearch(active.enableSearch);
        if (active.thinkingLevel) setThinkingLevel(active.thinkingLevel);
        if (active.systemInstruction !== undefined) setSystemInstruction(active.systemInstruction);
      }
    }
  }, []);

  // Persist activeChatId
  useEffect(() => {
    try {
      if (activeChatId) {
        localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
      } else {
        localStorage.removeItem(ACTIVE_CHAT_KEY);
      }
    } catch (_) {}
  }, [activeChatId]);

  // Persist conversations safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Storage limit reached, saving with image pruning...', e);
      try {
        const pruned = conversations.map((conv, i) =>
          i === 0
            ? conv
            : {
                ...conv,
                messages: conv.messages.map((m) => ({
                  ...m,
                  images: m.images?.map((img) => ({
                    ...img,
                    data: '',
                  })),
                })),
              }
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      } catch (inner) {
        console.error('Failed to save to localStorage:', inner);
      }
    }
  }, [conversations]);

  // Fetch models from server
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      })
      .catch((err) => console.warn('Could not fetch server models', err));
  }, []);

  // Auto-scroll when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeConversation = conversations.find((c) => c.id === activeChatId) || null;
  const currentMessages = activeConversation ? activeConversation.messages : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length, isStreaming]);

  // Start a new chat
  const handleNewChat = () => {
    setActiveChatId(null);
  };

  // Select existing chat
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      if (conv.model) setSelectedModel(conv.model);
      if (conv.enableSearch !== undefined) setEnableSearch(conv.enableSearch);
      if (conv.thinkingLevel) setThinkingLevel(conv.thinkingLevel);
      if (conv.systemInstruction !== undefined) setSystemInstruction(conv.systemInstruction);
    }
  };

  // Delete chat
  const handleDeleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  // Rename chat
  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Clear all chats
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all conversations?')) {
      setConversations([]);
      setActiveChatId(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_CHAT_KEY);
      } catch (_) {}
    }
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message
  const handleSendMessage = async (text: string, images: ImageAttachment[] = []) => {
    if (isStreaming) return;

    let targetChatId = activeChatId;
    let updatedConversations = [...conversations];

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: text,
      images: images.length > 0 ? images : undefined,
      timestamp: Date.now(),
    };

    const modelMessageId = `msg-model-${Date.now()}`;
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      modelUsed: models.find((m) => m.id === selectedModel)?.name || 'NakoLiva AI',
      isStreaming: true,
    };

    // If new conversation, generate title from prompt
    if (!targetChatId) {
      targetChatId = `conv-${Date.now()}`;
      const title = text.slice(0, 36) + (text.length > 36 ? '...' : '') || 'New Conversation';
      const newConv: Conversation = {
        id: targetChatId,
        title,
        messages: [userMessage, modelMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
        enableSearch,
        thinkingLevel,
        systemInstruction,
      };
      updatedConversations = [newConv, ...conversations];
      setConversations(updatedConversations);
      setActiveChatId(targetChatId);
    } else {
      updatedConversations = updatedConversations.map((c) => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: [...c.messages, userMessage, modelMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
      setConversations(updatedConversations);
    }

    // Prepare payload messages
    const currentConv = updatedConversations.find((c) => c.id === targetChatId);
    const historyMessages = (currentConv ? currentConv.messages : [userMessage, modelMessage])
      .filter((m) => m.id !== modelMessageId)
      .map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images?.map((img) => ({
          mimeType: img.mimeType,
          data: img.data,
          name: img.name,
        })),
      }));

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: historyMessages,
          model: selectedModel,
          systemInstruction: systemInstruction.trim() || undefined,
          enableSearch,
          thinkingLevel,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body stream not available');

      const decoder = new TextDecoder();
      let streamedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (!dataStr) continue;

            let event: any;
            try {
              event = JSON.parse(dataStr);
            } catch (_) {
              continue;
            }

            if (event.type === 'chunk' && event.text) {
              streamedText += event.text;
              const textSnapshot = streamedText;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetChatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === modelMessageId
                          ? {
                              ...m,
                              content: textSnapshot,
                              thoughtDurationSec: Math.max(
                                1,
                                Math.round((Date.now() - startTime) / 1000)
                              ),
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            } else if (event.type === 'done') {
              const thoughtDuration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
              const finalText = event.fullText || streamedText;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetChatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === modelMessageId
                          ? {
                              ...m,
                              content: finalText,
                              groundingLinks: event.groundingLinks || [],
                              thought:
                                selectedModel !== 'gemini-3.1-flash-lite'
                                  ? `Analyzed multimodal context and synthesized response using ${selectedModel}.`
                                  : undefined,
                              thoughtDurationSec: thoughtDuration,
                              isStreaming: false,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            } else if (event.type === 'error') {
              const errMsg = event.error || 'Failed to generate response.';
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetChatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === modelMessageId
                          ? {
                              ...m,
                              error: errMsg,
                              isStreaming: false,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
              break;
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === modelMessageId
                    ? {
                        ...m,
                        error: err.message || 'An error occurred while generating the response.',
                        isStreaming: false,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Mark model message as finished streaming
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === modelMessageId ? { ...m, isStreaming: false } : m
              ),
            };
          }
          return c;
        })
      );
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const messages = activeConversation.messages;
    const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIndex === -1) return;

    const lastUserMessage = messages[lastUserIndex];
    // Remove messages after lastUserIndex
    const trimmedMessages = messages.slice(0, lastUserIndex);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id ? { ...c, messages: trimmedMessages } : c
      )
    );

    // Resend
    handleSendMessage(lastUserMessage.content, lastUserMessage.images || []);
  };

  // Modify response tone (shorter, longer, simpler, casual, professional)
  const handleModifyTone = async (
    tone: 'shorter' | 'longer' | 'simpler' | 'casual' | 'professional'
  ) => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const messages = activeConversation.messages;
    const lastModelMessage = messages[messages.length - 1];
    if (lastModelMessage.role !== 'model' || !lastModelMessage.content) return;

    try {
      const res = await fetch('/api/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lastModelMessage.content,
          tone,
        }),
      });

      const data = await res.json();
      if (data.modifiedText) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversation.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === lastModelMessage.id
                    ? {
                        ...m,
                        content: data.modifiedText,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (e) {
      console.error('Failed to modify tone:', e);
    }
  };

  return (
    <div className="app-container text-[#e3e3e3]">
      {/* Collapsible / Persistent Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
        onClearAll={handleClearAll}
      />

      {/* Main Content Column */}
      <div className="chat-main-column">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          models={models}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
          thinkingLevel={thinkingLevel}
          onSelectThinkingLevel={setThinkingLevel}
          onOpenPersona={() => setIsPersonaModalOpen(true)}
          onNewChat={handleNewChat}
        />

        {/* Chat Messages or Welcome Screen */}
        <div className="flex-1 overflow-y-auto flex flex-col scroll-smooth">
          {currentMessages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="flex-1 pb-4">
              {currentMessages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={
                    idx === currentMessages.length - 1 && msg.role === 'model'
                      ? handleRegenerate
                      : undefined
                  }
                  onModifyTone={
                    idx === currentMessages.length - 1 && msg.role === 'model'
                      ? handleModifyTone
                      : undefined
                  }
                  onOpenArtifact={(block) => setActiveArtifact(block)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Prompt Bar */}
        <PromptBar
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
        />
      </div>

      {/* Live Sandbox Artifact Modal */}
      {activeArtifact && (
        <ArtifactModal
          block={activeArtifact}
          onClose={() => setActiveArtifact(null)}
        />
      )}

      {/* Persona / System Instructions Modal */}
      {isPersonaModalOpen && (
        <PersonaModal
          currentInstruction={systemInstruction}
          onSave={(inst) => setSystemInstruction(inst)}
          onClose={() => setIsPersonaModalOpen(false)}
        />
      )}
    </div>
  );
}
