import { useState } from "react";
import { BookUser, CheckCircle, Lightbulb, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";

type PersonalManualProps = {
  name?: string;
  toolsThatWorked?: string;
  toolsToTry?: string;
  focusBreakers?: string;
  onPropChange?: (id: string, newProps: Record<string, any>) => void;
  id?: string;
};

const initialContent = {
  toolsThatWorked: `• Tell myself I’m just going to do something small and that’s it.
• Needed the dishes clean to cook stroganoff, a food item I’m interested in.
• Trying to solve a problem (e.g., searching for a unique company name).
• Random interest in a new thing.
• Fear of something harming me (e.g., HIV), studied it until I knew everything and felt comfortable.
• Listening to music while doing chores (brushing teeth, cleaning).
• Woke up with a plan and immediately started writing as ideas came.
• When I need to do something before I can do something else (e.g., wash dishes so I can cook).`,
  toolsToTry: `• Urgency system: Red, orange, yellow, green, blue folders.
• Chew gum.
• Use various writing methods: phone, computer, new keyboard, voice recorder.
• Listen to music that matches the book I'm reading.
• Listen to audiobooks while cleaning.
• Brain is looking for a secondary source of stimulation while reading/cleaning.
• Read a manga to build up to reading a book.
• Do the small, easy things first.`,
  focusBreakers: `• YouTube shorts & social media scrolling.
• Taking a long break after completing a hard task.
• Quitting caffeine.
• Emotional life events.
• Running out of ideas or things to write.
• Interruptions from people or switching tasks. It makes me want to give up.`
};

export function PersonalManual({
  name = "Personal Manual",
  toolsThatWorked: initialToolsWorked = initialContent.toolsThatWorked,
  toolsToTry: initialToolsToTry = initialContent.toolsToTry,
  focusBreakers: initialFocusBreakers = initialContent.focusBreakers,
  onPropChange,
  id
}: PersonalManualProps) {
  const { toast } = useToast();

  const [toolsThatWorked, setToolsThatWorked] = useState(initialToolsWorked);
  const [toolsToTry, setToolsToTry] = useState(initialToolsToTry);
  const [focusBreakers, setFocusBreakers] = useState(initialFocusBreakers);

  const handleSave = () => {
    if (onPropChange && id) {
      onPropChange(id, { toolsThatWorked, toolsToTry, focusBreakers });
    }
    toast({
      title: "Manual Saved",
      description: "Your personal manual has been updated."
    });
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookUser className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Your personal guide to what works for you.</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={handleSave}>
            Save Manual
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4 min-h-0">
        <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3"]} className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tools that Worked
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Textarea
                placeholder="What strategies help you focus?..."
                className="w-full resize-none text-sm bg-background/50 h-48"
                value={toolsThatWorked}
                onChange={(e) => setToolsThatWorked(e.target.value)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Tools to Try
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Textarea
                placeholder="What new strategies are you curious about?..."
                className="w-full resize-none text-sm bg-background/50 h-48"
                value={toolsToTry}
                onChange={(e) => setToolsToTry(e.target.value)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b-0">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Focus Breakers
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Textarea
                placeholder="What are your common pitfalls or distractions?..."
                className="w-full resize-none text-sm bg-background/50 h-48"
                value={focusBreakers}
                onChange={(e) => setFocusBreakers(e.target.value)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
