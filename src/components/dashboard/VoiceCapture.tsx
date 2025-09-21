import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, AlertTriangle, Copy } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type VoiceCaptureProps = {
  name?: string;
};

export function VoiceCapture({ name = "Voice Capture" }: VoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [toast, setToast] = useState<{ title: string; description?: string } | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Append new content: keep previously finalized text + current interim
      setTranscript((prev) => prev + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setToast({
        title: "Voice Recognition Error",
        description: `An error occurred: ${event.error ?? "unknown error"}`,
      });
      setIsRecording(false);
    };

    recognition.onend = () => {
      // If we were still intending to record, restart (handles intermittent stops)
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (err) {
          // Some browsers throw if start is called too quickly — show a toast
          setToast({ title: "Failed to restart recognition", description: String(err) });
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  // Simple toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleRecording = async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setToast({ title: "Voice recognition not available" });
      return;
    }

    if (isRecording) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    } else {
      // Clear previous transcript for a fresh recording session
      setTranscript("");
      try {
        // Request microphone permission by calling getUserMedia first in some environments
        // so that SpeechRecognition has microphone access (best-effort)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch {
            // If user denies, SpeechRecognition.start() may also fail — show toast below
          }
        }
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setToast({ title: "Could not start recording", description: String(err) });
        setIsRecording(false);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setToast({ title: "Copied to clipboard!", description: "Your voice note has been copied." });
    } catch (err) {
      setToast({ title: "Copy failed", description: String(err) });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent border-0 shadow-none p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Mic className="w-6 h-6 text-primary" />
          <div>
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">Use your voice to capture notes.</div>
          </div>
        </div>
        <button
          onClick={handleCopy}
          disabled={!transcript}
          className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"
          aria-disabled={!transcript}
          title="Copy transcript"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>

      <div className="flex flex-col flex-grow justify-center items-center gap-4">
        {!isSupported ? (
          <div className="text-center text-destructive flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8" />
            <p className="font-semibold">Voice recognition not supported.</p>
            <p className="text-xs">Please try a different environment (e.g. a Chromium-based browser).</p>
          </div>
        ) : (
          <>
            <button
              onClick={toggleRecording}
              size={24 as any}
              className={`w-24 h-24 rounded-full transition-all duration-300 flex items-center justify-center ${
                isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse text-white" : "bg-gray-100"
              }`}
              aria-pressed={isRecording}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            <p className="text-sm text-muted-foreground">
              {isRecording ? "Recording... Click to stop." : "Click to start recording."}
            </p>

            <textarea
              placeholder="Your transcribed text will appear here..."
              className="flex-grow w-full resize-none text-sm bg-white/50 p-3 rounded-md border"
              value={transcript}
              readOnly
              rows={8}
            />
          </>
        )}
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg"
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
        </div>
      )}
    </div>
  );
}

export default VoiceCapture;
