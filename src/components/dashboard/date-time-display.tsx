import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";

type DateTimeDisplayProps = {
  name?: string;
};

export function DateTimeDisplay({ name = "Date & Time" }: DateTimeDisplayProps) {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const tick = () => setCurrentDateTime(new Date());
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const formattedDate = new Intl.DateTimeFormat(undefined, dateOptions).format(currentDateTime);
  const formattedTime = new Intl.DateTimeFormat(undefined, timeOptions).format(currentDateTime);

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none" aria-label={name}>
      <CardContent className="flex flex-col flex-grow justify-center items-center text-center p-4">
        <div className="text-4xl font-bold font-mono text-primary">{formattedTime}</div>
        <div className="text-sm text-muted-foreground mt-1">{formattedDate}</div>
      </CardContent>
    </Card>
  );
}
