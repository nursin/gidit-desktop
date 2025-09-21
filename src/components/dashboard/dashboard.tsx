import React from "react";
import { TasksQuadrant } from "./tasks-quadrant";
import { BrainDumpTriage } from "./brain-dump-triage";
import { StreaksTracker } from "./streaks-tracker";
import { CalendarCard } from "./calendar-card";
import { FinanceCard } from "./finance-card";
import { DailyTaskSuggestions } from "./daily-task-suggestions";
import { StoryWriter } from "./story-writer";
import { TimersAndReminders } from "./timers-and-reminders";
import { MoodTracker } from "./mood-tracker";
import { EnergySelector } from "./energy-selector";
import { LaunchButton } from "./launch-button";
import { BreakPromptTile } from "./break-prompt-tile";
import { DoneWall } from "./done-wall";
import { IndexCardStack } from "./index-card-stack";
import { NowNextPanel } from "./now-next-panel";
import { ProgressAnalytics } from "./progress-analytics";
import { ScrumBoard } from "./scrum-board";
import { WeeklySpread } from "./weekly-spread";
import { ToDoList } from "./to-do-list";
import { TimeBlockPlanner } from "./time-block-planner";
import { DocumentRecords } from "./document-records";
import { GoalPlanner } from "./goal-planner";
import { StatsPanel } from "./stats-panel";
import { SoundscapeGenerator } from "./soundscape-generator";
import { FocusMode } from "./focus-mode";
import { AppSearch } from "./app-search";
import { BehavioralAnalysis } from "./behavioral-analysis";
import { NotificationsPanel } from "./notifications-panel";
import { StickyNoteBoard } from "./sticky-note-board";
import { BudgetTracker } from "./budget-tracker";
import { VoiceCapture } from "./voice-capture";
import { NavigationBar } from "./navigation-bar";
import { HealthSummary } from "./health-summary";
import { PeriodTracker } from "./period-tracker";
import { ActivityHeatmap } from "./activity-heatmap";
import { RecentTransactions } from "./recent-transactions";
import { MysteryTaskPicker } from "./mystery-task-picker";
import { TicTacToe } from "./tic-tac-toe";
import MemoryGame from "./memory-game";
import { RockPaperScissors } from "./rock-paper-scissors";
import { VirtualPet } from "./virtual-pet";
import { FamilyAuthenticator } from "./family-authenticator";
import {
  BrainCircuit,
  SlidersHorizontal,
  Package,
  HeartPulse,
  Gamepad2,
  AreaChart,
  type LucideIcon,
  ListTodo,
  Clock,
  Target,
  Trophy,
  Layers,
  ArrowRight,
  TrendingUp,
  KanbanSquare,
  CalendarDays,
  FileArchive,
  PiggyBank,
  Search,
  Bell,
  Clipboard,
  Mic,
  Menu,
  ShieldCheck,
  Stethoscope,
  Droplet,
  Activity,
  ArrowDownRight,
  Gift,
  Hand,
  PawPrint,
  FileText,
  Sparkles,
  Wand2,
  HelpCircle,
  Zap,
  Brain,
  Lightbulb,
  Coffee,
  Hourglass,
  BatteryCharging,
  Rocket,
  CheckCircle,
  BarChart2,
  Shield,
  Calendar,
  Music,
  ListChecks,
  Command,
  StickyNote,
  BookUser,
  CaseUpper,
  Notebook,
  Dumbbell,
  Salad,
  Globe,
  FileType,
  Sheet,
  PresentationIcon,
  MessageSquare,
  Image as ImageIcon,
  UserCheck,
} from "lucide-react";
import { SbarSynthesizer } from "./sbar-synthesizer";
import { DateTimeDisplay } from "./date-time-display";
import { ChallengeTimer } from "./challenge-timer";
import { TaskSpinner } from "./task-spinner";
import { FlashcardDeck } from "./flashcard-deck";
import { DreamWeaver } from "./dream-weaver";
import { MindfulMoments } from "./mindful-moments";
import { WhatAmIForgetting } from "./what-am-i-forgetting";
import { SessionRecap } from "./session-recap";
import { PersonalManual } from "./personal-manual";
import { ProjectPlanner } from "./project-planner";
import { NoteDisplay } from "./note-display";
import { FitnessTracker } from "./fitness-tracker";
import { DietaryTracker } from "./dietary-tracker";
import { WebBrowser } from "./web-browser";
import { WordProcessor } from "./word-processor";
import { Spreadsheet } from "./spreadsheet";
import { Presentation } from "./presentation";
import { ChatApp } from "./chat-app";
import { Gallery } from "./gallery";
import { PsychologicalProfile } from "./psychological-profile";

export type WidgetCategory = {
  name: string;
  icon: LucideIcon;
};

export const WIDGET_CATEGORIES: Record<string, WidgetCategory> = {
  Productivity: { name: "Productivity", icon: SlidersHorizontal },
  SmartTools: { name: "Smart Tools", icon: BrainCircuit },
  Organization: { name: "Organization", icon: Package },
  Wellness: { name: "Wellness", icon: HeartPulse },
  Analytics: { name: "Analytics", icon: AreaChart },
  Games: { name: "Games", icon: Gamepad2 },
};

export const WIDGETS = {
  TasksQuadrant: {
    id: "TasksQuadrant",
    name: "Tasks Quadrant",
    component: <TasksQuadrant />,
    icon: ListTodo,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 3,
    initialHeight: 5,
  },
  ToDoList: {
    id: "ToDoList",
    name: "To-Do List",
    component: <ToDoList />,
    icon: ListChecks,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 1,
    initialHeight: 5,
  },
  TimeBlockPlanner: {
    id: "TimeBlockPlanner",
    name: "Time Block Planner",
    component: <TimeBlockPlanner />,
    icon: Clock,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 1,
    initialHeight: 6,
  },
  GoalPlanner: {
    id: "GoalPlanner",
    name: "Goal Planner",
    component: <GoalPlanner />,
    icon: Target,
    category: WIDGET_CATEGORIES.Productivity.name,
  },
  ProjectPlanner: {
    id: "ProjectPlanner",
    name: "Project Planner",
    component: <ProjectPlanner />,
    icon: CaseUpper,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 7,
  },
  DoneWall: {
    id: "DoneWall",
    name: "Wall of Completion",
    component: <DoneWall />,
    icon: Trophy,
    category: WIDGET_CATEGORIES.Productivity.name,
  },
  IndexCardStack: {
    id: "IndexCardStack",
    name: "Index Card Stack",
    component: <IndexCardStack />,
    icon: Layers,
    category: WIDGET_CATEGORIES.Productivity.name,
  },
  FlashcardDeck: {
    id: "FlashcardDeck",
    name: "Flashcard Deck",
    component: <FlashcardDeck />,
    icon: Layers,
    category: WIDGET_CATEGORIES.Organization.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  NowNextPanel: {
    id: "NowNextPanel",
    name: "Now/Next Panel",
    component: <NowNextPanel />,
    icon: ArrowRight,
    category: WIDGET_CATEGORIES.Productivity.name,
  },
  WordProcessor: {
    id: "WordProcessor",
    name: "Word Processor",
    component: <WordProcessor />,
    icon: FileType,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 6,
  },
  Spreadsheet: {
    id: "Spreadsheet",
    name: "Spreadsheet",
    component: <Spreadsheet />,
    icon: Sheet,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 6,
  },
  Presentation: {
    id: "Presentation",
    name: "Presentation",
    component: <Presentation />,
    icon: PresentationIcon,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 6,
  },
  ChatApp: {
    id: "ChatApp",
    name: "Chat App",
    component: <ChatApp />,
    icon: MessageSquare,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 7,
  },
  ProgressAnalytics: {
    id: "ProgressAnalytics",
    name: "Progress Analytics",
    component: <ProgressAnalytics />,
    icon: TrendingUp,
    category: WIDGET_CATEGORIES.Analytics.name,
  },
  StatsPanel: {
    id: "StatsPanel",
    name: "Stats Panel",
    component: <StatsPanel />,
    icon: BarChart2,
    category: WIDGET_CATEGORIES.Analytics.name,
  },
  ScrumBoard: {
    id: "ScrumBoard",
    name: "Scrum Board",
    component: <ScrumBoard />,
    icon: KanbanSquare,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 7,
  },
  WeeklySpread: {
    id: "WeeklySpread",
    name: "Weekly Spread",
    component: <WeeklySpread />,
    icon: CalendarDays,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 4,
    initialHeight: 3,
  },
  BehavioralAnalysis: {
    id: "BehavioralAnalysis",
    name: "Behavioral Analysis",
    component: <BehavioralAnalysis />,
    icon: Activity,
    category: WIDGET_CATEGORIES.Analytics.name,
  },
  ActivityHeatmap: {
    id: "ActivityHeatmap",
    name: "Activity Heatmap",
    component: <ActivityHeatmap />,
    icon: Activity,
    category: WIDGET_CATEGORIES.Analytics.name,
  },
  PsychologicalProfile: {
    id: "PsychologicalProfile",
    name: "Psychological Profile",
    component: <PsychologicalProfile />,
    icon: UserCheck,
    category: WIDGET_CATEGORIES.Analytics.name,
    initialWidth: 4,
    initialHeight: 8,
  },
  TimersAndReminders: {
    id: "TimersAndReminders",
    name: "Timers & Reminders",
    component: <TimersAndReminders />,
    icon: Clock,
    category: WIDGET_CATEGORIES.Productivity.name,
  },
  ChallengeTimer: {
    id: "ChallengeTimer",
    name: "Flash Round Challenge",
    component: <ChallengeTimer />,
    icon: Trophy,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  StreaksTracker: {
    id: "StreaksTracker",
    name: "Streaks Tracker",
    component: <StreaksTracker />,
    icon: CheckCircle,
    category: WIDGET_CATEGORIES.Analytics.name,
  },
  LaunchButton: {
    id: "LaunchButton",
    name: "Launch Button",
    component: <LaunchButton />,
    icon: Rocket,
    category: WIDGET_CATEGORIES.Productivity.name,
  },
  StickyNoteBoard: {
    id: "StickyNoteBoard",
    name: "Sticky Note Board",
    component: <StickyNoteBoard />,
    icon: StickyNote,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  MysteryTaskPicker: {
    id: "MysteryTaskPicker",
    name: "Mystery Task Picker",
    component: <MysteryTaskPicker />,
    icon: Gift,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 2,
    initialHeight: 2,
  },
  TaskSpinner: {
    id: "TaskSpinner",
    name: "Task Spinner",
    component: <TaskSpinner />,
    icon: Command,
    category: WIDGET_CATEGORIES.Productivity.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  BrainDumpTriage: {
    id: "BrainDumpTriage",
    name: "Brain Dump Triage",
    component: <BrainDumpTriage />,
    icon: Brain,
    category: WIDGET_CATEGORIES.SmartTools.name,
  },
  DailyTaskSuggestions: {
    id: "DailyTaskSuggestions",
    name: "Daily Suggestions",
    component: <DailyTaskSuggestions />,
    icon: Lightbulb,
    category: WIDGET_CATEGORIES.SmartTools.name,
  },
  StoryWriter: {
    id: "StoryWriter",
    name: "Smart Story Writer",
    component: <StoryWriter />,
    icon: FileText,
    category: WIDGET_CATEGORIES.SmartTools.name,
  },
  VoiceCapture: {
    id: "VoiceCapture",
    name: "Voice Capture",
    component: <VoiceCapture />,
    icon: Mic,
    category: WIDGET_CATEGORIES.SmartTools.name,
  },
  SbarSynthesizer: {
    id: "SbarSynthesizer",
    name: "SBAR Synthesizer",
    component: <SbarSynthesizer />,
    icon: FileText,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 4,
    initialHeight: 7,
  },
  DreamWeaver: {
    id: "DreamWeaver",
    name: "Dream Weaver",
    component: <DreamWeaver />,
    icon: Wand2,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  WhatAmIForgetting: {
    id: "WhatAmIForgetting",
    name: "What Am I Forgetting?",
    component: <WhatAmIForgetting />,
    icon: HelpCircle,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  SessionRecap: {
    id: "SessionRecap",
    name: "Session Recap",
    component: <SessionRecap />,
    icon: Zap,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 2,
    initialHeight: 2,
  },
  PersonalManual: {
    id: "PersonalManual",
    name: "Personal Manual",
    component: <PersonalManual />,
    icon: BookUser,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  NoteDisplay: {
    id: "NoteDisplay",
    name: "Note Display",
    component: <NoteDisplay />,
    icon: Notebook,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 4,
    initialHeight: 8,
  },
  WebBrowser: {
    id: "WebBrowser",
    name: "Web Browser",
    component: <WebBrowser />,
    icon: Globe,
    category: WIDGET_CATEGORIES.SmartTools.name,
    initialWidth: 4,
    initialHeight: 6,
  },
  CalendarCard: {
    id: "CalendarCard",
    name: "Calendar",
    component: <CalendarCard />,
    icon: Calendar,
    category: WIDGET_CATEGORIES.Organization.name,
    initialWidth: 4,
    initialHeight: 7,
  },
  Gallery: {
    id: "Gallery",
    name: "Gallery",
    component: <Gallery />,
    icon: ImageIcon,
    category: WIDGET_CATEGORIES.Organization.name,
    initialWidth: 4,
    initialHeight: 8,
  },
  DateTimeDisplay: {
    id: "DateTimeDisplay",
    name: "Date & Time",
    component: <DateTimeDisplay />,
    icon: Clock,
    category: WIDGET_CATEGORIES.Organization.name,
    initialWidth: 2,
    initialHeight: 1,
  },
  FinanceCard: {
    id: "FinanceCard",
    name: "Finance Overview",
    component: <FinanceCard />,
    icon: PiggyBank,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  BudgetTracker: {
    id: "BudgetTracker",
    name: "Budget Tracker",
    component: <BudgetTracker />,
    icon: PiggyBank,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  RecentTransactions: {
    id: "RecentTransactions",
    name: "Recent Transactions",
    component: <RecentTransactions />,
    icon: ArrowDownRight,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  DocumentRecords: {
    id: "DocumentRecords",
    name: "Document Records",
    component: <DocumentRecords />,
    icon: FileArchive,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  AppSearch: {
    id: "AppSearch",
    name: "App Search",
    component: <AppSearch />,
    icon: Search,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  NotificationsPanel: {
    id: "NotificationsPanel",
    name: "Assistant",
    component: <NotificationsPanel />,
    icon: Bell,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  NavigationBar: {
    id: "NavigationBar",
    name: "Navigation Bar",
    component: <NavigationBar />,
    icon: Menu,
    category: WIDGET_CATEGORIES.Organization.name,
  },
  FamilyAuthenticator: {
    id: "FamilyAuthenticator",
    name: "Family Authenticator",
    component: <FamilyAuthenticator />,
    icon: ShieldCheck,
    category: WIDGET_CATEGORIES.Organization.name,
    initialWidth: 2,
    initialHeight: 3,
  },
  MoodTracker: {
    id: "MoodTracker",
    name: "Mood Tracker",
    component: <MoodTracker />,
    icon: BarChart2,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  MindfulMoments: {
    id: "MindfulMoments",
    name: "Mindful Moments",
    component: <MindfulMoments />,
    icon: Brain,
    category: WIDGET_CATEGORIES.Wellness.name,
    initialWidth: 2,
    initialHeight: 4,
  },
  EnergySelector: {
    id: "EnergySelector",
    name: "Energy Selector",
    component: <EnergySelector />,
    icon: BatteryCharging,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  BreakPromptTile: {
    id: "BreakPromptTile",
    name: "Break Prompt",
    component: <BreakPromptTile />,
    icon: Coffee,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  SoundscapeGenerator: {
    id: "SoundscapeGenerator",
    name: "Soundscape Generator",
    component: <SoundscapeGenerator />,
    icon: Music,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  FocusMode: {
    id: "FocusMode",
    name: "Focus Mode",
    component: <FocusMode />,
    icon: Shield,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  HealthSummary: {
    id: "HealthSummary",
    name: "Health Summary",
    component: <HealthSummary />,
    icon: Stethoscope,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  PeriodTracker: {
    id: "PeriodTracker",
    name: "Period Tracker",
    component: <PeriodTracker />,
    icon: Droplet,
    category: WIDGET_CATEGORIES.Wellness.name,
  },
  FitnessTracker: {
    id: "FitnessTracker",
    name: "Fitness Tracker",
    component: <FitnessTracker />,
    icon: Dumbbell,
    category: WIDGET_CATEGORIES.Wellness.name,
    initialWidth: 4,
    initialHeight: 6,
  },
  DietaryTracker: {
    id: "DietaryTracker",
    name: "Dietary Tracker",
    component: <DietaryTracker />,
    icon: Salad,
    category: WIDGET_CATEGORIES.Wellness.name,
    initialWidth: 4,
    initialHeight: 7,
  },
  TicTacToe: {
    id: "TicTacToe",
    name: "Tic-Tac-Toe",
    component: <TicTacToe />,
    icon: Gamepad2,
    category: WIDGET_CATEGORIES.Games.name,
    initialWidth: 2,
    initialHeight: 3,
  },
  MemoryGame: {
    id: "MemoryGame",
    name: "Memory Game",
    component: <MemoryGame />,
    icon: Brain,
    category: WIDGET_CATEGORIES.Games.name,
    initialWidth: 2,
    initialHeight: 3,
  },
  RockPaperScissors: {
    id: "RockPaperScissors",
    name: "Rock Paper Scissors",
    component: <RockPaperScissors />,
    icon: Hand,
    category: WIDGET_CATEGORIES.Games.name,
    initialWidth: 2,
    initialHeight: 2,
  },
  VirtualPet: {
    id: "VirtualPet",
    name: "Virtual Pet",
    component: <VirtualPet />,
    icon: PawPrint,
    category: WIDGET_CATEGORIES.Games.name,
    initialWidth: 2,
    initialHeight: 3,
  },
} as const;

export type WidgetId = keyof typeof WIDGETS;
