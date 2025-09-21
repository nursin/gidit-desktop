import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "./use-toast";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type UseVoiceRecognitionProps = {
  onTranscriptChange: (transcript: string) => void;
};

export function useVoiceRecognition({ onTranscriptChange }: UseVoiceRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Voice Recognition Unavailable",
        description: "SpeechRecognition API is not available in this environment.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcriptChunk = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscriptRef.current += transcriptChunk;
          setTranscript(finalTranscriptRef.current);
          try {
            onTranscriptChange(finalTranscriptRef.current);
          } catch (err) {
            console.error("onTranscriptChange handler error:", err);
          }
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      // Optionally send interim transcripts as well (commented out)
      // onTranscriptChange(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event?.error ?? event);
      toast({
        title: "Voice Recognition Error",
        description: `An error occurred: ${event?.error ?? "unknown"}`,
        variant: "destructive",
      });
      setIsRecording(false);
    };

    recognition.onend = () => {
      // If user still intends to record, restart recognition to keep continuity.
      if (isRecording) {
        try {
          recognition.start();
        } catch (err) {
          // Starting may fail if permission is revoked or already started; surface to user.
          toast({
            title: "Voice Recognition Stopped",
            description: "Could not restart voice recognition.",
            variant: "destructive",
          });
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore cleanup errors
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, isRecording, onTranscriptChange]);

  const start = useCallback(() => {
    if (!isSupported) return;
    if (isRecording) return;
    finalTranscriptRef.current = "";
    setTranscript("");
    setIsRecording(true);
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.error("Failed to start recognition", err);
      toast({
        title: "Failed to Start Voice Recognition",
        description: "Please check microphone permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [isSupported, isRecording, toast]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    if (!isRecording) return;
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error("Failed to stop recognition", err);
      // no toast here to avoid spamming on unmount
    }
  }, [isSupported, isRecording]);

  return {
    isRecording,
    isSupported,
    transcript,
    start,
    stop,
  };
}
