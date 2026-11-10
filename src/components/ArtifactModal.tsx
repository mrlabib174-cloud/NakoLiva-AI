import React, { useState } from 'react';
import { X, Play, Code2, Monitor, Tablet, Smartphone, Copy, Check, RotateCw } from 'lucide-react';
import { ExtractedCodeBlock } from '../utils/markdown';

interface ArtifactModalProps {
  block: ExtractedCodeBlock | null;
  onClose: () => void;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({ block, onClose }) => {
  if (!block) return null;

  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateIframeSrcDoc = (code: string, language: string) => {
    if (language === 'svg') {
      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0e0f10; }
      svg { max-width: 90vw; max-height: 90vh; }
    </style>
  </head>
  <body>
    ${code}
  </body>
</html>`;
    }

    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return code;
    }

    // Default HTML/JS/CSS wrap
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 1.5rem; background: #0e0f10; color: #f1f1f1; }
    </style>
  </head>
  <body>
    ${code}
  </body>
</html>`;
  };

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-[#1e1f20] border border-[#37393b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#282a2c] border-b border-[#37393b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Live Interactive Sandbox
              </h3>
              <p className="text-xs text-[#a8aaa8] capitalize font-mono">
                {block.language} Code Artifact
              </p>
            </div>
          </div>

          {/* Center Tabs & Devices */}
          <div className="flex items-center gap-2 bg-[#1e1f20] p-1 rounded-xl border border-[#37393b]">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#c4c7c5] hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#c4c7c5] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Source
            </button>

            {activeTab === 'preview' && (
              <div className="flex items-center gap-1 pl-2 border-l border-[#37393b]">
                <button
                  onClick={() => setDevice('desktop')}
                  title="Desktop View"
                  className={`p-1.5 rounded-md transition-colors ${
                    device === 'desktop' ? 'bg-[#37393b] text-white' : 'text-[#a8aaa8] hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  title="Tablet View"
                  className={`p-1.5 rounded-md transition-colors ${
                    device === 'tablet' ? 'bg-[#37393b] text-white' : 'text-[#a8aaa8] hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  title="Mobile View"
                  className={`p-1.5 rounded-md transition-colors ${
                    device === 'mobile' ? 'bg-[#37393b] text-white' : 'text-[#a8aaa8] hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                title="Reload preview"
                className="p-2 rounded-lg text-[#c4c7c5] hover:text-white hover:bg-[#37393b] transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#e3e3e3] bg-[#37393b] hover:bg-[#484b4e] rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#c4c7c5] hover:text-white hover:bg-[#37393b] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden bg-[#131314] flex items-center justify-center p-4">
          {activeTab === 'preview' ? (
            <div
              className={`h-full ${getDeviceWidth()} w-full bg-[#0e0f10] rounded-xl overflow-hidden shadow-2xl border border-[#282a2c] transition-all duration-300`}
            >
              <iframe
                key={reloadKey}
                title="Artifact Preview"
                srcDoc={generateIframeSrcDoc(block.code, block.language)}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0 bg-transparent"
              />
            </div>
          ) : (
            <div className="w-full h-full overflow-auto bg-[#18191a] rounded-xl border border-[#282a2c] p-4">
              <pre className="font-mono text-xs sm:text-sm text-[#e3e3e3] leading-relaxed">
                <code>{block.code}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
