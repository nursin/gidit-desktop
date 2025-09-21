import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Presentation as PresentationIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Slide = {
  id: string;
  title: string;
  content: string;
};

const initialSlides: Slide[] = [
  {
    id: uuidv4(),
    title: "Welcome to Presentations",
    content: "This is your first slide. Edit it or add new ones!",
  },
];

export function Presentation({ name = "Presentation" }: { name?: string }) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const currentSlide = slides[currentSlideIndex];

  const addSlide = () => {
    const newSlide: Slide = {
      id: uuidv4(),
      title: "New Slide",
      content: "Add your content here.",
    };
    const newIndex = currentSlideIndex + 1;
    const newSlides = [
      ...slides.slice(0, newIndex),
      newSlide,
      ...slides.slice(newIndex),
    ];
    setSlides(newSlides);
    setCurrentSlideIndex(newIndex);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, index) => index !== currentSlideIndex);
    setSlides(newSlides);
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const updateSlide = (field: keyof Omit<Slide, "id">, value: string) => {
    const newSlides = slides.map((slide, index) =>
      index === currentSlideIndex ? { ...slide, [field]: value } : slide
    );
    setSlides(newSlides);
  };

  const goToPrev = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const toggleFullscreen = async () => {
    const elem = fullscreenRef.current;
    if (!elem) return;

    try {
      if (!document.fullscreenElement) {
        await elem.requestFullscreen();
        // isFullscreen will be updated via the fullscreenchange listener
      } else {
        await document.exitFullscreen();
      }
    } catch (err: any) {
      // Keep UX simple for desktop app: alert on error
      alert(
        `Error attempting to toggle full-screen mode: ${err?.message ?? err}`
      );
    }
  };

  // Listen for fullscreen changes to update local state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PresentationIcon className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Create and view simple slides.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addSlide}>
              <Plus className="w-4 h-4 mr-2" />
              Slide
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSlide}
              disabled={slides.length <= 1}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Slide Editor */}
        <div className="flex-1 flex flex-col gap-2 p-4 border rounded-lg bg-background/50">
          <Input
            placeholder="Slide Title"
            value={currentSlide?.title ?? ""}
            onChange={(e) => updateSlide("title", e.target.value)}
            className="text-lg font-bold border-none focus-visible:ring-0 shadow-none p-1 h-auto"
          />
          <Textarea
            placeholder="Slide content..."
            value={currentSlide?.content ?? ""}
            onChange={(e) => updateSlide("content", e.target.value)}
            className="flex-1 resize-none border-none focus-visible:ring-0 shadow-none p-1"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentSlideIndex === slides.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={toggleFullscreen}>
            <Play className="w-4 h-4 mr-2" />
            Present
          </Button>
        </div>

        {/* Fullscreen view container - always in DOM so requestFullscreen can target it */}
        <div
          ref={fullscreenRef}
          // keep it non-interfering when not fullscreen; when fullscreen it will fill the screen
          className={`${
            isFullscreen ? "" : "hidden"
          } w-screen h-screen bg-background p-16 flex flex-col justify-center items-center text-center`}
        >
          {currentSlide && isFullscreen && (
            <>
              <h1 className="text-6xl font-bold mb-8">{currentSlide.title}</h1>
              <p className="text-3xl whitespace-pre-wrap">{currentSlide.content}</p>
              <div className="absolute bottom-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goToPrev}
                  disabled={currentSlideIndex === 0}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goToNext}
                  disabled={currentSlideIndex === slides.length - 1}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Presentation;
