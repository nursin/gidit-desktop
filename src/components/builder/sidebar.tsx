import { useDraggable } from "@dnd-kit/core";
import { Card } from "../../../app/renderer/src/components/ui/card";
import { WIDGETS, type WidgetId } from "../../../app/renderer/src/components/dashboard/dashboard";
import { ScrollArea } from "../../../app/renderer/src/components/ui/scroll-area";
import { GripVertical } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../app/renderer/src/components/ui/accordion";
import { useEffect, useState } from "react";

type ComponentSidebarProps = {
  widgets: typeof WIDGETS;
};

function SidebarItem({ widgetId }: { widgetId: WidgetId }) {
  const widget = WIDGETS[widgetId];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: widget.id,
    data: {
      isSidebarItem: true,
    },
  });

  return (
    <Card
      ref={setNodeRef as any}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold text-sm">{widget.name}</h4>
      </div>
    </Card>
  );
}

function SidebarItems({ widgets }: ComponentSidebarProps) {
  const categorizedWidgets = Object.values(widgets).reduce((acc, widget) => {
    const category = widget.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(widget.id as WidgetId);
    return acc;
  }, {} as Record<string, WidgetId[]>);

  return (
    <Accordion
      type="multiple"
      defaultValue={Object.keys(categorizedWidgets)}
      className="w-full pr-3"
    >
      {Object.entries(categorizedWidgets).map(([category, widgetIds]) => (
        <AccordionItem value={category} key={category}>
          <AccordionTrigger className="text-md font-medium">
            {category}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {widgetIds.map((widgetId) => (
                <SidebarItem key={widgetId} widgetId={widgetId} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ComponentSidebar({ widgets }: ComponentSidebarProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure this only renders client-only drag interactions in the renderer process
    setIsClient(true);
  }, []);

  return (
    <aside className="w-64 border-r bg-secondary/50 p-4">
      <h3 className="text-lg font-semibold mb-4">Component Palette</h3>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {isClient && <SidebarItems widgets={widgets} />}
      </ScrollArea>
    </aside>
  );
}
