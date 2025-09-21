import { useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  FileType,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";

export function WordProcessor({ name = "Word Processor" }: { name?: string }) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const execCmd = (command: string, value?: string) => {
    // document.execCommand is deprecated but still works for simple desktop apps.
    // Consider replacing with a modern editor lib if you need robust behavior.
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML.trim() === "") {
      editorRef.current.innerHTML = "<p>Start typing your document here...</p>";
    }
  }, []);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileType className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>A simple rich text editor.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border rounded-md bg-background/50 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => execCmd("undo")}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => execCmd("redo")}>
            <Redo className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="outline" size="icon" onClick={() => execCmd("bold")}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => execCmd("italic")}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => execCmd("underline")}
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => execCmd("strikeThrough")}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="outline"
            size="icon"
            onClick={() => execCmd("insertUnorderedList")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => execCmd("insertOrderedList")}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 border rounded-md overflow-auto bg-background">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            aria-label={`${name} editor`}
            className="prose dark:prose-invert max-w-none focus:outline-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
