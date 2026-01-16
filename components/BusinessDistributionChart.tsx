'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DistributionData {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface BusinessDistributionChartProps {
    data: DistributionData[];
}

export default function BusinessDistributionChart({ data }: BusinessDistributionChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const renderCustomLabel = (entry: any) => {
        const percent = ((entry.value / total) * 100).toFixed(0);
        return `${percent}%`;
    };

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={renderCustomLabel}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: any) => [value, 'Count']}
                    />
                    <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        formatter={(value) => <span className="text-sm text-slate-700">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
