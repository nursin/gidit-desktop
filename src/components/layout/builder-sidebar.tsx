"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarSeparator,
  SidebarMenuAction,
} from "../ui/sidebar";
import { type Page, type View } from "../builder/builder";
import * as LucideIcons from "lucide-react";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  Download,
  LayoutTemplate,
  Trash2,
  Bot,
  GripVertical,
} from "lucide-react";
import { GiditLogo } from "../icons/gidit-logo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { WIDGETS, WIDGET_CATEGORIES, type WidgetId } from "../dashboard/dashboard";
import { Card } from "../ui/card";
import { useDraggable } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { ScrollArea } from "../ui/scroll-area";
import { useState, useEffect, useMemo, useRef, cloneElement } from "react";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AppSettingsDialog } from "./app-settings-dialog";
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
import { useSettings } from "../../context/settings-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { signOut } from "../../services/auth";
import { AiAssistant } from "../help/ai-assistant";
import { exportSource } from "../../services/export";

type BuilderSidebarProps = {
  pages: Page[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onUpdatePage: (id: string, updates: Partial<Page>) => void;
  onDeletePage: (id: string) => void;
  widgets: typeof WIDGETS;
  currentView: View;
  onSetView: (view: View) => void;
};

const availableIcons = [
  "LayoutDashboard", "File", "Book", "Users", "Settings", "Home", "BarChart2",
  "Calendar", "CheckSquare", "Clipboard", "CreditCard", "Database", "Folder",
  "Heart", "Image", "MapPin", "MessageSquare", "Mic", "Music", "Package", "PieChart",
  "PlayCircle", "Server", "Shield", "ShoppingBag", "Smile", "Star", "Tag", "Target",
  "Terminal", "ThumbsUp", "Tool", "TrendingUp", "Umbrella", "Video", "Watch",
  "Wifi", "Wind", "Zap"
];

function EditablePageName({ page, onUpdatePage }: { page: Page; onUpdatePage: (id: string, updates: Partial<Page>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(page.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = useSidebar();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  const handleSave = () => {
    if (name.trim() !== "" && name !== page.name) {
        onUpdatePage(page.id, { name });
    } else {
        setName(page.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
        handleSave();
    }
    if (e.key === "Escape") {
        setName(page.name);
        setIsEditing(false);
    }
  };
  
  if (isEditing && state === 'expanded') {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  
  return (
    <span onDoubleClick={() => setIsEditing(true)} className="truncate group-data-[state=collapsed]:hidden">
      {page.name}
    </span>
  );
}

function SortablePageItem({
  page,
  activePageId,
  onSelectPage,
  onUpdatePage,
  onDeletePage,
}: {
  page: Page;
  activePageId: string;
  onSelectPage: (id: string) => void;
  onUpdatePage: (id: string, updates: Partial<Page>) => void;
  onDeletePage: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
    data: {
      type: 'Page',
    }
  });
  const { iconSize } = useSettings();

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = (LucideIcons as any)[page.icon] || LayoutDashboard;
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const iconPicker = (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="p-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <IconComponent className={iconSizeClasses[iconSize]} />
        </div>
      </PopoverTrigger>
      {!isCollapsed && (
        <PopoverContent className="w-64">
          <div className="grid grid-cols-6 gap-2">
            {availableIcons.map((iconName) => {
              const Icon = (LucideIcons as any)[iconName];
              if (!Icon) return null;
              return (
                <Button
                  key={iconName}
                  variant={page.icon === iconName ? "secondary" : "ghost"}
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePage(page.id, { icon: iconName });
                  }}
                  className="h-8 w-8"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <SidebarMenuItem>
        <SidebarMenuButton
          {...attributes}
          {...listeners}
          onClick={() => onSelectPage(page.id)}
          isActive={activePageId === page.id}
          tooltip={page.name}
          className="justify-start h-8"
        >
          {isCollapsed ? <IconComponent className={iconSizeClasses[iconSize]} /> : iconPicker}
          <EditablePageName page={page} onUpdatePage={onUpdatePage} />
        </SidebarMenuButton>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <SidebarMenuAction showOnHover>
              <Trash2 />
            </SidebarMenuAction>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete "{page.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the page and all its widgets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeletePage(page.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </div>
  );
}


function PageMenu({ pages, activePageId, onSelectPage, onUpdatePage, onDeletePage }: Pick<BuilderSidebarProps, 'pages' | 'activePageId' | 'onSelectPage' | 'onUpdatePage' | 'onDeletePage'>) {
    const pageIds = useMemo(() => pages.map(p => p.id), [pages]);

    return (
        <SidebarMenu>
            <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
                {pages.map((page) => (
                    <SortablePageItem
                        key={page.id}
                        page={page}
                        activePageId={activePageId}
                        onSelectPage={onSelectPage}
                        onUpdatePage={onUpdatePage}
                        onDeletePage={onDeletePage}
                    />
                ))}
            </SortableContext>
        </SidebarMenu>
    )
}

function CreationMenu({ onAddPage }: Pick<BuilderSidebarProps, 'onAddPage'>) {
    const { iconSize } = useSettings();
    const iconSizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={onAddPage} tooltip="Add Page">
                    <PlusCircle className={iconSizeClasses[iconSize]} />
                    <span className="group-data-[state=collapsed]:hidden">Add Page</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

function ComponentPalette({ widgets, onSetView, currentView }: { widgets: typeof WIDGETS; onSetView: (view: View) => void; currentView: View; }) {
    const { state, setOpen } = useSidebar();
    const [isClient, setIsClient] = useState(false);
    const { iconSize } = useSettings();
    const iconSizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    const categorizedWidgets = useMemo(() => {
        return Object.values(widgets).reduce((acc, widget) => {
            const category = widget.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(widget.id as WidgetId);
            return acc;
        }, {} as Record<string, WidgetId[]>);
    }, [widgets]);

    const categories = useMemo(() => {
        return Object.values(WIDGET_CATEGORIES).map(category => category.name);
    }, []);

    function SidebarItem({ widgetId }: { widgetId: WidgetId }) {
        const widget = WIDGETS[widgetId];
        const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
            id: widget.id,
            data: {
                isSidebarItem: true,
            },
        });

        return (
            <div ref={setNodeRef} {...listeners} {...attributes} className={cn("relative group cursor-grab active:cursor-grabbing", isDragging && "opacity-50 z-50")}>
                <div className="w-full bg-background border rounded-lg overflow-hidden relative flex items-center justify-center p-1" style={{ aspectRatio: '4 / 3' }}>
                    <div className="absolute top-1 left-1 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">{widget.name}</div>
                    <div className="origin-center pointer-events-none" style={{ transform: "scale(0.28)" }}>
                        <div className="w-[26rem] h-auto">
                            {cloneElement(widget.component, { name: '' })}
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors" />
                </div>
            </div>
        );
    }
    
    if (!isClient) return null;

    if (state === 'collapsed') {
        return (
             <div className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Templates">
                            <LayoutTemplate className={iconSizeClasses[iconSize]}/>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {Object.values(WIDGET_CATEGORIES).map(category => (
                        <SidebarMenuItem key={category.name}>
                            <SidebarMenuButton 
                                onClick={() => setOpen(true)}
                                tooltip={category.name}
                            >
                                <category.icon className={iconSizeClasses[iconSize]}/>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </div>
        )
    }

    return (
        <div className="p-2 flex-1 flex flex-col min-h-0">
            <h3 className="text-md font-semibold mb-2 px-2">Component Palette</h3>
            <ScrollArea className="flex-1 -mx-2">
                <Accordion type="single" collapsible defaultValue="Templates" className="w-full px-2">
                    <AccordionItem value="Templates" className="border-b-0">
                        <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                           <div className="flex items-center gap-2">
                                <LayoutTemplate className="h-4 w-4" />
                                Templates
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                            <div className="pt-1">
                                <Button
                                    variant={currentView === 'templates' ? 'secondary' : 'ghost'}
                                    onClick={() => onSetView('templates')}
                                    className="w-full justify-start h-auto p-2"
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold text-sm">Template Gallery</span>
                                        <span className="text-xs text-muted-foreground font-normal">Browse pre-built layouts</span>
                                    </div>
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    {Object.entries(categorizedWidgets).map(([category, widgetIds]) => {
                        const categoryInfo = Object.values(WIDGET_CATEGORIES).find(c => c.name === category);
                        const Icon = categoryInfo ? categoryInfo.icon : undefined;
                        return (
                            <AccordionItem value={category} key={category} className="border-b-0">
                                <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        {Icon && <Icon className="h-4 w-4" />}
                                        {category}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-2">
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        {widgetIds.map((widgetId) => (
                                            <SidebarItem key={widgetId} widgetId={widgetId} />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </ScrollArea>
        </div>
    )
}

function BottomMenu() {
    const { iconSize } = useSettings();
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const iconSizeClasses = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };
    return (
        <>
        <SidebarMenu>
            <SidebarMenuItem>
                 <SidebarMenuButton tooltip="Giddy" onClick={() => setIsAssistantOpen(true)}>
                    <Bot className={iconSizeClasses[iconSize]} />
                    <span className="group-data-[state=collapsed]:hidden">Giddy</span>
                 </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton tooltip="Download Source" onClick={() => exportSource()}>
                    <Download className={iconSizeClasses[iconSize]} />
                    <span className="group-data-[state=collapsed]:hidden">Download Source</span>
                 </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <AppSettingsDialog>
                    <SidebarMenuButton tooltip="Settings">
                        <Settings className={iconSizeClasses[iconSize]} />
                        <span className="group-data-[state=collapsed]:hidden">Settings</span>
                    </SidebarMenuButton>
                </AppSettingsDialog>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton tooltip="Logout" onClick={() => signOut()}>
                    <LogOut className={iconSizeClasses[iconSize]} />
                    <span className="group-data-[state=collapsed]:hidden">Logout</span>
                 </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <AiAssistant open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
        </>
    )
}

function UserProfile() {
  const { state } = useSidebar();
  if (state === 'collapsed') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="person avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-semibold">Workspace</span>
        <span className="text-xs text-sidebar-foreground/70">user@email.com</span>
      </div>
    </div>
  );
}


export function BuilderSidebar({ pages, activePageId, onSelectPage, onAddPage, onUpdatePage, onDeletePage, widgets, currentView, onSetView }: BuilderSidebarProps) {
  return (
    <Sidebar collapsible="icon">
    <SidebarHeader>
        <SidebarMenu>
        <SidebarMenuItem className="group/header">
            <div className="flex items-center justify-between h-8 px-2 group-data-[state=collapsed]:justify-center">
            <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 flex items-center justify-center">
                <GiditLogo className="h-6 w-6 transition-opacity group-data-[state=collapsed]:group-hover/header:opacity-0" />
                <SidebarTrigger className="absolute inset-0 size-full group-data-[state=expanded]:hidden group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:group-hover/header:opacity-100" />
                </div>
                <span className="font-bold text-lg text-[#6d28d9] group-data-[state=collapsed]:hidden">
                Gidit
                </span>
            </div>
            <SidebarTrigger className="group-data-[state=collapsed]:hidden" />
            </div>
        </SidebarMenuItem>
        </SidebarMenu>
    </SidebarHeader>
    <SidebarContent className="flex flex-col justify-between p-0">
        <ScrollArea>
            <div className="p-2">
                <PageMenu pages={pages} activePageId={activePageId} onSelectPage={onSelectPage} onUpdatePage={onUpdatePage} onDeletePage={onDeletePage} />
                <CreationMenu onAddPage={onAddPage} />
            </div>
            <SidebarSeparator />
            <ComponentPalette widgets={widgets} onSetView={onSetView} currentView={currentView} />
        </ScrollArea>
        <div className="p-2">
            <BottomMenu />
        </div>
    </SidebarContent>
    <SidebarFooter>
        <UserProfile />
    </SidebarFooter>
    </Sidebar>
  );
}

// Re-export useSidebar so it can be used in builder.tsx
export { useSidebar, SidebarProvider };
