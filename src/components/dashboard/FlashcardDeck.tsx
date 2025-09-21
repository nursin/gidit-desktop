import React, { useState, useTransition, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Layers,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  BookOpen,
} from "lucide-react";
import { generateFlashcards } from "../../services/ai";

/**
 * A lightweight replacement for classNames / cn used in the original.
 */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Minimal toast replacement for the desktop app renderer.
 * Uses the Notification API where available (Electron's renderer supports it),
 * otherwise falls back to console.log.
 */
function showToast({
  title,
  description,
  variant,
}: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) {
  const body = description || "";
  try {
    // Notification permission should be granted in desktop contexts.
    // If not, this will silently fail and we fallback to console.
    // You can replace this with a more advanced/toast-context solution in your app.
    // eslint-disable-next-line no-new
    new Notification(title, { body });
  } catch {
    // Fallback
    // eslint-disable-next-line no-console
    console.log(`[${variant ?? "info"}] ${title} - ${body}`);
  }
}

type CardType = "basic" | "cloze";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  image?: string;
  type: CardType;
};

const initialCards: Flashcard[] = [
  { id: uuidv4(), front: "What is the powerhouse of the cell?", back: "Mitochondria", type: "basic" },
  { id: uuidv4(), front: "The capital of France is ...", back: "Paris", type: "cloze" },
  { id: uuidv4(), front: "What does 'HTTP' stand for?", back: "HyperText Transfer Protocol", type: "basic" },
];

function FlashcardDisplay({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const clozeQuestion = card.type === "cloze" ? card.front.replace("...", "______") : card.front;
  const clozeAnswer = card.type === "cloze" ? card.front.replace("...", `**${card.back}**`) : card.back;

  return (
    <div className="w-full h-48 perspective-1000 cursor-pointer" onClick={onFlip}>
      <div
        className={cx(
          "relative w-full h-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front */}
        <div className="absolute w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center text-center backface-hidden">
          <p className="text-lg font-semibold">{clozeQuestion}</p>
        </div>
        {/* Back */}
        <div className="absolute w-full h-full bg-white/80 dark:bg-black/20 rounded-lg p-4 flex items-center justify-center text-center backface-hidden rotate-y-180">
          <p className="text-lg font-semibold">{clozeAnswer}</p>
        </div>
      </div>
    </div>
  );
}

export function FlashcardDeck({ name = "Flashcard Deck" }: { name?: string }) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "none">("none");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setFeedback("none");
  };

  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setUserAnswer("");
    setFeedback("none");
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setUserAnswer("");
    setFeedback("none");
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const checkAnswer = () => {
    if (cards.length === 0) return;
    const correctAnswer = cards[currentCardIndex].back;
    if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      setFeedback("correct");
      showToast({ title: "Correct!", description: "Great job!" });
    } else {
      setFeedback("incorrect");
      showToast({ title: "Not quite", description: `The correct answer is: ${correctAnswer}`, variant: "destructive" });
    }
    setIsFlipped(true);
  };

  const handleGenerate = (topic: string) => {
    if (!topic) return;
    startTransition(async () => {
      try {
        const result = await generateFlashcards({ topic, count: 10 });
        const newCards: Flashcard[] = result.cards.map((c: { front: string; back: string }) => ({
          id: uuidv4(),
          front: c.front,
          back: c.back,
          type: c.front.includes("...") ? "cloze" : "basic",
        }));
        setCards(newCards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        showToast({ title: "Deck Generated!", description: `Created ${newCards.length} cards about ${topic}.` });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        showToast({ title: "Generation Failed", description: "Could not generate flashcards. Please try again.", variant: "destructive" });
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const newCards: Flashcard[] = text
          .split("\n")
          .map((line) => {
            const parts = line.split("|");
            if (parts.length < 2) return null;
            const front = parts[0].trim();
            const back = parts[1].trim();
            return {
              id: uuidv4(),
              front,
              back,
              type: front.includes("...") ? "cloze" : "basic",
            };
          })
          .filter((c): c is Flashcard => c !== null);

        if (newCards.length > 0) {
          setCards(newCards);
          setCurrentCardIndex(0);
          setIsFlipped(false);
          showToast({ title: "Deck Imported!", description: `Imported ${newCards.length} cards.` });
        } else {
          throw new Error("No valid cards found in file.");
        }
      } catch (err: any) {
        showToast({ title: "Import Failed", description: err?.message ?? String(err), variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = "";
  };

  const progress = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;
  const currentCard = cards[currentCardIndex];

  const [topic, setTopic] = useState("");
  const [tab, setTab] = useState<"study" | "create">("study");

  return (
    <>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>

      <div className="flex flex-col h-full border rounded-lg shadow-sm bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Layers className="w-6 h-6 text-primary" />
          <div>
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-gray-500">Review, create, and master your subjects.</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={cx(
                "px-4 py-2 -mb-px flex items-center gap-2",
                tab === "study" ? "border-b-2 border-primary font-medium" : "text-gray-500"
              )}
              onClick={() => setTab("study")}
            >
              <BookOpen className="w-4 h-4" />
              <span>Study</span>
            </button>
            <button
              className={cx(
                "px-4 py-2 -mb-px flex items-center gap-2",
                tab === "create" ? "border-b-2 border-primary font-medium" : "text-gray-500"
              )}
              onClick={() => setTab("create")}
            >
              <span>Create Deck</span>
            </button>
          </div>

          {tab === "study" ? (
            <div className="flex flex-col flex-1 justify-between gap-4">
              {cards.length > 0 ? (
                <>
                  <div className="flex-grow flex flex-col justify-center items-center gap-4 min-h-0">
                    <div className="w-full max-w-md">
                      <FlashcardDisplay card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />
                    </div>

                    <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
                      <input
                        placeholder="Type your answer..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                        className={cx(
                          "flex-1 px-3 py-2 border rounded-md focus:outline-none",
                          feedback === "correct" && "border-green-500 focus:ring-1 focus:ring-green-500",
                          feedback === "incorrect" && "border-red-500 focus:ring-1 focus:ring-red-500"
                        )}
                      />
                      <button
                        onClick={checkAnswer}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-95"
                      >
                        Check
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Card {currentCardIndex + 1} of {cards.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={handlePrev}
                        className="px-3 py-2 border rounded-md bg-transparent"
                        aria-label="Previous card"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleFlip}
                        className="px-3 py-2 border rounded-md bg-transparent flex items-center"
                      >
                        <RotateCw className="w-4 h-4 mr-2" /> Flip
                      </button>
                      <button
                        onClick={handleNext}
                        className="px-3 py-2 border rounded-md bg-transparent"
                        aria-label="Next card"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 pt-12">
                  <p>No cards in this deck.</p>
                  <p className="text-xs">Go to the 'Create Deck' tab to get started.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 pt-2">
              <div className="space-y-2">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                  Generate with AI
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="topic"
                    placeholder="e.g., 'React Hooks'"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none"
                  />
                  <button
                    onClick={() => handleGenerate(topic)}
                    disabled={isPending || !topic}
                    className="px-3 py-2 bg-primary text-white rounded-md disabled:opacity-50 flex items-center justify-center"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                  Upload a .txt file
                </label>
                <input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="px-3 py-2"
                />
                <p className="text-xs text-gray-500">Format: question|answer per line.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
