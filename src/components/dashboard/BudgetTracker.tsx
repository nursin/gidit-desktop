import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { PiggyBank, Pencil, ShoppingCart, Car, Clapperboard, Home } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

type Category = {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon: React.ReactNode;
};

const initialCategories: Category[] = [
  { id: "cat1", name: "Groceries", budgeted: 500, spent: 275, icon: <ShoppingCart className="w-5 h-5 text-green-500" /> },
  { id: "cat2", name: "Transport", budgeted: 150, spent: 90, icon: <Car className="w-5 h-5 text-blue-500" /> },
  { id: "cat3", name: "Entertainment", budgeted: 200, spent: 220, icon: <Clapperboard className="w-5 h-5 text-purple-500" /> },
  { id: "cat4", name: "Housing", budgeted: 1200, spent: 1200, icon: <Home className="w-5 h-5 text-orange-500" /> },
];

type BudgetTrackerProps = {
  name?: string;
};

export function BudgetTracker({ name = "Budget Tracker" }: BudgetTrackerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newBudget, setNewBudget] = useState<number>(0);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setNewBudget(category.budgeted);
  };

  const handleSaveBudget = () => {
    if (!editingCategory) return;
    setCategories(
      categories.map((cat) =>
        cat.id === editingCategory.id ? { ...cat, budgeted: newBudget } : cat
      )
    );
    setEditingCategory(null);
  };
  
  const totalBudgeted = categories.reduce((acc, cat) => acc + cat.budgeted, 0);
  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <PiggyBank className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Monitor your spending by category.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow min-h-0">
        <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
                <h4 className="text-sm font-semibold">Overall Budget</h4>
                <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">${totalSpent.toLocaleString()}</span> / ${totalBudgeted.toLocaleString()}
                </p>
            </div>
            <Progress value={overallProgress} />
        </div>
        <ScrollArea className="flex-grow -mx-6">
            <div className="px-6 space-y-4">
            {categories.map((category) => {
                const progress = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
                const isOverBudget = category.spent > category.budgeted;
                return (
                <div key={category.id}>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            {category.icon}
                            <h5 className="text-sm font-medium">{category.name}</h5>
                        </div>
                        <div className="flex items-center gap-2">
                             <p className="text-xs text-muted-foreground">
                                <span className={isOverBudget ? "text-destructive font-bold" : "text-foreground font-bold"}>
                                    ${category.spent.toLocaleString()}
                                </span> / ${category.budgeted.toLocaleString()}
                            </p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(category)}>
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                    <DialogTitle>Edit Budget for {editingCategory?.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="budget" className="text-right">Budget</Label>
                                            <Input
                                            id="budget"
                                            type="number"
                                            value={newBudget}
                                            onChange={(e) => setNewBudget(Number(e.target.value))}
                                            className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" onClick={handleSaveBudget}>Save changes</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <Progress value={progress} className={isOverBudget ? "[&>div]:bg-destructive" : ""} />
                </div>
                );
            })}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
