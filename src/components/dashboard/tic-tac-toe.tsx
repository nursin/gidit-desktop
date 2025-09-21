import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Gamepad2, RotateCw } from "lucide-react";
import { cn } from "../../lib/utils";

type Player = "X" | "O" | null;

const calculateWinner = (squares: Player[]): Player => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

export function TicTacToe({ name = "Tic-Tac-Toe" }: { name?: string }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const newBoard = board.slice();
    newBoard[i] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const getStatus = () => {
    if (winner) return `Winner: ${winner}!`;
    if (isDraw) return "It's a draw!";
    return `Next player: ${isXNext ? "X" : "O"}`;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>A classic game of strategy.</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={resetGame}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <p className="font-semibold">{getStatus()}</p>
        <div className="grid grid-cols-3 gap-2">
          {board.map((value, i) => (
            <button
              key={i}
              className={cn(
                "w-16 h-16 flex items-center justify-center text-3xl font-bold rounded-md bg-secondary",
                value === "X" ? "text-primary" : "text-destructive"
              )}
              onClick={() => handleClick(i)}
              disabled={!!value || !!winner}
            >
              {value}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TicTacToe;
