import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Menu, Command } from "lucide-react";
import { cn } from "../../lib/utils";

export type NavigationBarProps = {
  name?: string;
  orientation?: "horizontal" | "vertical";
};

export function NavigationBar({
  name = "MyApp",
  orientation = "horizontal",
}: NavigationBarProps) {
  const isVertical = orientation === "vertical";

  return (
    <Card className="h-full w-full bg-transparent border-0 shadow-none">
      <CardContent className="p-0 h-full">
        <header
          className={cn(
            "flex w-full items-center justify-between p-2 border",
            isVertical ? "flex-col h-full" : "flex-row"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              isVertical ? "flex-col pb-4 border-b w-full" : "flex-row"
            )}
          >
            <Command className="h-6 w-6 text-primary" />
            <span className="font-semibold">{name}</span>
          </div>

          <nav
            className={cn(
              "flex items-center gap-2",
              isVertical ? "flex-col flex-grow py-4" : "hidden md:flex"
            )}
          >
            <Button variant="ghost">Home</Button>
            <Button variant="ghost">About</Button>
            <Button variant="ghost">Pricing</Button>
            <Button variant="ghost">Contact</Button>
          </nav>

          <div
            className={cn(
              "flex items-center gap-2",
              isVertical ? "flex-col pt-4 border-t w-full" : "flex-row"
            )}
          >
            <Button size={isVertical ? "default" : "sm"}>Sign In</Button>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        </header>
      </CardContent>
    </Card>
  );
}
