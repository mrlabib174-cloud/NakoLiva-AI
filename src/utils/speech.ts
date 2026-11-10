/**
 * Speech Recognition and Synthesis utilities
 */

export class VoiceHelper {
  private static recognition: any = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  static isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  static startListening(
    onResult: (transcript: string) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): { stop: () => void } {
    if (!this.isRecognitionSupported()) {
      onError(new Error('Speech recognition not supported in this browser.'));
      return { stop: () => {} };
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      onResult(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      onError(event.error);
    };

    recognition.onend = () => {
      onEnd();
    };

    try {
      recognition.start();
      this.recognition = recognition;
    } catch (e) {
      onError(e);
    }

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (_) {}
      },
    };
  }

  static speak(text: string, onEnd?: () => void): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown formatting before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#~>]/g, '')
      .trim();

    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try finding an English natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  static stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  static isSpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }
}
