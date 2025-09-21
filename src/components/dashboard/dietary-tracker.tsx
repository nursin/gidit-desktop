import React, { useState, useRef, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Salad, Camera, Barcode, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { analyzeFoodPhoto } from "../../services/ai";
import { v4 as uuidv4 } from "uuid";

type Nutrient = {
  name: string;
  current: number;
  goal: number;
  unit: string;
};

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

const initialNutrients: Record<string, Nutrient> = {
  // Macronutrients
  calories: { name: "Calories", current: 800, goal: 2000, unit: "kcal" },
  carbohydrates: { name: "Carbohydrates", current: 100, goal: 250, unit: "g" },
  protein: { name: "Protein", current: 50, goal: 56, unit: "g" },
  fat: { name: "Fat", current: 40, goal: 70, unit: "g" },
  saturatedFat: { name: "Saturated Fat", current: 10, goal: 20, unit: "g" },
  omega3: { name: "Omega-3", current: 0.8, goal: 1.6, unit: "g" },
  omega6: { name: "Omega-6", current: 8, goal: 17, unit: "g" },
  fiber: { name: "Fiber", current: 15, goal: 38, unit: "g" },
  water: { name: "Water", current: 1.5, goal: 3.7, unit: "L" },
  // Vitamins
  vitaminA: { name: "Vitamin A", current: 400, goal: 900, unit: "mcg" },
  vitaminC: { name: "Vitamin C", current: 45, goal: 90, unit: "mg" },
  vitaminD: { name: "Vitamin D", current: 5, goal: 15, unit: "mcg" },
  vitaminE: { name: "Vitamin E", current: 8, goal: 15, unit: "mg" },
  vitaminK: { name: "Vitamin K", current: 60, goal: 120, unit: "mcg" },
  vitaminB1: { name: "Vitamin B1 (Thiamine)", current: 0.6, goal: 1.2, unit: "mg" },
  vitaminB2: { name: "Vitamin B2 (Riboflavin)", current: 0.7, goal: 1.3, unit: "mg" },
  vitaminB3: { name: "Vitamin B3 (Niacin)", current: 8, goal: 16, unit: "mg" },
  vitaminB5: { name: "Vitamin B5", current: 2.5, goal: 5, unit: "mg" },
  vitaminB6: { name: "Vitamin B6", current: 0.8, goal: 1.7, unit: "mg" },
  vitaminB7: { name: "Vitamin B7 (Biotin)", current: 15, goal: 30, unit: "mcg" },
  vitaminB9: { name: "Vitamin B9 (Folate)", current: 200, goal: 400, unit: "mcg" },
  vitaminB12: { name: "Vitamin B12", current: 1.2, goal: 2.4, unit: "mcg" },
  // Macrominerals
  calcium: { name: "Calcium", current: 500, goal: 1000, unit: "mg" },
  phosphorus: { name: "Phosphorus", current: 350, goal: 700, unit: "mg" },
  magnesium: { name: "Magnesium", current: 200, goal: 420, unit: "mg" },
  sodium: { name: "Sodium", current: 1000, goal: 1500, unit: "mg" },
  potassium: { name: "Potassium", current: 2300, goal: 4700, unit: "mg" },
  chloride: { name: "Chloride", current: 1100, goal: 2300, unit: "mg" },
  // Trace Minerals
  iron: { name: "Iron", current: 8, goal: 18, unit: "mg" },
  zinc: { name: "Zinc", current: 5, goal: 11, unit: "mg" },
  copper: { name: "Copper", current: 450, goal: 900, unit: "mcg" },
  manganese: { name: "Manganese", current: 1.2, goal: 2.3, unit: "mg" },
  iodine: { name: "Iodine", current: 75, goal: 150, unit: "mcg" },
  selenium: { name: "Selenium", current: 28, goal: 55, unit: "mcg" },
  fluoride: { name: "Fluoride", current: 2, goal: 4, unit: "mg" },
  chromium: { name: "Chromium", current: 18, goal: 35, unit: "mcg" },
  molybdenum: { name: "Molybdenum", current: 22, goal: 45, unit: "mcg" },
  // Conditionally Essential
  choline: { name: "Choline", current: 275, goal: 550, unit: "mg" },
};

const initialFoodLog: FoodItem[] = [
  { id: uuidv4(), name: "Scrambled Eggs (2)", calories: 180, protein: 12, carbohydrates: 2, fat: 14 },
  { id: uuidv4(), name: "Chicken Salad", calories: 450, protein: 30, carbohydrates: 15, fat: 30 },
];

export function DietaryTracker({ name = "Dietary Tracker" }: { name?: string }) {
  const [nutrients, setNutrients] = useState(initialNutrients);
  const [foodLog, setFoodLog] = useState<FoodItem[]>(initialFoodLog);
  const [isAnalyzing, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleBarcodeScan = () => {
    // Demo/local implementation placeholder
    const mockBarcodeItem: FoodItem = {
      id: uuidv4(),
      name: "Protein Bar (Scanned)",
      calories: 210,
      protein: 20,
      carbohydrates: 25,
      fat: 8,
    };
    addFoodItem(mockBarcodeItem);
    toast({ title: "Item Added", description: "Protein Bar added from barcode scan." });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      startTransition(async () => {
        try {
          // analyzeFoodPhoto is a renderer service that calls into Electron main via IPC
          const result = await analyzeFoodPhoto({ photoDataUri: dataUri });
          // Expecting result.items: FoodItem[]
          result.items.forEach((item: Omit<FoodItem, "id">) => {
            addFoodItem({ id: uuidv4(), ...item });
          });
          toast({ title: "Meal Analyzed!", description: `${result.items.length} items added from your photo.` });
        } catch (error) {
          console.error(error);
          toast({ title: "Analysis Failed", description: "Could not analyze the food photo.", variant: "destructive" });
        }
      });
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = "";
  };

  const addFoodItem = (item: FoodItem) => {
    setFoodLog(prev => [item, ...prev]);
    setNutrients(prev => ({
      ...prev,
      calories: { ...prev.calories, current: prev.calories.current + item.calories },
      protein: { ...prev.protein, current: prev.protein.current + item.protein },
      carbohydrates: { ...prev.carbohydrates, current: prev.carbohydrates.current + item.carbohydrates },
      fat: { ...prev.fat, current: prev.fat.current + item.fat },
    }));
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Salad className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Track your daily nutritional intake.</CardDescription>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Food
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Food Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                  Analyze Photo of Meal
                </Button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                <Button onClick={handleBarcodeScan}>
                  <Barcode className="w-4 h-4 mr-2" />
                  Scan Barcode (Demo)
                </Button>
                {/* Manual entry form could be added here */}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col gap-4 min-h-0">
          <h3 className="font-semibold text-center flex-shrink-0">Daily Totals</h3>
          <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="space-y-4">
              {Object.values(nutrients).map((nutrient) => (
                <div key={nutrient.name}>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-medium">{nutrient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {nutrient.current.toFixed(1)} / {nutrient.goal} {nutrient.unit}
                    </p>
                  </div>
                  <Progress value={(nutrient.current / nutrient.goal) * 100} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="flex flex-col gap-4 min-h-0">
          <h3 className="font-semibold text-center flex-shrink-0">Today's Log</h3>
          <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="space-y-3">
              {foodLog.map(item => (
                <div key={item.id} className="p-3 bg-background/50 rounded-lg text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>{item.name}</span>
                    <span>{item.calories} kcal</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>P: {item.protein}g</span>
                    <span>C: {item.carbohydrates}g</span>
                    <span>F: {item.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
