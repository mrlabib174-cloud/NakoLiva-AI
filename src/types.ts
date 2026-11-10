export interface ImageAttachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 data
  previewUrl: string;
}

export interface GroundingLink {
  title?: string;
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  images?: ImageAttachment[];
  thought?: string;
  thoughtDurationSec?: number;
  groundingLinks?: GroundingLink[];
  timestamp: number;
  modelUsed?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  pinned?: boolean;
  systemInstruction?: string;
  enableSearch?: boolean;
  thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ModelOption {
  id: string;
  name: string;
  tagline: string;
  category: string;
  isDefault: boolean;
  supportsGrounding: boolean;
  supportsThinking: boolean;
}
