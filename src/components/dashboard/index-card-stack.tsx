import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "../ui/carousel";
import { Layers } from "lucide-react";

const cardContent = [
  {
    title: "What is the primary goal of the Eisenhower Matrix?",
    answer: "To prioritize tasks by urgency and importance.",
  },
  {
    title: "What does the 'Pomodoro Technique' involve?",
    answer: "Working in focused 25-minute intervals separated by short breaks.",
  },
  {
    title: "What is 'Time Blocking'?",
    answer: "Scheduling specific blocks of time for individual tasks or activities.",
  },
  {
    title: "What does 'Eat the Frog' mean in productivity?",
    answer: "Tackle your most challenging and important task first thing in the morning.",
  },
  {
    title: "What is the 'Two-Minute Rule'?",
    answer: "If a task takes less than two minutes to complete, do it immediately.",
  },
];

type IndexCardStackProps = {
  name?: string;
};

export function IndexCardStack({ name = "Index Card Stack" }: IndexCardStackProps) {
  const [api, setApi] = useState<CarouselApi | undefined>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);

    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Cycle through your notes or tasks.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-center items-center gap-4">
        <Carousel setApi={setApi} className="w-full max-w-xs">
          <CarouselContent>
            {cardContent.map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="h-[200px] flex flex-col justify-center">
                    <CardHeader>
                      <CardTitle className="text-lg text-center">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">{item.answer}</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <div className="py-2 text-center text-sm text-muted-foreground">
          Card {current} of {cardContent.length}
        </div>
      </CardContent>
    </Card>
  );
}
