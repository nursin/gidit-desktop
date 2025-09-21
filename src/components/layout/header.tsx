import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Command } from "lucide-react";

export function Header(): JSX.Element {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Command className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gidit</h1>
        </div>
        <Avatar>
          <AvatarImage
            src="https://placehold.co/100x100.png"
            alt="User avatar"
            data-ai-hint="person avatar"
          />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
