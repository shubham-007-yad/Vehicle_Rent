"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VolumeChartProps {
  data: { date: string; checkIns: number; returns: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Activity Volume (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-IN', { weekday: 'short' });
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col border-b pb-1 mb-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {new Date(payload[0].payload.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[0.70rem] uppercase text-blue-500 font-bold">
                            Check-ins
                          </span>
                          <span className="font-bold">{payload[0].value}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[0.70rem] uppercase text-green-500 font-bold">
                            Returns
                          </span>
                          <span className="font-bold">{payload[1].value}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="checkIns" name="Check-ins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="returns" name="Returns" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
