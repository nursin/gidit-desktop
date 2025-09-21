import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Hand, Scissors, Bot } from "lucide-react";

type Choice = "rock" | "paper" | "scissors";
const choices: Choice[] = ["rock", "paper", "scissors"];

const choiceIcons: Record<Choice, JSX.Element> = {
  rock: <Hand className="w-8 h-8 rotate-90" />,
  paper: <Hand className="w-8 h-8" />,
  scissors: <Scissors className="w-8 h-8" />,
};

export function RockPaperScissors({ name = "Rock Paper Scissors" }: { name?: string }) {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);

  const handlePlay = (choice: Choice) => {
    const comp = choices[Math.floor(Math.random() * choices.length)];
    setPlayerChoice(choice);
    setComputerChoice(comp);

    if (choice === comp) {
      setResult("draw");
    } else if (
      (choice === "rock" && comp === "scissors") ||
      (choice === "scissors" && comp === "paper") ||
      (choice === "paper" && comp === "rock")
    ) {
      setResult("win");
    } else {
      setResult("lose");
    }
  };

  const getResultText = () => {
    if (!result) return "Choose your weapon!";
    switch (result) {
      case "win":
        return "You Win!";
      case "lose":
        return "You Lose!";
      case "draw":
        return "It's a Draw!";
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Hand className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>A quick game of chance.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <div className="flex justify-around w-full items-center">
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold">You</span>
            <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center text-primary">
              {playerChoice ? choiceIcons[playerChoice] : "?"}
            </div>
          </div>
          <span className="font-bold text-lg">vs</span>
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold">Bot</span>
            <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center text-destructive">
              {computerChoice ? choiceIcons[computerChoice] : <Bot className="w-8 h-8" />}
            </div>
          </div>
        </div>
        <p className="font-bold text-xl h-6">{getResultText()}</p>
        <div className="flex gap-2">
          {choices.map((c) => (
            <Button
              key={c}
              variant="outline"
              size="icon"
              className="w-12 h-12"
              onClick={() => handlePlay(c)}
            >
              {choiceIcons[c]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RockPaperScissors;
