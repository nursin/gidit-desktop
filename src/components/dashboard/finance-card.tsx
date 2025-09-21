import React, { useState, useTransition, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { extractReceiptData, type ReceiptData } from "../../services/ai";
import { Banknote, TrendingUp, Upload, Loader2, Receipt } from "lucide-react";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../ui/table";
import { useSettings } from "../../context/settings-context";
import { useToast } from "../../hooks/use-toast";

type FinanceCardProps = {
  name?: string;
};

const preprocessImage = (file: File, maxDimension: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }

        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height *= maxDimension / width;
            width = maxDimension;
          } else {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Enhance contrast and convert to grayscale
        ctx.filter = "contrast(1.5) grayscale(1)";
        ctx.drawImage(img, 0, 0, width, height);

        // Use JPEG with a quality setting for smaller file size
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function FinanceCard({ name = "Finance Overview" }: FinanceCardProps) {
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { aiProvider, apiKeys } = useSettings();
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUri = await preprocessImage(file, 1024);

      startTransition(async () => {
        setExtractedData(null);
        try {
          // extractReceiptData is implemented in renderer/services/ai.ts
          // which calls the Electron preload/API to run the local model or Python script.
          const result = await extractReceiptData({
            receiptDataUri: dataUri,
            config: {
              provider: aiProvider,
              apiKey: apiKeys[aiProvider],
            },
          });
          setExtractedData(result);
        } catch (error: any) {
          console.error(error);
          toast({
            title: "Error Extracting Data",
            description:
              error?.message || "Could not process the receipt. Please check your settings and try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Image processing error:", error);
      toast({
        title: "Image Processing Error",
        description: "There was an issue processing your image. Please try another one.",
        variant: "destructive",
      });
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleUploadClick = () => {
    const currentApiKey = apiKeys[aiProvider];
    if (!currentApiKey) {
      toast({
        title: "API Key Missing",
        description: `Please set your ${aiProvider} API key in App Settings.`,
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Banknote className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Track spending and upload receipts.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow min-h-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-medium">Monthly Budget</p>
            <p className="text-green-600 font-semibold">$1,250 / $2,000</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "62.5%" }}></div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground pt-2">
            <TrendingUp className="w-4 h-4 mr-2 text-primary" />
            <p>Spending is on track for this month.</p>
          </div>
        </div>
        <Separator className="my-6 flex-shrink-0" />
        <div className="flex flex-col flex-grow min-h-0">
          <h4 className="font-semibold mb-2 flex items-center gap-2 flex-shrink-0">
            <Receipt className="w-5 h-5 text-primary" /> Receipt OCR
          </h4>
          <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <Button onClick={handleUploadClick} disabled={isPending} className="flex-shrink-0">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Receipt
          </Button>
          <ScrollArea className="mt-4 flex-grow -mx-6">
            <div className="px-6">
              {isPending && (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {extractedData && (
                <div className="p-4 bg-secondary/50 rounded-lg text-sm border">
                  <div className="text-center mb-4">
                    <h5 className="font-bold text-lg">{extractedData.store.name || "Store Name"}</h5>
                    <p className="text-xs text-muted-foreground">{extractedData.store.address}</p>
                    <p className="text-xs text-muted-foreground">{extractedData.store.phone}</p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{extractedData.transaction.date}</span>
                    <span>{extractedData.transaction.time}</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8">Item</TableHead>
                        <TableHead className="h-8 text-center">Qty</TableHead>
                        <TableHead className="h-8 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium py-1">{item.description}</TableCell>
                          <TableCell className="text-center py-1">{item.quantity}</TableCell>
                          <TableCell className="text-right py-1">
                            ${item.total_price?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-semibold">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${extractedData.totals.subtotal?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-semibold">
                          Taxes
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${extractedData.totals.taxes?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="text-lg">
                        <TableCell colSpan={2} className="text-right font-bold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${extractedData.totals.total?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <div className="text-center mt-4 text-xs text-muted-foreground">
                    <p>
                      Paid with {extractedData.payment.type}{" "}
                      {extractedData.payment.card_last_four ? `ending in ${extractedData.payment.card_last_four}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
