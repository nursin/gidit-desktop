import { templates, type Template } from "./template-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../../../0renderer/src/components/ui/button";
import { ScrollArea } from "../ui/scroll-area";
import type { Item } from "./builder";
import { WIDGETS } from "../dashboard/dashboard";
import { cloneElement } from "react";
import { cn } from "../../lib/utils";

type TemplatePreviewProps = {
  items: Omit<Item, "id">[];
};

function TemplatePreview({ items }: TemplatePreviewProps) {
  // Define a smaller base size for the preview grid cells
  const cellHeight = 30; // 1/4 of the real canvas cell height
  const gap = 4; // 1/4 of the real canvas gap

  // Calculate the total height of the grid based on the items
  const maxRow = items.reduce((max, item) => {
    // Assuming items don't have row/col positions, just spans.
    // A more robust implementation would calculate position.
    // For now, let's assume a simple layout or just calculate total height needed.
    return Math.max(max, item.height);
  }, 0);

  // A fixed height is simpler for this preview
  const containerHeight = 8 * (cellHeight + gap);

  return (
    <div
      className="aspect-video bg-secondary/30 rounded-md overflow-hidden p-2 relative"
      style={{ height: `${containerHeight}px` }}
    >
      <div
        className="grid grid-cols-4"
        style={{
          gap: `${gap}px`,
          gridAutoRows: `${cellHeight}px`,
        }}
      >
        {items.map((item, index) => {
          const widget = WIDGETS[item.widgetId];
          if (!widget) return null;

          return (
            <div
              key={index}
              className="bg-background rounded-sm border overflow-hidden"
              style={{
                gridColumn: `span ${item.width}`,
                gridRow: `span ${item.height}`,
              }}
            >
              <div className="origin-top-left pointer-events-none" style={{ transform: "scale(0.15)", transformOrigin: "0 0" }}>
                <div className={cn("w-[26rem] h-auto", item.widgetId === "CalendarCard" && "h-[48rem]")}>
                  {cloneElement(widget.component, { name: "" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type TemplatesProps = {
  onUseTemplate: (template: Template) => void;
};

export function Templates({ onUseTemplate }: TemplatesProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Template Gallery</h1>
        <p className="text-muted-foreground text-sm">Choose a starting point for your new page.</p>
      </header>
      <ScrollArea className="flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between gap-4">
                <TemplatePreview items={template.items} />
                <Button onClick={() => onUseTemplate(template)} className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
