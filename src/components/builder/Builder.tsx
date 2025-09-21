import React, { useState, useEffect, cloneElement } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";

import { Canvas } from "./Canvas";
import { WIDGETS, type WidgetId } from "../../../app/renderer/src/components/dashboard/dashboard";
import { WidgetWrapper } from "./WidgetWrapper";
import { BuilderSidebar, useSidebar } from "../layout/BuilderSidebar";
import { useToast } from "../../hooks/useToast";
import { Templates } from "./Templates";
import type { Template } from "./template-data";
import { useSettings } from "../../context/settings-context";
import { SidebarProvider } from "../ui/sidebar";
import { cn } from "../../lib/utils";

export type Item = {
  id: string;
  widgetId: WidgetId;
  name?: string;
  width: number; // col-span
  height: number; // row-span
  color?: string;
  font?: string;
  theme?: "light" | "dark" | "custom";
  customBackgroundColor?: string;
  customTextColor?: string;
  [key: string]: any; // for additional props
};

export type Page = {
  id: string;
  name: string;
  icon: string;
  items: Item[];
};

export type View = "canvas" | "templates";

const initialPages: Page[] = [
  { id: "home", name: "Dashboard", icon: "LayoutDashboard", items: [] },
];

function BuilderContent() {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState<WidgetId | null>(null);
  const [view, setView] = useState<View>("canvas");
  const { toast } = useToast();
  const { font, theme } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  const { open: sidebarOpen, setOpen: setSidebarOpen, state: sidebarState } = useSidebar();

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("app-state");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.pages && parsedState.pages.length > 0) {
          setPages(parsedState.pages);
        }
      }
    } catch (error) {
      console.error("Failed to load state from local storage", error);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const appState = JSON.stringify({ pages });
        localStorage.setItem("app-state", appState);
      } catch (error) {
        console.error("Failed to save state to local storage", error);
      }
    }
  }, [pages, isMounted]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activePage = pages[activePageIndex];
  const setItems = (newItems: Item[] | ((prevItems: Item[]) => Item[])) => {
    const updatedItems = typeof newItems === "function" ? newItems(activePage.items) : newItems;
    const newPages = [...pages];
    newPages[activePageIndex] = { ...activePage, items: updatedItems };
    setPages(newPages);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data?.current?.isSidebarItem) {
      setActiveSidebarItem(active.id as WidgetId);
    } else {
      setActiveId(active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || (active.id === over.id && !active.data?.current?.isSidebarItem)) {
      setActiveId(null);
      setActiveSidebarItem(null);
      return;
    }

    const isPageDrag = active.data?.current?.type === "Page";
    const isWidgetDrag = active.data?.current?.type === "Widget";
    const isSidebarItem = active.data?.current?.isSidebarItem;

    if (isPageDrag) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newPages = arrayMove(pages, oldIndex, newIndex);
        setPages(newPages);

        // Update active page index if it was moved
        const activePageId = pages[activePageIndex].id;
        const newActiveIndex = newPages.findIndex((p) => p.id === activePageId);
        setActivePageIndex(newActiveIndex);
      }
    } else if (isWidgetDrag) {
      const oldIndex = activePage.items.findIndex((item) => item.id === active.id);
      const newIndex = activePage.items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems((items) => arrayMove(items, oldIndex, newIndex));
      }
    } else if (isSidebarItem && over?.id === "canvas-droppable") {
      // Drop handled in handleDragOver, this just cleans up
    }

    setActiveId(null);
    setActiveSidebarItem(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!active.data?.current?.isSidebarItem || !over) {
      return;
    }

    // Check if the item is being dragged over the canvas itself or any item on the canvas.
    const isOverCanvas =
      over.id === "canvas-droppable" || activePage.items.some((item) => item.id === over.id);

    if (isOverCanvas) {
      const widgetId = active.id as WidgetId;

      // Ensure we only add the item once per drag operation
      const isAlreadyOnCanvas =
        active.data.current.uniqueId &&
        activePage.items.some((item) => item.id.includes(active.data.current.uniqueId));

      if (!isAlreadyOnCanvas) {
        const uniqueId = uuidv4();
        active.data.current.uniqueId = uniqueId;

        const widget = WIDGETS[widgetId];
        const initialWidth = "initialWidth" in widget ? widget.initialWidth : 2;
        const initialHeight = "initialHeight" in widget ? widget.initialHeight : 2;

        const newItem: Item = {
          id: `${widgetId}-${uniqueId}`,
          widgetId,
          width: initialWidth,
          height: initialHeight,
          font: font,
          theme: theme,
        };
        setItems((prev) => [...prev, newItem]);
      }
    }
  };

  const handleRemoveWidget = (id: string) => {
    setItems((items) => items.filter((item) => item.id !== id));
  };

  const handleSizeChange = (id: string, newSize: { width: number; height: number }) => {
    setItems((items) => items.map((item) => (item.id === id ? { ...item, ...newSize } : item)));
  };

  const handleNameChange = (id: string, newName: string) => {
    setItems((items) => items.map((item) => (item.id === id ? { ...item, name: newName } : item)));
  };

  const handlePropChange = (id: string, newProps: Record<string, any>) => {
    setItems((items) => items.map((item) => (item.id === id ? { ...item, ...newProps } : item)));
  };

  const handleAddPage = () => {
    const newPage: Page = {
      id: uuidv4(),
      name: `Page ${pages.length + 1}`,
      icon: "File",
      items: [],
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
    toast({
      title: "Page Added",
      description: `"${newPage.name}" has been created.`,
    });
  };

  const handleDeletePage = (pageId: string) => {
    const pageToDeleteIndex = pages.findIndex((p) => p.id === pageId);
    if (pageToDeleteIndex === -1) return;

    const pageToDeleteName = pages[pageToDeleteIndex].name;
    const newPages = pages.filter((p) => p.id !== pageId);

    // If there are no pages left, create a default one
    if (newPages.length === 0) {
      setPages(initialPages);
      setActivePageIndex(0);
    } else {
      // If the active page is being deleted, move to the first page
      if (activePageIndex === pageToDeleteIndex) {
        setActivePageIndex(0);
      } else if (activePageIndex > pageToDeleteIndex) {
        // If a page before the active one is deleted, adjust the index
        setActivePageIndex(activePageIndex - 1);
      }
      setPages(newPages);
    }

    toast({
      title: "Page Deleted",
      description: `"${pageToDeleteName}" has been removed.`,
    });
  };

  const handleUseTemplate = (template: Template) => {
    const newPage: Page = {
      id: uuidv4(),
      name: template.name,
      icon: "LayoutTemplate",
      items: template.items.map((item) => ({ ...item, id: `${item.widgetId}-${uuidv4()}` })),
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
    setView("canvas");
    toast({
      title: "Template Loaded",
      description: `New page "${template.name}" created.`,
    });
  };

  const handleUpdatePage = (pageId: string, updates: Partial<Page>) => {
    setPages(pages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)));
  };

  const handleSelectPage = (pageId: string) => {
    setActivePageIndex(pages.findIndex((p) => p.id === pageId));
    setView("canvas");
  };

  const handleMainClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const activeItem = activeId ? activePage.items.find((item) => item.id === activeId) : null;

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-1 h-screen">
        <BuilderSidebar
          pages={pages}
          activePageId={activePage.id}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          widgets={WIDGETS}
          currentView={view}
          onSetView={setView}
        />
        <main
          className={cn(
            "flex flex-col flex-grow bg-secondary/20 h-screen w-full transition-[margin-left] duration-200 ease-in-out",
            sidebarState === "collapsed" && "md:ml-[--sidebar-width-icon]"
          )}
          onClick={handleMainClick}
        >
          {view === "canvas" ? (
            <Canvas
              items={activePage.items}
              onRemoveWidget={handleRemoveWidget}
              onSizeChange={handleSizeChange}
              onNameChange={handleNameChange}
              onPropChange={handlePropChange}
            />
          ) : (
            <Templates onUseTemplate={handleUseTemplate} />
          )}
        </main>
      </div>
      <DragOverlay>
        {activeItem ? (
          <WidgetWrapper
            id={activeItem.id}
            widgetId={activeItem.widgetId}
            {...activeItem}
            onRemove={() => {}}
            onSizeChange={() => {}}
            onNameChange={() => {}}
            onPropChange={() => {}}
            isOverlay
          >
            {WIDGETS[activeItem.widgetId].component}
          </WidgetWrapper>
        ) : activeSidebarItem ? (
          <div className="h-24 w-40 bg-background border rounded-lg overflow-hidden relative shadow-lg">
            <div className="absolute top-0 left-0 origin-top-left" style={{ transform: "scale(0.3)" }}>
              <div className="w-[32rem] h-[24rem]">
                {cloneElement(WIDGETS[activeSidebarItem].component, { name: "" })}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function Builder() {
  return (
    <SidebarProvider>
      <BuilderContent />
    </SidebarProvider>
  );
}
