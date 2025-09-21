import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Sheet, Plus } from "lucide-react";

export function Spreadsheet({ name = "Spreadsheet" }: { name?: string }) {
  const [rows, setRows] = useState(50);
  const [cols, setCols] = useState(26);
  const [data, setData] = useState<Record<string, string>>({});

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const key = `${rowIndex}-${colIndex}`;
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const getColumnName = (index: number) => {
    let name = "";
    let n = index;
    while (n >= 0) {
      name = String.fromCharCode((n % 26) + 65) + name;
      n = Math.floor(n / 26) - 1;
    }
    return name;
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>Organize your data in a grid.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows((r) => r + 1)}
              aria-label="Add row"
            >
              <Plus className="w-4 h-4 mr-2" />
              Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCols((c) => c + 1)}
              aria-label="Add column"
            >
              <Plus className="w-4 h-4 mr-2" />
              Column
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-auto border rounded-lg">
        <div className="relative">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-secondary">
                <th className="sticky top-0 left-0 z-20 bg-secondary p-1 border w-12"></th>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="sticky top-0 bg-secondary p-1 border min-w-[100px] font-semibold"
                    scope="col"
                  >
                    {getColumnName(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="sticky left-0 bg-secondary p-1 border w-12 text-center font-semibold">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: cols }).map((_, colIndex) => (
                    <td key={colIndex} className="p-0 border">
                      <input
                        type="text"
                        value={data[`${rowIndex}-${colIndex}`] || ""}
                        onChange={(e) =>
                          handleCellChange(rowIndex, colIndex, e.target.value)
                        }
                        className="w-full h-full p-1 bg-transparent focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        aria-label={`Cell ${rowIndex + 1}-${getColumnName(colIndex)}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default Spreadsheet;
