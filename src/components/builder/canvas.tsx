import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Grip } from "lucide-react";
import { type Item } from "./builder";
import { ResizableWidget } from "./resizable-widget";

export type CanvasProps = {
  items: Item[];
  onRemoveWidget: (id: string) => void;
  onSizeChange: (id: string, newSize: { width: number; height: number }) => void;
  onNameChange: (id: string, newName: string) => void;
  onPropChange: (id: string, newProps: Record<string, any>) => void;
};

export function Canvas({
  items,
  onRemoveWidget,
  onSizeChange,
  onNameChange,
  onPropChange,
}: CanvasProps) {
  const { setNodeRef } = useDroppable({
    id: "canvas-droppable",
  });

  return (
    <div ref={setNodeRef} className="flex-grow bg-secondary/30">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Grip className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold">Drag and Drop Widgets Here</p>
          <p>Start building your dashboard by dragging widgets from the sidebar.</p>
        </div>
      ) : (
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 auto-rows-[120px] h-full">
            {items.map((item) => (
              <ResizableWidget
                key={item.id}
                {...item}
                onRemove={onRemoveWidget}
                onSizeChange={onSizeChange}
                onNameChange={onNameChange}
                onPropChange={onPropChange}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
