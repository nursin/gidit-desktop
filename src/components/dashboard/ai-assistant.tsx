import React, { useState, useTransition, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Bot, Loader2, Send, User, Sparkles } from "lucide-react";
import { chatAssistant } from "../../services/ai";

/**
 * Lightweight classNames helper to avoid depending on project-specific utilities.
 */
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type Message = {
  role: "user" | "model";
  content: string;
};

export function AiAssistant({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hello! I'm Giddy. How can I help you with Gidit today?" },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const suggestedPrompts = [
    "How do I add a widget?",
    "Give me a productivity tip",
    "I have some feedback",
    "What is my schedule today?",
    "What am I forgetting?",
    "Chat with a representative",
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = (messageContent: string) => {
    if (!messageContent.trim() || isPending) return;

    const userMessage: Message = { role: "user", content: messageContent };

    // Add the user message immediately and then start the async assistant call.
    setMessages((prev) => {
      const next = [...prev, userMessage];

      startTransition(async () => {
        try {
          // Send the conversation history (excluding the pending user message when appropriate).
          const history = next.slice(0, -1);
          const result = await chatAssistant({ history, message: messageContent });
          const aiMessage: Message = { role: "model", content: result.response ?? "" };
          setMessages((prev2) => [...prev2, aiMessage]);
        } catch (error) {
          console.error("AI Assistant Error:", error);
          const errorMessage: Message = {
            role: "model",
            content:
              "Sorry, I'm having trouble connecting right now. Please try again later.",
          };
          setMessages((prev2) => [...prev2, errorMessage]);
        }
      });

      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput("");
    sendMessage(prompt);
  };

  const showSuggestedPrompts =
    messages.length === 1 ||
    (messages[messages.length - 1].role === "model" && !isPending);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Giddy</DialogTitle>
          <DialogDescription>
            Your helpful assistant for anything you need in the app.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow -mx-6" ref={scrollAreaRef}>
          <div className="px-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "model" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "p-3 rounded-lg max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-secondary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}

            {showSuggestedPrompts && (
              <div className="flex flex-wrap gap-2 justify-start pl-12">
                {suggestedPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(prompt)}
                    disabled={isPending}
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInput(e.target.value)
              }
              placeholder="Type your message..."
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AiAssistant;
