import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

type AppSearchProps = {
  name?: string;
};

export function AppSearch({ name = "App Search" }: AppSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSearch = () => {
    // Trigger local search logic or IPC to main process here.
    console.log("Searching for:", searchQuery);
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Search your entire knowledge base.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <div className="w-full max-w-sm flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Find anything..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} aria-label="Search">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
