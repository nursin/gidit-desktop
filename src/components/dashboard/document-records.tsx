import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { extractDocumentDetails, type DocumentDetails } from "../../services/ai";
import { generateHealthSummary, type GenerateHealthSummaryOutput } from "../../services/ai";
import { extractReceiptData, type ReceiptData } from "../../services/ai";
import { FileArchive, Upload, Loader2, FileText, Banknote, Heart, FileQuestion, Pill, CreditCard, Printer, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { v4 as uuidv4 } from 'uuid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../ui/table";
import { useSettings } from "../../context/settings-context";
import { useToast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";
import { Textarea } from "../ui/textarea";

type DocumentRecord = {
  id: string;
  fileName: string;
  dataUri: string;
  uploadedAt: Date;
  classification?: DocumentDetails;
  details?: ReceiptData | GenerateHealthSummaryOutput | DocumentDetails;
  status: 'classifying' | 'extracting' | 'complete' | 'error';
};

const EditableField = ({ value, onChange, className, as = "input", type = "text" }: { value: string | number | null | undefined, onChange: (value: string) => void, className?: string, as?: 'input' | 'textarea', type?: string }) => {
  const Component: any = as === 'textarea' ? Textarea : Input;
  const props: any = {
    value: value ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className: cn("w-full bg-transparent border-none focus:ring-1 focus:ring-primary focus:bg-background rounded-sm p-0.5 -m-0.5 h-auto", className),
    ...(as === 'input' && { type: type })
  };
  return <Component {...props} />;
};

function ReceiptDisplay({ data, onUpdate }: { data: ReceiptData, onUpdate: (updatedData: ReceiptData) => void }) {

  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    let current = { ...data };
    let pointer: any = current;
    for (let i = 0; i < keys.length - 1; i++) {
      pointer = pointer[keys[i]];
    }
    pointer[keys[keys.length - 1]] = value;
    onUpdate(current);
  };

  const handleItemChange = (index: number, field: keyof ReceiptData['items'][0], value: any) => {
    const newItems = [...data.items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price_per_unit') {
      item.total_price = (Number(item.quantity) || 0) * (Number(item.price_per_unit) || 0);
    }
    newItems[index] = item;
    onUpdate({ ...data, items: newItems });
  };

  const handleAddItem = () => {
    const newItem = {
      description: "New Item",
      price_per_unit: 0,
      quantity: 1,
      total_price: 0,
    };
    onUpdate({ ...data, items: [...data.items, newItem] });
  };

  return (
    <div className="p-4 bg-background/50 rounded-lg text-sm border">
      <div className="text-center mb-4">
        <EditableField value={data.store.name} onChange={v => handleFieldChange('store.name', v)} className="font-bold text-lg text-center" />
        <EditableField value={data.store.address} onChange={v => handleFieldChange('store.address', v)} className="text-xs text-muted-foreground text-center" />
        <EditableField value={data.store.phone} onChange={v => handleFieldChange('store.phone', v)} className="text-xs text-muted-foreground text-center" />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <EditableField value={data.transaction.date} onChange={v => handleFieldChange('transaction.date', v)} />
        <EditableField value={data.transaction.time} onChange={v => handleFieldChange('transaction.time', v)} />
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
          {data.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium py-1">
                <EditableField value={item.description} onChange={v => handleItemChange(index, 'description', v)} />
              </TableCell>
              <TableCell className="text-center py-1">
                <EditableField value={item.quantity} onChange={v => handleItemChange(index, 'quantity', Number(v))} type="number" className="text-center" />
              </TableCell>
              <TableCell className="text-right py-1">
                <EditableField value={item.total_price?.toFixed(2)} onChange={v => handleItemChange(index, 'total_price', Number(v))} type="number" className="text-right" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>
              <Button variant="ghost" size="sm" onClick={handleAddItem} className="w-full justify-start text-xs">
                <Plus className="w-3 h-3 mr-2" /> Add Item
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="text-right font-semibold">Subtotal</TableCell>
            <TableCell className="text-right font-semibold">
              <EditableField value={data.totals.subtotal?.toFixed(2)} onChange={v => handleFieldChange('totals.subtotal', Number(v))} type="number" className="text-right font-semibold" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="text-right font-semibold">Taxes</TableCell>
            <TableCell className="text-right font-semibold">
              <EditableField value={data.totals.taxes?.toFixed(2)} onChange={v => handleFieldChange('totals.taxes', Number(v))} type="number" className="text-right font-semibold" />
            </TableCell>
          </TableRow>
          <TableRow className="text-lg">
            <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">
              <EditableField value={data.totals.total?.toFixed(2)} onChange={v => handleFieldChange('totals.total', Number(v))} type="number" className="text-right font-bold text-lg" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="text-center mt-4 text-xs text-muted-foreground">
        <EditableField value={`Paid with ${data.payment.type} ${data.payment.card_last_four ? `ending in ${data.payment.card_last_four}` : ''}`} onChange={v => { }} className="text-center" />
      </div>
    </div>
  );
}

function HealthSummaryDisplay({ data, onUpdate }: { data: GenerateHealthSummaryOutput, onUpdate: (data: GenerateHealthSummaryOutput) => void }) {
  return (
    <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap p-4 bg-background/50 rounded-md border">
      <h3 className="font-semibold mb-2">Comprehensive Summary (H&P)</h3>
      <Textarea
        value={data.comprehensiveSummary}
        onChange={(e) => onUpdate({ comprehensiveSummary: e.target.value })}
        className="w-full bg-transparent border-none p-0 focus:ring-0 h-96 resize-none"
      />
    </div>
  );
}

function BankStatementDisplay({ data, onUpdate }: { data: DocumentDetails, onUpdate: (data: DocumentDetails) => void }) {
  const details = data.statementDetails;
  if (!details) return <DefaultDisplay data={data} onUpdate={onUpdate} />;

  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    let current: any = { ...data };
    let pointer: any = current;
    for (let i = 0; i < keys.length - 1; i++) {
      pointer = pointer[keys[i]];
    }
    pointer[keys[keys.length - 1]] = value;
    onUpdate(current);
  };

  const handleTransactionChange = (index: number, field: keyof NonNullable<typeof details.transactions>[0], value: any) => {
    const newTransactions = [...(details.transactions || [])];
    newTransactions[index] = { ...newTransactions[index], [field]: value };
    handleFieldChange('statementDetails.transactions', newTransactions);
  };

  const handleAddTransaction = () => {
    const newTransaction = {
      date: new Date().toLocaleDateString(),
      description: "New Transaction",
      amount: 0,
    };
    const updatedTransactions = [...(details.transactions || []), newTransaction];
    handleFieldChange('statementDetails.transactions', updatedTransactions);
  };


  return (
    <div className="p-4 bg-background/50 rounded-lg text-sm border space-y-4">
      <div className="flex justify-between items-start border-b pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <EditableField value={data.title} onChange={v => handleFieldChange('title', v)} className="font-bold text-lg" />
          </div>
          <EditableField value={`Account: ${details.accountNumber || 'N/A'}`} onChange={v => handleFieldChange('statementDetails.accountNumber', v.replace('Account: ', ''))} className="text-xs text-muted-foreground" />
          <EditableField value={`Period: ${details.statementPeriod || data.date || 'N/A'}`} onChange={v => handleFieldChange('statementDetails.statementPeriod', v.replace('Period: ', ''))} className="text-xs text-muted-foreground" />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Closing Balance</p>
          <EditableField value={details.closingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} onChange={v => handleFieldChange('statementDetails.closingBalance', Number(v))} type="number" className="font-bold text-2xl text-primary text-right" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8">Date</TableHead>
            <TableHead className="h-8">Description</TableHead>
            <TableHead className="h-8 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.transactions?.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="py-1 text-xs">
                <EditableField value={item.date} onChange={v => handleTransactionChange(index, 'date', v)} />
              </TableCell>
              <TableCell className="font-medium py-1">
                <EditableField value={item.description} onChange={v => handleTransactionChange(index, 'description', v)} />
              </TableCell>
              <TableCell className={cn("py-1 font-mono", (item.amount || 0) > 0 ? "text-green-600" : "")}>
                <EditableField value={item.amount} onChange={v => handleTransactionChange(index, 'amount', Number(v))} type="number" className="text-right" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>
              <Button variant="ghost" size="sm" onClick={handleAddTransaction} className="w-full justify-start text-xs">
                <Plus className="w-3 h-3 mr-2" /> Add Transaction
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="text-right font-semibold">Opening Balance</TableCell>
            <TableCell className="text-right font-semibold font-mono">
              <EditableField value={details.openingBalance?.toFixed(2)} onChange={v => handleFieldChange('statementDetails.openingBalance', Number(v))} type="number" className="text-right font-semibold" />
            </TableCell>
          </TableRow>
          <TableRow className="text-base">
            <TableCell colSpan={2} className="text-right font-bold">Closing Balance</TableCell>
            <TableCell className="text-right font-bold font-mono">
              <EditableField value={details.closingBalance?.toFixed(2)} onChange={v => handleFieldChange('statementDetails.closingBalance', Number(v))} type="number" className="text-right font-bold" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

function PharmacyRecordDisplay({ data, onUpdate }: { data: DocumentDetails, onUpdate: (data: DocumentDetails) => void }) {
  const details = data.pharmacyDetails;
  if (!details) return <DefaultDisplay data={data} onUpdate={onUpdate} />;

  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    let current: any = { ...data };
    let pointer: any = current;
    for (let i = 0; i < keys.length - 1; i++) {
      pointer = pointer[keys[i]];
    }
    pointer[keys[keys.length - 1]] = value;
    onUpdate(current);
  };

  return (
    <div className="p-4 bg-background/50 rounded-lg text-sm border space-y-4">
      <div className="flex justify-between items-start border-b pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <EditableField value={details.pharmacy} onChange={v => handleFieldChange('pharmacyDetails.pharmacy', v)} className="font-bold text-lg" />
          </div>
          <EditableField value={`Fill Date: ${details.fillDate || data.date || 'N/A'}`} onChange={v => handleFieldChange('pharmacyDetails.fillDate', v.replace('Fill Date: ', ''))} className="text-xs text-muted-foreground" />
        </div>
        {details.rxNumber && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Rx Number</p>
            <EditableField value={details.rxNumber} onChange={v => handleFieldChange('pharmacyDetails.rxNumber', v)} className="font-mono font-bold text-lg text-right" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Medication</p>
          <EditableField value={details.medication} onChange={v => handleFieldChange('pharmacyDetails.medication', v)} className="font-semibold" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Quantity</p>
          <EditableField value={details.quantity} onChange={v => handleFieldChange('pharmacyDetails.quantity', Number(v))} type="number" className="font-semibold" />
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Dosage</p>
          <EditableField value={details.dosage} onChange={v => handleFieldChange('pharmacyDetails.dosage', v)} className="font-semibold" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prescribing Doctor</p>
          <EditableField value={details.prescribingDoctor} onChange={v => handleFieldChange('pharmacyDetails.prescribingDoctor', v)} className="font-semibold" />
        </div>
      </div>
      {data.fullText && (
        <div>
          <h6 className="font-semibold text-xs mb-1">Full Text</h6>
          <Textarea value={data.fullText} onChange={(e) => handleFieldChange('fullText', e.target.value)} className="p-2 bg-secondary rounded-md max-h-48 h-48 resize-none text-xs" />
        </div>
      )}
    </div>
  );
}

function GenericFinancialDisplay({ data, onUpdate }: { data: DocumentDetails, onUpdate: (data: DocumentDetails) => void }) {
  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    let current: any = { ...data };
    let pointer: any = current;
    for (let i = 0; i < keys.length - 1; i++) {
      pointer = pointer[keys[i]];
    }
    pointer[keys[keys.length - 1]] = value;
    onUpdate(current);
  };

  return (
    <Card className="p-4 bg-background/50 border">
      <CardHeader className="p-2">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-primary" />
          <EditableField value={data.title} onChange={v => handleFieldChange('title', v)} className="text-lg font-semibold" />
        </div>
        <EditableField value={`Date: ${data.date || 'N/A'}`} onChange={v => handleFieldChange('date', v.replace('Date: ', ''))} className="text-sm text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-2 space-y-4">
        {data.totalAmount !== null && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <EditableField value={data.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} onChange={v => handleFieldChange('totalAmount', Number(v))} type="number" className="font-bold text-2xl text-primary text-right" />
          </div>
        )}
        <div>
          <h6 className="font-semibold text-xs mb-1">Summary</h6>
          <EditableField as="textarea" value={data.summary} onChange={v => handleFieldChange('summary', v)} className="text-sm text-muted-foreground" />
        </div>
        {data.fullText && (
          <div>
            <h6 className="font-semibold text-xs mb-1">Full Text</h6>
            <Textarea value={data.fullText} onChange={(e) => handleFieldChange('fullText', e.target.value)} className="p-2 bg-secondary rounded-md max-h-48 h-48 resize-none text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GenericHealthDisplay({ data, onUpdate }: { data: DocumentDetails, onUpdate: (data: DocumentDetails) => void }) {
  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    let current: any = { ...data };
    let pointer: any = current;
    for (let i = 0; i < keys.length - 1; i++) {
      pointer = pointer[keys[i]];
    }
    pointer[keys[keys.length - 1]] = value;
    onUpdate(current);
  };

  return (
    <Card className="p-4 bg-background/50 border">
      <CardHeader className="p-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          <EditableField value={data.title} onChange={v => handleFieldChange('title', v)} className="text-lg font-semibold" />
        </div>
        <EditableField value={`Date: ${data.date || 'N/A'}`} onChange={v => handleFieldChange('date', v.replace('Date: ', ''))} className="text-sm text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-2 space-y-2">
        <div>
          <h6 className="font-semibold text-xs mb-1">Summary</h6>
          <EditableField as="textarea" value={data.summary} onChange={v => handleFieldChange('summary', v)} className="text-sm text-muted-foreground" />
        </div>
        {data.fullText && (
          <div>
            <h6 className="font-semibold text-xs mb-1">Full Text</h6>
            <Textarea value={data.fullText} onChange={(e) => handleFieldChange('fullText', e.target.value)} className="p-2 bg-secondary rounded-md max-h-48 h-48 resize-none text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DefaultDisplay({ data, onUpdate }: { data: DocumentDetails, onUpdate: (data: DocumentDetails) => void }) {
  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.');
    let current: any = { ...data };
    let pointer: any = current;
    for (let i = 0; i < keys.length - 1; i++) {
      pointer = pointer[keys[i]];
    }
    pointer[keys[keys.length - 1]] = value;
    onUpdate(current);
  };

  return (
    <Card className="p-4 bg-background/50 border">
      <CardHeader className="p-2">
        <div className="flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-primary" />
          <EditableField value={data.title} onChange={v => handleFieldChange('title', v)} className="text-lg font-semibold" />
        </div>
        <EditableField value={`Type: ${data.documentType} | Date: ${data.date || 'N/A'}`} onChange={v => { /* Can't edit multiple fields */ }} className="text-sm text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-2 space-y-2">
        <div>
          <h6 className="font-semibold text-xs mb-1">Summary</h6>
          <EditableField as="textarea" value={data.summary} onChange={v => handleFieldChange('summary', v)} className="text-sm text-muted-foreground" />
        </div>
        {data.fullText && (
          <div>
            <h6 className="font-semibold text-xs mb-1">Full Text</h6>
            <Textarea value={data.fullText} onChange={(e) => handleFieldChange('fullText', e.target.value)} className="p-2 bg-secondary rounded-md max-h-48 h-48 resize-none text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentRecords({ name = "Document Records" }: { name?: string }) {
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { aiProvider, apiKeys } = useSettings();
  const { toast } = useToast();
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  const processDocument = async (record: DocumentRecord) => {
    try {
      // Step 1: Classify the document (delegated to services/ai which should IPC to main)
      const classificationResult = await extractDocumentDetails({ documentDataUri: record.dataUri });
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'extracting', classification: classificationResult } : r));

      // Step 2: Based on classification, call the specific flow if needed
      let finalDetails: any;
      const docType = (classificationResult.documentType || "").toLowerCase();

      if (docType.includes('receipt')) {
        finalDetails = await extractReceiptData({ receiptDataUri: record.dataUri, config: { provider: aiProvider, apiKey: apiKeys?.[aiProvider] } });
      } else if (docType.includes('medical') || docType.includes('health')) {
        finalDetails = await generateHealthSummary({ documentDataUri: record.dataUri });
      } else {
        // For bank statements, invoices, and other types, the general extraction is often sufficient.
        finalDetails = classificationResult;
      }

      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'complete', details: finalDetails } : r));

    } catch (error) {
      // Keep errors local and notify user
      // console.error intentionally left for developer visibility
      // but in production consider routing to centralized logger via IPC
      // eslint-disable-next-line no-console
      console.error("Error processing document:", error);
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'error' } : r));
      toast({ title: "Processing Failed", description: "Could not extract details from the document.", variant: "destructive" });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      const newRecord: DocumentRecord = {
        id: uuidv4(),
        fileName: file.name,
        dataUri,
        uploadedAt: new Date(),
        status: 'classifying',
      };
      setRecords(prev => [newRecord, ...prev]);

      // Start processing without blocking the UI
      processDocument(newRecord);
    };
    reader.readAsDataURL(file);

    if (event.target) event.target.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePrintOriginal = (record: DocumentRecord) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const isPdf = record.dataUri.startsWith('data:application/pdf');
      printWindow.document.write('<html><head><title>Print Document</title></head><body style="margin:0;">');
      if (isPdf) {
        printWindow.document.write(`<iframe src="${record.dataUri}" style="width:100%; height:100%; border:none;" onload="this.contentWindow.print();"></iframe>`);
      } else {
        printWindow.document.write(`<img src="${record.dataUri}" style="max-width: 100%;" onload="window.print();" />`);
      }
      printWindow.document.write('</body></html>');
      printWindow.document.close();
    }
  };

  const handlePrintFormatted = (recordId: string) => {
    const contentToPrint = document.getElementById(`printable-${recordId}`);
    const iframe = printIframeRef.current;
    if (contentToPrint && iframe && iframe.contentWindow) {
      const printDoc = iframe.contentWindow.document;
      printDoc.open();
      printDoc.write('<html><head><title>Print</title>');
      // Copy stylesheets
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if ((styleSheet as CSSStyleSheet).href) {
            printDoc.write(`<link rel="stylesheet" href="${(styleSheet as CSSStyleSheet).href}">`);
          } else if ((styleSheet as CSSStyleSheet).cssRules) {
            printDoc.write('<style>');
            printDoc.write(Array.from((styleSheet as CSSStyleSheet).cssRules as any).map((rule: any) => rule.cssText).join('\n'));
            printDoc.write('</style>');
          }
        } catch {
          // Some stylesheets (cross-origin) may throw; ignore them
        }
      });
      printDoc.write('</head><body class="bg-background text-foreground">');
      printDoc.write(contentToPrint.innerHTML);
      printDoc.write('</body></html>');
      printDoc.close();

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
    }
  };

  const handleUpdateDetails = (recordId: string, updatedDetails: any) => {
    setRecords(prevRecords => prevRecords.map(r =>
      r.id === recordId ? { ...r, details: updatedDetails } : r
    ));
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
    toast({ title: "Document deleted" });
  };

  const renderDetails = (record: DocumentRecord) => {
    if (record.status !== 'complete' || !record.details) return null;

    const docType = (record.classification?.documentType || "").toLowerCase();

    if (docType.includes('receipt')) return <ReceiptDisplay data={record.details as ReceiptData} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;
    if ((docType.includes('medical') || docType.includes('health')) && 'comprehensiveSummary' in record.details) return <HealthSummaryDisplay data={record.details as GenerateHealthSummaryOutput} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;
    if (docType.includes('statement') || docType.includes('bill')) return <BankStatementDisplay data={record.details as DocumentDetails} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;
    if (docType.includes('pharmacy') || docType.includes('medication')) return <PharmacyRecordDisplay data={record.details as DocumentDetails} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;

    // Generic fallbacks
    if (docType.includes('financial') || docType.includes('invoice') || docType.includes('paystub')) return <GenericFinancialDisplay data={record.details as DocumentDetails} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;
    if (docType.includes('health') || docType.includes('medical')) return <GenericHealthDisplay data={record.details as DocumentDetails} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;

    return <DefaultDisplay data={record.details as DocumentDetails} onUpdate={(d) => handleUpdateDetails(record.id, d)} />;
  }

  return (
    <>
      <iframe ref={printIframeRef} style={{ display: 'none' }} title="Print Frame" />
      <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileArchive className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Your external brain storage.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow min-h-0">
          <div className="flex-shrink-0 px-6">
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" />
            <Button onClick={handleUploadClick} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>

          <ScrollArea className="mt-4 flex-grow -mx-6">
            <div className="px-6">
              {records.length === 0 ? (
                <div className="text-center text-muted-foreground pt-12">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-xs">Upload an image to classify and extract its contents.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {records.map(record => (
                    <AccordionItem value={record.id} key={record.id} className="bg-background/50 rounded-lg mb-2 border">
                      <AccordionTrigger className="p-3 text-sm hover:no-underline">
                        <div className="flex-grow text-left flex items-center gap-4">
                          {record.status === 'classifying' || record.status === 'extracting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Badge variant="outline">{record.classification?.documentType || 'Document'}</Badge>}
                          <div className="flex-grow">
                            <h4 className="font-semibold truncate">{record.classification?.title || record.fileName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {record.classification?.date || record.uploadedAt.toLocaleDateString()}
                            </p>
                          </div>
                          {record.classification?.totalAmount != null && (
                            <div className="text-right">
                              <p className="font-bold text-primary">${record.classification.totalAmount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        {record.status === 'complete' ? (
                          <div>
                            <div id={`printable-${record.id}`}>
                              {renderDetails(record)}
                            </div>
                            <div className="mt-4 flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handlePrintOriginal(record)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Original
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePrintFormatted(record.id)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Formatted
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Full Text
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                  <DialogHeader>
                                    <DialogTitle>Full Extracted Text</DialogTitle>
                                    <DialogDescription>
                                      This is the complete raw text extracted from the document by the AI.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ScrollArea className="max-h-[60vh] rounded-md border p-4">
                                    <pre className="text-xs whitespace-pre-wrap font-sans">
                                      {record.classification?.fullText || "No additional text extracted."}
                                    </pre>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the document record.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteRecord(record.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2 mt-2 border-t">Original Filename: {record.fileName}</p>
                          </div>
                        ) :
                          record.status === 'error' ? <p className="text-destructive text-sm p-4">Could not process document.</p> :
                            <div className="flex items-center gap-2 p-4"><Loader2 className="w-4 h-4 animate-spin" /> <p>Processing... Current step: {record.status}</p></div>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
