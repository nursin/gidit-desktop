import React, { HTMLAttributes } from "react";
import { Button } from "../ui/button";
import { GripVertical, X, Settings, Minus, Plus } from "lucide-react";
import { type WidgetId } from "../../../app/renderer/src/components/dashboard/dashboard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../app/renderer/src/components/ui/popover";
import { Label } from "../../../app/renderer/src/components/ui/label";
import { Input } from "../../../app/renderer/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../app/renderer/src/components/ui/select";
import { RadioGroup, RadioGroupItem } from "../../../app/renderer/src/components/ui/radio-group";

type WidgetWrapperProps = {
  children: React.ReactNode;
  id: string;
  widgetId: WidgetId;
  name?: string;
  width: number;
  height: number;
  onRemove: (id: string) => void;
  onSizeChange: (id: string, newSize: { width: number; height: number }) => void;
  onNameChange: (id: string, newName: string) => void;
  onPropChange: (id: string, newProps: Record<string, any>) => void;
  isOverlay?: boolean;
  font?: string;
  theme?: "light" | "dark" | "custom";
  customBackgroundColor?: string;
  customTextColor?: string;
  [key: string]: any;
} & HTMLAttributes<HTMLDivElement>;

const FONT_OPTIONS = [
  { value: "font-inter", label: "Inter" },
  { value: "font-roboto", label: "Roboto" },
  { value: "font-lato", label: "Lato" },
  { value: "font-montserrat", label: "Montserrat" },
];

// small classnames helper (replaces "@/lib/utils" cn)
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function WidgetWrapper({
  children,
  id,
  widgetId,
  name,
  width,
  height,
  onRemove,
  onSizeChange,
  onNameChange,
  onPropChange,
  isOverlay = false,
  font = "font-inter",
  theme = "light",
  customBackgroundColor,
  customTextColor,
  ...props
}: WidgetWrapperProps) {
  // Separate dnd-kit listeners and attributes from other custom props.
  // This prevents props like `onSaveNoteAsPage` from being passed to the DOM element.
  const {
    style,
    className,
    onKeyDown,
    onMouseDown,
    onTouchStart,
    // Destructure and discard other known custom props that are not HTML attributes
    rawNotes,
    organizedNotes,
    onSaveNoteAsPage,
    toolsThatWorked,
    toolsToTry,
    focusBreakers,
    orientation,
    // All remaining props are passed to the draggable button
    ...restDraggableProps
  } = props as Record<string, any>;

  const renderSettings = () => {
    const customSettings: Record<string, React.ReactNode> = {
      NavigationBar: (
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="orientation">Orientation</Label>
          <div className="col-span-2">
            <Select
              defaultValue={props.orientation || "horizontal"}
              onValueChange={(value) => onPropChange(id, { orientation: value })}
            >
              <SelectTrigger id="orientation" className="h-8">
                <SelectValue placeholder="Select orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    };

    return (
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Settings</h4>
          <p className="text-sm text-muted-foreground">Customize your widget.</p>
        </div>
        <div className="grid gap-4">
          {customSettings[widgetId as keyof typeof customSettings]}
          {Object.keys(customSettings).includes(widgetId) && <hr />}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              defaultValue={name}
              onChange={(e) => onNameChange(id, e.target.value)}
              className="col-span-2 h-8"
            />
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="width">Width</Label>
            <div className="col-span-2 flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onSizeChange(id, { width: Math.max(1, width - 1), height })}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span>{width}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onSizeChange(id, { width: Math.min(4, width + 1), height })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="height">Height</Label>
            <div className="col-span-2 flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onSizeChange(id, { width, height: Math.max(1, height - 1) })}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span>{height}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onSizeChange(id, { width, height: Math.min(8, height + 1) })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Theme</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => onPropChange(id, { theme: value })}
              className="col-span-2 flex items-center gap-2"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="light" id={`light-${id}`} />
                <Label htmlFor={`light-${id}`} className="text-xs">
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="dark" id={`dark-${id}`} />
                <Label htmlFor={`dark-${id}`} className="text-xs">
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="custom" id={`custom-${id}`} />
                <Label htmlFor={`custom-${id}`} className="text-xs">
                  Custom
                </Label>
              </div>
            </RadioGroup>
          </div>

          {theme === "custom" && (
            <>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`bg-color-${id}`}>BG Color</Label>
                <Input
                  id={`bg-color-${id}`}
                  type="color"
                  defaultValue={customBackgroundColor || "#ffffff"}
                  onChange={(e) => onPropChange(id, { customBackgroundColor: e.target.value })}
                  className="col-span-2 h-8 p-1"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`text-color-${id}`}>Text Color</Label>
                <Input
                  id={`text-color-${id}`}
                  type="color"
                  defaultValue={customTextColor || "#000000"}
                  onChange={(e) => onPropChange(id, { customTextColor: e.target.value })}
                  className="col-span-2 h-8 p-1"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Font</Label>
            <div className="col-span-2">
              <Select
                defaultValue={font}
                onValueChange={(value) => onPropChange(id, { font: value })}
              >
                <SelectTrigger id={`font-${id}`} className="h-8">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const themeClasses: Record<string, string> = {
    light: "bg-card text-card-foreground",
    dark: "dark bg-card text-card-foreground",
    custom: "",
  };

  const customStyle: React.CSSProperties =
    theme === "custom"
      ? {
          backgroundColor: customBackgroundColor,
          color: customTextColor,
        }
      : {};

  return (
    <div
      className={cn(
        "relative h-full w-full group rounded-lg border shadow-sm",
        themeClasses[theme],
        font,
        isOverlay && theme === "light" && "bg-card",
        className
      )}
      style={{ ...(style as React.CSSProperties), ...customStyle }}
      {...(props as any)}
    >
      {!isOverlay && (
        <div className="absolute top-2 right-1 flex items-center bg-card/50 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">{renderSettings()}</PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-grab"
            {...restDraggableProps}
          >
            <GripVertical className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRemove(id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="h-full w-full bg-transparent overflow-hidden">{children}</div>
    </div>
  );
}
