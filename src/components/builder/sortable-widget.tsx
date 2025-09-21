import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WIDGETS, type WidgetId } from "../dashboard/dashboard";
import { WidgetWrapper } from "./widget-wrapper";
import { cn } from "../../lib/utils";
import { cloneElement } from "react";

type SortableWidgetProps = {
  id: string;
  widgetId: WidgetId;
  width: number;
  height: number;
  onRemove: (id: string) => void;
  onSizeChange: (id: string, newSize: { width: number; height: number }) => void;
};

export function SortableWidget({
  id,
  widgetId,
  width,
  height,
  onRemove,
  onSizeChange,
}: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${width}`,
    gridRow: `span ${height}`,
  };

  const widget = WIDGETS[widgetId];

  // Clone the widget component to pass the size prop
  const componentWithSize =
    widget && widget.component ? cloneElement(widget.component, { width, height }) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("transition-all", isDragging && "opacity-50")}
    >
      <WidgetWrapper
        id={id}
        widgetId={widgetId}
        width={width}
        height={height}
        onRemove={onRemove}
        onSizeChange={onSizeChange}
        {...attributes}
        {...listeners}
      >
        {componentWithSize}
      </WidgetWrapper>
    </div>
  );
}
