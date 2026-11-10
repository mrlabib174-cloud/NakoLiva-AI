import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Conversation } from '../types';
import { NakoLivaLogo } from './NakoLivaLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onClearAll: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredConversations.filter((c) => c.pinned);
  const unpinnedChats = filteredConversations.filter((c) => !c.pinned);

  // Group unpinned by time
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const todayChats = unpinnedChats.filter((c) => now - c.updatedAt < oneDay);
  const previousWeekChats = unpinnedChats.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < sevenDays
  );
  const olderChats = unpinnedChats.filter((c) => now - c.updatedAt >= sevenDays);

  const startEditing = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const renderChatItem = (c: Conversation) => {
    const isActive = c.id === activeChatId;
    const isEditing = c.id === editingId;

    if (isEditing) {
      return (
        <div
          key={c.id}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#282a2c] border border-blue-500/50"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing(c.id);
              if (e.key === 'Escape') cancelEditing();
            }}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={() => saveEditing(c.id)}
            className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="p-1 text-[#a8aaa8] hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={c.id}
        onClick={() => {
          onSelectChat(c.id);
          // Auto close on small screens
          if (window.innerWidth < 768) onClose();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
          isActive
            ? 'bg-blue-600/15 text-white font-semibold border border-blue-500/30'
            : 'text-[#c4c7c5] hover:bg-[#1e1f20] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#80868b]'}`} />
          <span className="truncate">{c.title}</span>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(c.id);
            }}
            title={c.pinned ? 'Unpin chat' : 'Pin chat'}
            className={`p-1 rounded hover:bg-[#37393b] transition-colors ${
              c.pinned ? 'text-blue-400' : 'text-[#80868b] hover:text-white'
            }`}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startEditing(c);
            }}
            title="Rename"
            className="p-1 rounded text-[#80868b] hover:text-white hover:bg-[#37393b] transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChat(c.id);
            }}
            title="Delete"
            className="p-1 rounded text-[#80868b] hover:text-rose-400 hover:bg-[#37393b] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop (only visible on screens < 1024px when sidebar is open) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar: Persistent Two-Column on Desktop (>= 1024px) & Off-canvas Drawer on Mobile (< 1024px) */}
      <aside
        className={`app-sidebar-mobile app-sidebar-desktop ${
          isOpen ? 'is-open' : 'is-collapsed'
        } bg-[#18191a] z-50 lg:z-10`}
      >
        <div className="w-72 min-w-[18rem] flex flex-col h-full border-r border-[#282a2c]">
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#282a2c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#1e2230] to-[#12141c] border border-blue-500/30 flex items-center justify-center p-1.5 shadow-md shadow-blue-500/10">
              <NakoLivaLogo className="w-full h-full" />
            </div>
            <span className="font-semibold text-white tracking-tight text-sm">
              NakoLiva Workspace
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#80868b] hover:text-white hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#282a2c] hover:bg-[#37393b] text-white text-xs font-semibold border border-[#37393b] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400 stroke-[2.5]" />
            <span>New conversation</span>
          </button>
        </div>

        {/* Search input */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs text-[#c4c7c5] focus-within:border-[#37393b]">
            <Search className="w-3.5 h-3.5 text-[#80868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-transparent text-white placeholder-[#80868b] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#80868b] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#80868b]">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {pinnedChats.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#80868b]">
                    <Pin className="w-3 h-3 text-blue-400" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5">{pinnedChats.map(renderChatItem)}</div>
                </div>
              )}

              {/* Today section */}
              {todayChats.length > 0 && (
                <div>
                  <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#80868b]">
                    Today
                  </div>
                  <div className="space-y-0.5">{todayChats.map(renderChatItem)}</div>
                </div>
              )}

              {/* Previous 7 days */}
              {previousWeekChats.length > 0 && (
                <div>
                  <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#80868b]">
                    Previous 7 Days
                  </div>
                  <div className="space-y-0.5">{previousWeekChats.map(renderChatItem)}</div>
                </div>
              )}

              {/* Older chats */}
              {olderChats.length > 0 && (
                <div>
                  <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#80868b]">
                    Older
                  </div>
                  <div className="space-y-0.5">{olderChats.map(renderChatItem)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info & Clear all */}
        <div className="p-3 border-t border-[#282a2c] space-y-2">
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#80868b] hover:text-rose-400 hover:bg-[#282a2c] rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all conversations</span>
            </button>
          )}

          <div className="p-2.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-[11px] text-[#a8aaa8]">
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>NakoLiva AI Features</span>
            </div>
            <p className="text-[10px] text-[#80868b] leading-tight">
              Multimodal image vision, real-time Google search grounding, and live interactive HTML code preview.
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
