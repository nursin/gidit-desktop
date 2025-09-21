import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Coffee, Wind, Footprints } from "lucide-react";

type BreakPromptTileProps = {
  name?: string;
};

const breakSuggestions = [
  { text: "Stretch for 5 minutes.", icon: <Footprints className="w-8 h-8 text-primary" /> },
  { text: "Get some fresh air.", icon: <Wind className="w-8 h-8 text-primary" /> },
  { text: "Grab a cup of coffee or tea.", icon: <Coffee className="w-8 h-8 text-primary" /> },
  {
    text: "Do a quick meditation.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M12 2a10 10 0 1 0 10 10c0-2.3-1.3-4-3-5" />
        <path d="M9 13.5c0 .8.5 1.5 1.2 1.5s1.2-.8 1.2-1.5c0-.8-.5-1.5-1.2-1.5s-1.2.7-1.2 1.5Z" />
        <path d="M15.5 11c.8 0 1.5.5 1.5 1.2s-.7 1.2-1.5 1.2c-.8 0-1.5-.5-1.5-1.2s.7-1.2 1.5-1.2Z" />
        <path d="M18 10c.8 0 1.5.5 1.5 1.2s-.7 1.2-1.5 1.2c-.8 0-1.5-.5-1.5-1.2s.7-1.2 1.5-1.2Z" />
        <path d="M6 10c.8 0 1.5.5 1.5 1.2S6.8 12.4 6 12.4c-.8 0-1.5-.5-1.5-1.2S5.2 10 6 10Z" />
      </svg>
    ),
  },
];

export function BreakPromptTile({ name = "Time for a Break?" }: BreakPromptTileProps) {
  const [suggestion, setSuggestion] = useState(breakSuggestions[0]);

  const getNewSuggestion = () => {
    let newSuggestion = suggestion;
    // Ensure we pick a different suggestion than the current one
    if (breakSuggestions.length > 1) {
      do {
        newSuggestion = breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)];
      } while (newSuggestion.text === suggestion.text);
    }
    setSuggestion(newSuggestion);
  };

  useEffect(() => {
    getNewSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Coffee className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Rest is productive too.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center text-center gap-4">
        {suggestion.icon}
        <p className="text-lg font-medium">{suggestion.text}</p>
        <Button onClick={getNewSuggestion} variant="outline">
          New Suggestion
        </Button>
      </CardContent>
    </Card>
  );
}
