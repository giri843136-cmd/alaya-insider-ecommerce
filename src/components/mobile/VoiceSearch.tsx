import { useEffect, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { startVoiceRecognition, stopVoiceRecognition, listenVoice, getDeviceInfo } from "@/lib/mobilePlatform";

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  className?: string;
}

export function VoiceSearch({ onResult, className }: VoiceSearchProps) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const supported = getDeviceInfo().voiceSupported;

  useEffect(() => {
    const unsub = listenVoice((result) => {
      setInterim(result.transcript);
      if (result.final) {
        onResult(result.transcript);
        setListening(false);
        setInterim("");
      }
    });
    return unsub;
  }, [onResult]);

  const toggleListening = () => {
    if (listening) {
      stopVoiceRecognition();
      setListening(false);
      setInterim("");
    } else {
      const ok = startVoiceRecognition();
      if (ok) setListening(true);
    }
  };

  if (!supported) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={toggleListening}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200",
          listening
            ? "bg-danger text-white animate-pulse"
            : "bg-surface2 text-muted hover:text-ink hover:bg-surface"
        )}
        aria-label={listening ? "Stop listening" : "Start voice search"}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? "Listening..." : "Voice"}
      </button>

      {listening && interim && (
        <div className="absolute top-full left-0 right-0 mt-2 animate-slide-up rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            <span className="text-sm text-ink">{interim}</span>
          </div>
        </div>
      )}
    </div>
  );
}
