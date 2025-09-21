export type Item = {
  id?: string;
  widgetId: string;
  width: number;
  height: number;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  items: Omit<Item, 'id'>[];
};

export const templates: Template[] = [
  {
    id: 'template-productivity-dashboard',
    name: 'Productivity Dashboard',
    description: 'A dashboard to manage tasks, track progress, and stay focused.',
    items: [
      { widgetId: 'TasksQuadrant', width: 2, height: 3 },
      { widgetId: 'ToDoList', width: 2, height: 3 },
      { widgetId: 'ChallengeTimer', width: 2, height: 4 },
      { widgetId: 'NowNextPanel', width: 2, height: 3 },
    ],
  },
  {
    id: 'template-daily-planner',
    name: 'Daily Planner',
    description: 'A simple layout to plan your day with tasks and calendar events.',
    items: [
      { widgetId: 'CalendarCard', width: 3, height: 4 },
      { widgetId: 'ToDoList', width: 1, height: 4 },
      { widgetId: 'DailyTaskSuggestions', width: 2, height: 2 },
      { widgetId: 'EnergySelector', width: 2, height: 2 },
    ],
  },
  {
    id: 'template-wellness-tracker',
    name: 'Wellness Tracker',
    description: 'Monitor your mood, energy levels, and daily habits.',
    items: [
      { widgetId: 'MoodTracker', width: 2, height: 3 },
      { widgetId: 'StreaksTracker', width: 1, height: 1 },
      { widgetId: 'EnergySelector', width: 1, height: 2 },
      { widgetId: 'SoundscapeGenerator', width: 2, height: 2 },
    ],
  },
  {
    id: 'template-smart-assistant',
    name: 'Smart Assistant',
    description: 'Leverage AI to organize thoughts, get ideas, and recap sessions.',
    items: [
      { widgetId: 'NoteSummarizer', width: 2, height: 4 },
      { widgetId: 'BrainDumpTriage', width: 2, height: 4 },
      { widgetId: 'DailyTaskSuggestions', width: 2, height: 2 },
      { widgetId: 'SessionRecap', width: 2, height: 2 },
    ],
  },
  {
    id: 'template-project-management',
    name: 'Project Management',
    description: 'A Scrum board and project planner to keep your work on track.',
    items: [
      { widgetId: 'ScrumBoard', width: 4, height: 5 },
      { widgetId: 'ProjectPlanner', width: 4, height: 5 },
    ],
  },
  {
    id: 'template-financial-overview',
    name: 'Financial Overview',
    description: 'Track your budget, monitor transactions, and scan receipts.',
    items: [
      { widgetId: 'BudgetTracker', width: 2, height: 3 },
      { widgetId: 'RecentTransactions', width: 2, height: 3 },
      { widgetId: 'FinanceCard', width: 4, height: 4 },
    ],
  },
  {
    id: 'template-health-and-records',
    name: 'Health & Records',
    description: 'Keep track of medical documents and personal health metrics.',
    items: [
      { widgetId: 'HealthSummary', width: 4, height: 3 },
      { widgetId: 'DocumentRecords', width: 4, height: 4 },
      { widgetId: 'PeriodTracker', width: 4, height: 4 },
    ],
  },
  {
    id: 'template-focus-and-flow',
    name: 'Focus & Flow',
    description: 'Tools to help you get into a deep work state and stay there.',
    items: [
      { widgetId: 'FocusMode', width: 2, height: 2 },
      { widgetId: 'TimersAndReminders', width: 2, height: 4 },
      { widgetId: 'SoundscapeGenerator', width: 2, height: 2 },
      { widgetId: 'BreakPromptTile', width: 2, height: 2 },
    ],
  },
  {
    id: 'template-creativity-and-fun',
    name: 'Creativity & Fun',
    description: 'A space for creative writing, games, and idea generation.',
    items: [
      { widgetId: 'StoryWriter', width: 2, height: 4 },
      { widgetId: 'TicTacToe', width: 1, height: 3 },
      { widgetId: 'MemoryGame', width: 1, height: 3 },
      { widgetId: 'DreamWeaver', width: 2, height: 4 },
    ],
  },
  {
    id: 'template-personal-manual',
    name: 'Personal Manual',
    description: 'A dedicated space for self-reflection and understanding your own patterns.',
    items: [
      { widgetId: 'PersonalManual', width: 2, height: 4 },
      { widgetId: 'WhatAmIForgetting', width: 2, height: 4 },
      { widgetId: 'BehavioralAnalysis', width: 4, height: 3 },
    ],
  },
];
