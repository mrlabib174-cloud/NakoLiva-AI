import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export interface ExtractedCodeBlock {
  id: string;
  language: string;
  code: string;
  isExecutable: boolean;
}

export function parseMarkdownWithCodeBlocks(markdownText: string): {
  html: string;
  codeBlocks: ExtractedCodeBlock[];
} {
  const codeBlocks: ExtractedCodeBlock[] = [];
  let blockCounter = 0;

  const renderer: any = new marked.Renderer();

  renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
    const language = (lang || 'plaintext').toLowerCase().trim();
    const id = `code-block-${++blockCounter}`;
    const isExecutable = ['html', 'htm', 'svg', 'javascript', 'js'].includes(language);

    codeBlocks.push({
      id,
      language,
      code: text,
      isExecutable,
    });

    const escapedCode = escapeHtml(text);
    return `
      <div class="my-4 rounded-xl overflow-hidden border border-[#37393b] bg-[#1e1f20] text-sm shadow-md" data-code-block-id="${id}" data-language="${language}">
        <div class="flex items-center justify-between px-4 py-2 bg-[#282a2c] border-b border-[#37393b] text-xs text-[#c4c7c5]">
          <span class="font-mono uppercase font-semibold text-blue-400 tracking-wider">${language}</span>
          <div class="flex items-center gap-2">
            ${
              isExecutable
                ? `<button type="button" class="gemini-run-btn px-2.5 py-1 rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1 font-medium text-xs cursor-pointer" data-id="${id}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Preview
                  </button>`
                : ''
            }
            <button type="button" class="gemini-copy-btn px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#e3e3e3] transition-colors flex items-center gap-1 cursor-pointer" data-id="${id}">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>
          </div>
        </div>
        <pre class="p-4 overflow-x-auto text-[#e3e3e3] font-mono leading-relaxed text-xs sm:text-sm"><code>${escapedCode}</code></pre>
      </div>
    `;
  };

  const rawHtml = marked.parse(markdownText, { renderer }) as string;

  return {
    html: rawHtml,
    codeBlocks,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
