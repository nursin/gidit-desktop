import React, { useState, useTransition, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Stethoscope, Loader2, Upload, FileText } from "lucide-react";
import { generateHealthSummary } from "../../services/ai";
import { Input } from "../ui/input";

type HealthSummaryProps = {
  name?: string;
};

export function HealthSummary({ name = "Health Summary" }: HealthSummaryProps) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSummary(""); // Clear previous summary

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string | null;
      if (!dataUri) return;

      startTransition(async () => {
        try {
          const result = await generateHealthSummary({ documentDataUri: dataUri });
          setSummary(result?.comprehensiveSummary ?? "");
        } catch (err) {
          console.error("Error generating health summary", err);
          setSummary("An error occurred while generating the summary.");
        }
      });
    };
    reader.readAsDataURL(file);

    // Reset file input to allow uploading the same file again
    if (event.currentTarget) {
      event.currentTarget.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Upload a document to generate an H&P.</CardDescription>
            </div>
          </div>
          <div>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <Button onClick={handleUploadClick} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Document
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full p-4 border rounded-md bg-background/50">
          <h3 className="font-semibold mb-2">Comprehensive Summary</h3>
          {fileName && (
            <p className="text-xs text-muted-foreground mb-2">Source: {fileName}</p>
          )}

          {isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Analyzing document and generating summary...</p>
            </div>
          ) : summary ? (
            <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
              {summary}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <p>The generated H&P report will appear here.</p>
              <p className="text-xs">Upload a medical document to begin.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
