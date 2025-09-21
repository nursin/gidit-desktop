import React, { useState, useCallback, cloneElement } from 'react';
import { WIDGETS } from "../../../app/renderer/src/components/dashboard/dashboard";
import { WidgetWrapper } from "./widget-wrapper";
import { cn } from "../../lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from './builder';

type ResizableWidgetProps = Item & {
    onRemove: (id: string) => void;
    onSizeChange: (id: string, newSize: { width: number; height: number }) => void;
    onNameChange: (id: string, newName: string) => void;
    onPropChange: (id: string, newProps: Record<string, any>) => void;
};

const CELL_HEIGHT = 120; // Corresponds to auto-rows-[120px]
const GAP = 16; // Corresponds to gap-4

export function ResizableWidget({
    id,
    widgetId,
    name,
    width,
    height,
    onRemove,
    onSizeChange,
    onNameChange,
    onPropChange,
    ...props
}: ResizableWidgetProps) {
    const [isResizing, setIsResizing] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id,
        disabled: isResizing,
        data: {
            type: 'Widget',
            widgetId,
        }
    });

    const widget = WIDGETS[widgetId];

    // Gracefully handle cases where a widgetId from persisted state might not exist anymore.
    if (!widget) {
        return null;
    }

    const handleResizeStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const grid = (e.target as HTMLElement).closest('.grid');
        if (!grid) return;

        const gridRect = grid.getBoundingClientRect();
        const startWidth = width;
        const startHeight = height;
        const startX = e.clientX;
        const startY = e.clientY;

        const cellWidth = (gridRect.width - (3 * GAP)) / 4;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            const widthChange = Math.round(dx / (cellWidth + GAP));
            const heightChange = Math.round(dy / (CELL_HEIGHT + GAP));

            const newWidth = Math.max(1, Math.min(4, startWidth + widthChange));
            const newHeight = Math.max(1, Math.min(8, startHeight + heightChange));

            if (newWidth !== width || newHeight !== height) {
                onSizeChange(id, { width: newWidth, height: newHeight });
            }
        };

        const handlePointerUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }, [width, height, onSizeChange, id]);

    const style: React.CSSProperties = {
        gridColumn: `span ${width}`,
        gridRow: `span ${height}`,
        transform: CSS.Transform.toString(transform),
        transition: isResizing ? 'none' : transition,
    };

    const displayName = name || widget.name;
    const componentWithProps = cloneElement(widget.component, { width, height, name: displayName, ...props });

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative transition-all",
                isDragging && "opacity-50 z-10",
            )}
        >
            <WidgetWrapper
                id={id}
                widgetId={widgetId}
                name={name}
                width={width}
                height={height}
                onRemove={onRemove}
                onSizeChange={onSizeChange}
                onNameChange={onNameChange}
                onPropChange={onPropChange}
                {...props}
                {...attributes}
                {...listeners}
            >
                {componentWithProps}
            </WidgetWrapper>
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
                onPointerDown={handleResizeStart}
            >
                <div className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground absolute bottom-1 right-1" />
            </div>
        </div>
    );
}
