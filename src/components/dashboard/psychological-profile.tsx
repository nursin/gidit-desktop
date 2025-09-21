import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  UserCheck,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Target,
  Briefcase,
} from "lucide-react";
import {
  generatePsychologicalProfile,
  type PsychologicalProfile,
} from "../../services/ai";
import { useToast } from "../../hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

// Mock data representing a summary of user activity.
// In a real app, this would be dynamically compiled from various data sources.
const mockActivitySummary = `
- Tasks Completed (last 30 days): 45 total. 60% 'Work', 30% 'Personal', 10% 'Home'. High completion rate on 'Urgent & Important' tasks.
- Mood Entries: Predominantly 'Good' (4) and 'Great' (5) on weekdays. 'Okay' (3) on weekends.
- Focus Sessions: Averages 3 sessions of 25 minutes per day. Most frequent in the morning (9am-11am).
- Widgets Used: Frequently uses 'Tasks Quadrant', 'ToDoList', and 'NoteDisplay'. Rarely uses 'Goal Planner'.
- Notes Content: Often includes creative ideas, project plans, and technical notes.
`;

export function PsychologicalProfile({ name = "Psychological Profile" }: { name?: string }) {
  const [profile, setProfile] = useState<PsychologicalProfile | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateProfile = () => {
    startTransition(async () => {
      setProfile(null); // Clear previous profile
      try {
        const result = await generatePsychologicalProfile({
          activitySummary: mockActivitySummary,
        });
        setProfile(result);
      } catch (error) {
        console.error("Error generating profile:", error);
        toast?.({
          title: "Analysis Failed",
          description: "Could not generate your profile. Please try again later.",
          variant: "destructive",
        });
      }
    });
  };

  const renderProfileSection = (
    section: PsychologicalProfile["strengths"],
    icon: React.ReactNode
  ) => (
    <AccordionItem value={section.title}>
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold">{section.title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pl-8">
          <p className="text-sm text-muted-foreground italic">{section.summary}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {section.bulletPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>AI-powered insights into your habits and potential.</CardDescription>
            </div>
          </div>
          <Button onClick={handleGenerateProfile} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4 -mr-4">
          {isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : profile ? (
            <div className="space-y-4">
              <div className="p-4 bg-background/50 rounded-lg border">
                <h3 className="font-semibold mb-2">Overall Summary</h3>
                <p className="text-sm text-muted-foreground">{profile.overallSummary}</p>
              </div>
              <Accordion
                type="multiple"
                defaultValue={[
                  profile.strengths.title,
                  profile.areasForImprovement.title,
                  profile.professionalDevelopment.title,
                ]}
                className="w-full"
              >
                {renderProfileSection(profile.strengths, <CheckCircle className="w-5 h-5 text-green-500" />)}
                {renderProfileSection(profile.areasForImprovement, <Target className="w-5 h-5 text-yellow-500" />)}
                {renderProfileSection(profile.professionalDevelopment, <Briefcase className="w-5 h-5 text-blue-500" />)}
              </Accordion>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <p className="font-semibold">No profile generated yet.</p>
              <p className="text-sm">Click "Generate Report" to get your personalized insights.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
