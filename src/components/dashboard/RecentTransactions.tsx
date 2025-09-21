import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ShoppingCart,
  Coffee,
  Car,
  Plane,
  Home,
} from "lucide-react";
import { format } from "date-fns";

const transactions: {
  id: string;
  merchant: string;
  category: string;
  date: Date;
  amount: number;
  icon: React.ReactNode;
}[] = [
  {
    id: "txn1",
    merchant: "Starbucks",
    category: "Food & Drink",
    date: new Date(Date.now() - 86400000 * 0), // Today
    amount: -7.5,
    icon: <Coffee className="w-5 h-5 text-yellow-700" />,
  },
  {
    id: "txn2",
    merchant: "Amazon",
    category: "Shopping",
    date: new Date(Date.now() - 86400000 * 1), // Yesterday
    amount: -124.99,
    icon: <ShoppingCart className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "txn3",
    merchant: "Paycheck",
    category: "Income",
    date: new Date(Date.now() - 86400000 * 2),
    amount: 1200.0,
    icon: <ArrowUpRight className="w-5 h-5 text-green-500" />,
  },
  {
    id: "txn4",
    merchant: "Uber",
    category: "Transport",
    date: new Date(Date.now() - 86400000 * 2),
    amount: -22.3,
    icon: <Car className="w-5 h-5 text-indigo-500" />,
  },
  {
    id: "txn5",
    merchant: "Delta Airlines",
    category: "Travel",
    date: new Date(Date.now() - 86400000 * 4),
    amount: -450.78,
    icon: <Plane className="w-5 h-5 text-cyan-500" />,
  },
  {
    id: "txn6",
    merchant: "Mortgage Payment",
    category: "Housing",
    date: new Date(Date.now() - 86400000 * 5),
    amount: -1800.0,
    icon: <Home className="w-5 h-5 text-orange-500" />,
  },
];

type RecentTransactionsProps = {
  name?: string;
  className?: string;
};

export function RecentTransactions({
  name = "Recent Transactions",
  className = "",
}: RecentTransactionsProps) {
  return (
    <div
      className={`flex flex-col h-full bg-transparent border-0 shadow-none ${className}`}
      role="region"
      aria-label={name}
    >
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <ArrowDownRight className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">
              Your latest financial activity.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow p-0 min-h-0">
        <div className="h-full overflow-auto">
          <div className="space-y-4 py-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 px-6"
                aria-hidden={false}
              >
                <div className="p-2 bg-secondary rounded-full">
                  {transaction.icon}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-sm">{transaction.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium text-sm ${
                      transaction.amount > 0 ? "text-green-600" : ""
                    }`}
                  >
                    {transaction.amount < 0 ? "-" : ""}
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(transaction.date, "MMM d")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecentTransactions;
