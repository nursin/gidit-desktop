import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { Lightbulb, Loader2, HelpCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { generateForgettingSuggestions, type GenerateForgettingSuggestionsOutput } from "../../services/ai";

type WhatAmIForgettingProps = {
  name?: string;
};

type Suggestion = GenerateForgettingSuggestionsOutput["suggestions"][0] & {
  checked: boolean;
};

export function WhatAmIForgetting({ name = "What Am I Forgetting?" }: WhatAmIForgettingProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      setSuggestions([]);
      try {
        const result = await generateForgettingSuggestions();
        const suggestionsWithChecked = result.suggestions.map((s) => ({ ...s, checked: false }));
        setSuggestions(suggestionsWithChecked);
      } catch (err) {
        console.error("Failed to generate forgetting suggestions:", err);
        // Keep UI simple: leave suggestions empty on error.
      }
    });
  };

  const handleCheck = (index: number) => {
    setSuggestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], checked: !next[index].checked };
      return next;
    });
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Get a quick checklist for your brain.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow min-h-0 gap-4">
        <ScrollArea className="flex-grow -mx-6">
          <div className="px-6 space-y-3">
            {isPending && (
              <>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </>
            )}

            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-background/50 rounded-md"
                >
                  <Checkbox
                    id={`item-${index}`}
                    checked={item.checked}
                    onCheckedChange={() => handleCheck(index)}
                  />
                  <label
                    htmlFor={`item-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow"
                  >
                    {item.suggestion}
                  </label>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              ))
            ) : (
              !isPending && (
                <div className="text-center text-muted-foreground pt-12">
                  <p>Click the button to generate a list of things you might be forgetting.</p>
                </div>
              )
            )}
          </div>
        </ScrollArea>

        <Button onClick={handleGenerate} disabled={isPending} className="flex-shrink-0">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Generate Checklist
        </Button>
      </CardContent>
    </Card>
  );
}

export default WhatAmIForgetting;
