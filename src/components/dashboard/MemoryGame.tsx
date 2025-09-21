import React, { useEffect, useState } from "react";
import { Brain, RotateCw, Star, Heart, Sun, Moon, Cloud, Anchor } from "lucide-react";

/**
 * Self-contained Memory Game component for the Electron + Vite + React renderer.
 *
 * Notes:
 * - Avoids external UI primitives to keep the file portable (uses Tailwind classes).
 * - Adds minimal CSS needed for 3D card flip inside a style tag.
 * - Uses a stable pairId on each card to determine matches (avoids relying on React's internal key prop).
 */

type CardItem = {
  uid: number;
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const iconDefinitions: { pairId: string; node: JSX.Element }[] = [
  { pairId: "star", node: <Star className="w-6 h-6" /> },
  { pairId: "heart", node: <Heart className="w-6 h-6" /> },
  { pairId: "sun", node: <Sun className="w-6 h-6" /> },
  { pairId: "moon", node: <Moon className="w-6 h-6" /> },
  { pairId: "cloud", node: <Cloud className="w-6 h-6" /> },
  { pairId: "anchor", node: <Anchor className="w-6 h-6" /> },
];

const createShuffledDeck = (): CardItem[] => {
  const pairs: CardItem[] = iconDefinitions.flatMap((iconDef, idx) => {
    // Create two cards per icon, with same pairId
    return [
      { uid: idx * 2, pairId: iconDef.pairId, isFlipped: false, isMatched: false },
      { uid: idx * 2 + 1, pairId: iconDef.pairId, isFlipped: false, isMatched: false },
    ];
  });

  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return pairs;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function MemoryGame({ name = "Memory Game" }: { name?: string }) {
  const [deck, setDeck] = useState<CardItem[]>(() => createShuffledDeck());
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);

  useEffect(() => {
    if (flippedIndexes.length !== 2) return;

    const [i1, i2] = flippedIndexes;
    const c1 = deck[i1];
    const c2 = deck[i2];

    if (!c1 || !c2) {
      setFlippedIndexes([]);
      return;
    }

    if (c1.pairId === c2.pairId) {
      // Match: mark matched and keep flipped
      setDeck((prev) =>
        prev.map((card, idx) =>
          idx === i1 || idx === i2 ? { ...card, isMatched: true, isFlipped: true } : card
        )
      );
      setFlippedIndexes([]);
      return;
    }

    // Not a match: flip back after delay
    const t = setTimeout(() => {
      setDeck((prev) =>
        prev.map((card, idx) =>
          idx === i1 || idx === i2 ? { ...card, isFlipped: false } : card
        )
      );
      setFlippedIndexes([]);
    }, 900);

    return () => clearTimeout(t);
  }, [flippedIndexes, deck]);

  const handleCardClick = (index: number) => {
    const card = deck[index];
    if (!card) return;
    if (card.isMatched) return;
    if (card.isFlipped) return;
    if (flippedIndexes.length >= 2) return;

    // Flip the clicked card
    setDeck((prev) => prev.map((c, idx) => (idx === index ? { ...c, isFlipped: true } : c)));

    setFlippedIndexes((prev) => {
      const next = [...prev, index];
      // If this is the first flip of a new turn, increment moves
      if (prev.length === 0) setMoves((m) => m + 1);
      return next;
    });
  };

  const resetGame = () => {
    setDeck(createShuffledDeck());
    setFlippedIndexes([]);
    setMoves(0);
  };

  const isGameWon = deck.every((c) => c.isMatched);

  const renderCardFront = (card: CardItem) => {
    // Find the icon node for this pairId
    const def = iconDefinitions.find((d) => d.pairId === card.pairId);
    return def ? def.node : null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-md shadow-sm overflow-hidden">
      {/* Minimal styles required for 3D flip are injected once per component instance */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>

      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Test your concentration.</div>
          </div>
        </div>
        <button
          onClick={resetGame}
          title="Reset"
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow justify-center items-center gap-4">
        <div className="grid grid-cols-4 gap-3">
          {deck.map((card, index) => {
            const isFlipped = card.isFlipped || card.isMatched;
            return (
              <div
                key={card.uid}
                className="w-16 h-20 perspective-1000 cursor-pointer"
                onClick={() => handleCardClick(index)}
              >
                <div
                  className={cn(
                    "relative w-full h-full transition-transform duration-500 transform-style-3d",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                >
                  {/* Card Back */}
                  <div className="absolute w-full h-full bg-gray-100 dark:bg-gray-800 rounded-md backface-hidden flex items-center justify-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">?</div>
                  </div>

                  {/* Card Front */}
                  <div className="absolute w-full h-full bg-primary/10 dark:bg-primary/20 rounded-md backface-hidden rotate-y-180 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    {renderCardFront(card)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isGameWon ? (
          <p className="font-semibold text-green-600 dark:text-green-400">You won in {moves} moves!</p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">Moves: {moves}</p>
        )}
      </div>
    </div>
  );
}

export default MemoryGame;
