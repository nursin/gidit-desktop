import React, { useState, useCallback } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Plus, X, Clipboard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';

type Note = {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
};

const colors = [
  'bg-yellow-200',
  'bg-blue-200',
  'bg-green-200',
  'bg-pink-200',
  'bg-purple-200',
];

const NOTE_MIN_WIDTH = 180;
const NOTE_MIN_HEIGHT = 180;
const NOTE_DEFAULT_WIDTH = 192;
const NOTE_DEFAULT_HEIGHT = 192;
const PLACEMENT_OFFSET = 20;

function StickyNote({
  note,
  onUpdate,
  onRemove,
  onSizeChange,
}: {
  note: Note;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
  onSizeChange: (id: string, size: { width: number; height: number }) => void;
}) {
  const [isResizing, setIsResizing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    disabled: isResizing,
  });

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startSize = note.size;
      const startX = e.clientX;
      const startY = e.clientY;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newWidth = Math.max(NOTE_MIN_WIDTH, startSize.width + dx);
        const newHeight = Math.max(NOTE_MIN_HEIGHT, startSize.height + dy);

        onSizeChange(note.id, { width: newWidth, height: newHeight });
      };

      const handlePointerUp = () => {
        setIsResizing(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [note.id, note.size, onSizeChange]
  );

  const style: React.CSSProperties = {
    transform: isDragging && transform ? CSS.Translate.toString(transform) : undefined,
    top: note.position.y,
    left: note.position.x,
    width: note.size.width,
    height: note.size.height,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('absolute p-2 rounded-md shadow-md flex flex-col', note.color, isDragging && 'z-10')}
    >
      <div {...listeners} {...attributes} className="cursor-grab p-1 flex-shrink-0">
        <div className="w-full h-4" />
      </div>
      <button
        onClick={() => onRemove(note.id)}
        className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-black/10 z-20"
        aria-label="Remove note"
      >
        <X className="w-3 h-3" />
      </button>
      <Textarea
        value={note.content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate(note.id, e.target.value)}
        className="w-full flex-grow bg-transparent border-0 resize-none focus-visible:ring-0 text-sm"
        placeholder="Type here..."
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
        onPointerDown={handleResizeStart}
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-black/40 absolute bottom-1 right-1" />
      </div>
    </div>
  );
}

export function StickyNoteBoard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const { setNodeRef } = useDroppable({
    id: 'sticky-note-canvas',
  });

  const isOverlapping = (noteA: Note, noteB: Note) => {
    return (
      noteA.position.x < noteB.position.x + noteB.size.width &&
      noteA.position.x + noteA.size.width > noteB.position.x &&
      noteA.position.y < noteB.position.y + noteB.size.height &&
      noteA.position.y + noteA.size.height > noteB.position.y
    );
  };

  const addNote = () => {
    let newPosition = { x: PLACEMENT_OFFSET, y: PLACEMENT_OFFSET };
    let positionFound = false;

    while (!positionFound) {
      const testNote: Note = {
        id: 'test',
        content: '',
        position: newPosition,
        size: { width: NOTE_DEFAULT_WIDTH, height: NOTE_DEFAULT_HEIGHT },
        color: '',
      };

      const overlapping = notes.some((note) => isOverlapping(testNote, note));

      if (!overlapping) {
        positionFound = true;
      } else {
        newPosition.x += PLACEMENT_OFFSET;
      }
    }

    const newNote: Note = {
      id: uuidv4(),
      content: '',
      position: newPosition,
      size: { width: NOTE_DEFAULT_WIDTH, height: NOTE_DEFAULT_HEIGHT },
      color: colors[notes.length % colors.length],
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
  };

  const updateNoteSize = (id: string, size: { width: number; height: number }) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, size } : n)));
  };

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === active.id) {
          return {
            ...note,
            position: {
              x: note.position.x + delta.x,
              y: note.position.y + delta.y,
            },
          };
        }
        return note;
      })
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clipboard className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Sticky Note Board</CardTitle>
              <CardDescription>Capture your ideas.</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={addNote}>
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <DndContext onDragEnd={handleDragEnd}>
          <div ref={setNodeRef} className="w-full h-full relative overflow-hidden bg-secondary/20">
            {notes.map((note) => (
              <StickyNote
                key={note.id}
                note={note}
                onUpdate={updateNoteContent}
                onRemove={removeNote}
                onSizeChange={updateNoteSize}
              />
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}
