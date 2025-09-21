import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Target, Flag, Clock } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

const goals = {
  longTerm: [
    {
      id: "ltg1",
      title: "Launch Side Project 'Gidit'",
      timeEstimate: "6 Months",
      progress: 15,
      milestones: [
        "Develop core feature set",
        "Design and implement UI/UX",
        "Set up deployment pipeline",
        "Run beta testing phase",
      ],
    },
    {
      id: "ltg2",
      title: "Learn conversational Spanish",
      timeEstimate: "1 Year",
      progress: 5,
      milestones: [
        "Complete beginner Duolingo course",
        "Practice with a language partner weekly",
        "Watch 10 hours of Spanish-language TV",
      ],
    },
  ],
  shortTerm: [
    {
      id: "stg1",
      title: "Finish Q3 Report",
      timeEstimate: "2 Weeks",
      progress: 80,
      milestones: ["Compile analytics data", "Draft executive summary", "Final review with manager"],
    },
    {
      id: "stg2",
      title: "Plan and book fall vacation",
      timeEstimate: "1 Week",
      progress: 40,
      milestones: ["Decide on destination", "Book flights", "Book accommodations"],
    },
  ],
};

type GoalPlannerProps = {
  name?: string;
};

export function GoalPlanner({ name = "Goal Planner" }: GoalPlannerProps) {
  return (
    <Card className="h-full flex flex-col bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Define and track your objectives.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <Accordion type="multiple" defaultValue={["long-term", "short-term"]} className="w-full">
            <AccordionItem value="long-term">
              <AccordionTrigger className="text-lg font-semibold">Long-Term Goals</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {goals.longTerm.map(goal => (
                  <div key={goal.id} className="p-3 bg-background/30 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{goal.title}</h4>
                      <Badge variant="outline" className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {goal.timeEstimate}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="mb-3 h-2" />
                    <ul className="space-y-1.5 text-sm">
                      {goal.milestones.map((milestone, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <Flag className="w-4 h-4 text-primary/70" />
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="short-term">
              <AccordionTrigger className="text-lg font-semibold">Short-Term Goals</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {goals.shortTerm.map(goal => (
                  <div key={goal.id} className="p-3 bg-background/30 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{goal.title}</h4>
                      <Badge variant="outline" className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {goal.timeEstimate}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="mb-3 h-2" />
                    <ul className="space-y-1.5 text-sm">
                      {goal.milestones.map((milestone, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <Flag className="w-4 h-4 text-primary/70" />
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
