"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface RevenueData {
  month: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-gray-50/50 rounded-md border border-dashed mt-4">
        No revenue data available
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip 
            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
