import { useState, useTransition, useMemo } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { triageBrainDump, type TriageBrainDumpOutput } from "../../services/ai";
import { BrainCircuit, Loader2, Book, Calendar, ClipboardCheck, DollarSign, GripVertical, Mic, MicOff } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { v4 as uuidv4 } from "uuid";
import { cn } from "../../lib/utils";
import { useVoiceRecognition } from "../../hooks/use-voice-recognition";

type TriageItem = {
  id: string;
  content: string;
  category: keyof TriageBrainDumpOutput;
};

const iconMap: Record<keyof TriageBrainDumpOutput, JSX.Element> = {
  tasks: <ClipboardCheck className="w-5 h-5 text-primary" />,
  notes: <Book className="w-5 h-5 text-primary" />,
  calendarEvents: <Calendar className="w-5 h-5 text-primary" />,
  finance: <DollarSign className="w-5 h-5 text-primary" />,
};

function DraggableItem({ item }: { item: TriageItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-2 p-2 bg-background rounded-md shadow-sm", isDragging && "opacity-50")}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <p className="text-xs flex-grow break-words">{item.content}</p>
    </div>
  );
}

function DropColumn({ id, title, items }: { id: keyof TriageBrainDumpOutput; title: string; items: TriageItem[] }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="p-3 bg-secondary/50 rounded-lg min-h-[100px]">
      <h3 className="font-semibold capitalize flex items-center gap-2 mb-2 text-sm">
        {iconMap[id]}
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <DraggableItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

type BrainDumpTriageProps = {
  name?: string;
};

export function BrainDumpTriage({ name = "Brain Dump Triage" }: BrainDumpTriageProps) {
  const [brainDump, setBrainDump] = useState("");
  const [items, setItems] = useState<TriageItem[]>([]);
  const [activeItem, setActiveItem] = useState<TriageItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { isRecording, transcript, start, stop } = useVoiceRecognition({
    onTranscriptChange: (newTranscript) => {
      setBrainDump((prev) => (prev ? `${prev} ${newTranscript}` : newTranscript));
    },
  });

  const handleTriage = () => {
    startTransition(async () => {
      const result = await triageBrainDump({ brainDump });
      const newItems: TriageItem[] = [];
      (Object.keys(result) as Array<keyof TriageBrainDumpOutput>).forEach((category) => {
        result[category].forEach((content) => {
          newItems.push({ id: uuidv4(), content, category });
        });
      });
      setItems(newItems);
    });
  };

  const handleDragStart = (event: any) => {
    setActiveItem(event.active.data.current as TriageItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const next = prev.map((p) => ({ ...p }));
        const activeIndex = next.findIndex((item) => item.id === active.id);
        if (activeIndex === -1) return prev;
        if (next[activeIndex].category !== (over.id as keyof TriageBrainDumpOutput)) {
          next[activeIndex].category = over.id as keyof TriageBrainDumpOutput;
          return next;
        }
        return prev;
      });
    }
  };

  const columns = useMemo(
    () =>
      [
        { id: "tasks", title: "Tasks" },
        { id: "notes", title: "Notes" },
        { id: "calendarEvents", title: "Calendar Events" },
        { id: "finance", title: "Finance" },
      ] as const,
    []
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>Let AI sort your thoughts.</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4 min-h-0">
        <Textarea
          placeholder="Pour your thoughts here..."
          className="flex-grow min-h-[60px] resize-none text-sm"
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={handleTriage} disabled={isPending || !brainDump} className="flex-grow">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Triage Now
          </Button>
          <Button onClick={isRecording ? stop : start} variant={isRecording ? "destructive" : "outline"} size="icon">
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </div>
        {items.length > 0 && (
          <ScrollArea className="flex-1">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-6">
                {columns.map((col) => {
                  const colItems = items.filter((item) => item.category === col.id);
                  if (colItems.length === 0) return null;
                  return <DropColumn key={col.id} id={col.id} title={col.title} items={colItems} />;
                })}
              </div>
              <DragOverlay>{activeItem ? <DraggableItem item={activeItem} /> : null}</DragOverlay>
            </DndContext>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
