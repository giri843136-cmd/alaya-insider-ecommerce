import { useCallback, useEffect, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

// Check if SpeechRecognition is available
const HAS_SPEECH =
  typeof window !== "undefined" &&
  (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onstart: ((() => void) | null);
  onend: ((() => void) | null);
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError {
  error: string;
  message: string;
}

export function VoiceSearch({ onResult, disabled }: VoiceSearchProps) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(HAS_SPEECH);
  const [error, setError] = useState("");

  const toggle = useCallback(() => {
    if (!supported) {
      setError("Voice search not supported in this browser.");
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    setError("");

    const SpeechRecognitionAPI =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Voice search not supported.");
      return;
    }

    const recognition = new (SpeechRecognitionAPI as new () => SpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event: SpeechRecognitionError) => {
      setListening(false);
      if (event.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else if (event.error !== "aborted") {
        setError("Voice search error. Try again.");
      }
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      setError("Could not start voice search.");
    }
  }, [supported, listening, onResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => setListening(false);
  }, []);

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={listening ? "Listening..." : "Voice search"}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full transition-all",
          listening
            ? "bg-danger text-white animate-count-pulse"
            : "text-muted hover:bg-surface2 hover:text-ink"
        )}
      >
        {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
      </button>
      {error && (
        <div className="absolute right-0 top-full mt-2 w-48 animate-fade-in">
          <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted shadow-[var(--shadow-soft)]">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-medium text-accent">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
