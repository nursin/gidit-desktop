import { useState, useRef, useTransition, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { analyzeImageForGallery, type ImageAnalysis } from "../../services/ai";
import { Image as ImageIcon, Upload, Loader2, Search, XCircle, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { v4 as uuidv4 } from "uuid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
import { format } from "date-fns";

type ImageRecord = ImageAnalysis & {
  id: string;
  dataUri: string;
  uploadedAt: Date;
  status: "processing" | "complete" | "error";
};

export function Gallery({ name = "Gallery" }: { name?: string }) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isUploading, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      const reader = new FileReader();
      const newRecordId = uuidv4();

      reader.onloadend = () => {
        const dataUri = reader.result as string;
        const newRecord: ImageRecord = {
          id: newRecordId,
          dataUri,
          uploadedAt: new Date(),
          status: "processing",
          title: file.name,
          description: "Analyzing image...",
          categories: [],
          extractedText: "",
        };
        setImages((prev) => [newRecord, ...prev]);

        startTransition(async () => {
          try {
            // In this desktop app setup, analyzeImageForGallery should call the main process via IPC
            // (implemented in ../../services/ai). It returns an ImageAnalysis object.
            const analysis = await analyzeImageForGallery({ imageDataUri: dataUri });
            setImages((prev) =>
              prev.map((img) => (img.id === newRecordId ? { ...img, ...analysis, status: "complete" } : img))
            );
          } catch (error) {
            console.error("Image analysis failed:", error);
            setImages((prev) =>
              prev.map((img) =>
                img.id === newRecordId ? { ...img, status: "error", description: "Analysis failed." } : img
              )
            );
            toast({
              title: "Analysis Failed",
              description: `Could not analyze ${file.name}.`,
              variant: "destructive",
            });
          }
        });
      };
      reader.readAsDataURL(file);
    }

    // Clear the input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    toast({ title: "Image deleted." });
  };

  const allCategories = useMemo(() => {
    const categories = new Set(images.flatMap((img) => img.categories));
    return ["all", ...Array.from(categories)];
  }, [images]);

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      const matchesCategory = selectedCategory === "all" || image.categories.includes(selectedCategory);
      const matchesSearch =
        searchTerm === "" ||
        image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (image.extractedText && image.extractedText.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [images, searchTerm, selectedCategory]);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Your smart, searchable photo library.</CardDescription>
          </div>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, content, or text in image..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*"
          />
          <Button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full -mx-6">
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-6">
              {filteredImages.map((image) => (
                <Dialog key={image.id}>
                  <DialogTrigger asChild>
                    <div className="relative aspect-square group cursor-pointer">
                      <img
                        src={image.dataUri}
                        alt={image.title}
                        className="object-cover rounded-lg w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white rounded-lg">
                        <h3 className="font-semibold text-sm truncate">{image.title}</h3>
                      </div>
                      {image.status === "processing" && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                      {image.status === "error" && (
                        <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center rounded-lg">
                          <XCircle className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{image.title}</DialogTitle>
                      <DialogDescription>{format(image.uploadedAt, "MMMM d, yyyy")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh]">
                      <div className="relative aspect-square">
                        <img
                          src={image.dataUri}
                          alt={image.title}
                          className="object-contain rounded-md w-full h-full"
                        />
                      </div>
                      <ScrollArea className="pr-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground">{image.description}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Categories</h4>
                            <div className="flex flex-wrap gap-2">
                              {image.categories.map((cat) => (
                                <Badge key={cat} variant="secondary">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {image.extractedText && (
                            <div>
                              <h4 className="font-semibold mb-1">Extracted Text</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap p-2 bg-secondary rounded-md">
                                {image.extractedText}
                              </p>
                            </div>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="mt-4">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Image
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the image. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteImage(image.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground pt-12">
              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
              <p>No images found.</p>
              <p className="text-xs">Upload an image to get started or adjust your search filters.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
