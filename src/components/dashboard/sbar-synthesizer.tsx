import React, { useState, useTransition, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  FileText,
  Loader2,
  Upload,
  Lightbulb,
  FileDown,
  Presentation,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  synthesizeSbarReport,
  type SbarSynthesizerInput,
  type SbarSynthesizerOutput,
} from "../../services/ai";
import { useToast } from "../../hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

type DocumentFile = {
  fileName: string;
  dataUri: string;
};

type SbarSynthesizerProps = {
  name?: string;
};

export function SbarSynthesizer({
  name = "SBAR Synthesizer",
}: SbarSynthesizerProps) {
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [result, setResult] = useState<SbarSynthesizerOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    for (const file of Array.from(selectedFiles)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles((prev) => [
          ...prev,
          { fileName: file.name, dataUri: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // reset the input so same file can be re-selected if needed
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.fileName !== fileName));
  };

  const handleSynthesize = () => {
    if (notes.trim().length < 20) {
      toast({
        title: "Notes are too short",
        description: "Please provide more detail in your notes.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      setResult(null);
      try {
        const input: SbarSynthesizerInput = { notes, documents: files };
        // synthesizeSbarReport is implemented in renderer/service/ai and uses IPC to talk to Electron main
        const apiResult = await synthesizeSbarReport(input);
        setResult(apiResult);
      } catch (error) {
        console.error(error);
        toast({
          title: "An Error Occurred",
          description: "Could not synthesize the SBAR report. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownload = (content: string, fileName: string, mimeType: string) => {
    // For desktop apps it's preferable to use IPC to ask the main process to show a save dialog and write the file.
    // The services/ai wrapper may expose a saveFile method via IPC; if not available, fall back to the browser anchor approach.
    // Try to use window.api.saveFile if exposed by preload; otherwise fallback.
    const base64 = btoa(content);
    // Try IPC save first (preload may expose `window.api.saveFile`)
    // @ts-ignore - window.api may be provided by preload script
    if (typeof (window as any).api?.saveFile === "function") {
      // ask main to save a base64-encoded blob
      (window as any).api.saveFile({
        dataBase64: base64,
        fileName,
        mimeType,
      });
      toast({ title: `${fileName} save started.` });
      return;
    }

    // Fallback: create a download link in the renderer (works but less desktop-native)
    const link = document.createElement("a");
    link.href = `data:${mimeType};base64,${base64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: `${fileName} download started.` });
  };

  const generatePptxContent = (slides: SbarSynthesizerOutput["presentationSlides"]) => {
    // Placeholder: real PPTX generation should be done in main or via a library (pptxgenjs) in renderer.
    return slides
      .map(
        (slide) =>
          `Slide: ${slide.title}\n${slide.content.map((pt) => `- ${pt}`).join("\n")}\n\n`
      )
      .join("");
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              Generate evidence-based SBAR reports from notes and documents.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Paste your raw notes, clinical observations, and project ideas here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-grow min-h-[150px] resize-none"
            disabled={isPending}
          />
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,application/pdf"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.fileName}
                  className="flex items-center justify-between text-xs p-1 bg-secondary rounded"
                >
                  <span className="truncate">{file.fileName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeFile(file.fileName)}
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSynthesize} disabled={isPending || !notes.trim()}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Synthesize SBAR
          </Button>
        </div>

        {/* Output Column */}
        <ScrollArea className="h-full pr-4 -mr-4">
          <div className="flex flex-col gap-4">
            {isPending && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>SBAR Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Situation</h4>
                      <p className="text-sm text-muted-foreground">{result.situation}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Background</h4>
                      <p className="text-sm text-muted-foreground">{result.background}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Assessment</h4>
                      <p className="text-sm text-muted-foreground">{result.assessment}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recommendation</h4>
                      <p className="text-sm text-muted-foreground">{result.recommendation.text}</p>
                      <p className="text-sm mt-1">
                        <strong>Success Metrics:</strong> {result.recommendation.successMetrics}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Generated Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload(result.pdfContent, "sbar_report.txt", "text/plain")
                      }
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      SBAR Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload(
                          generatePptxContent(result.presentationSlides),
                          "sbar_presentation.txt",
                          "text/plain"
                        )
                      }
                    >
                      <Presentation className="mr-2 h-4 w-4" />
                      Presentation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Literature Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.literature.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center gap-2">
                          {item.status === "supporting" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <h5 className="font-semibold text-sm">{item.title}</h5>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{item.summary}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
            {!result && !isPending && (
              <div className="text-center text-muted-foreground pt-12">
                Your generated report will appear here.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
