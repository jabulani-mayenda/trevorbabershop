'use client';

import StatusBadge from './StatusBadge';

interface Activity {
    id: string;
    action: string;
    user: string;
    date: string;
    status: 'completed' | 'pending' | 'in-progress';
}

interface ActivityTableProps {
    activities: Activity[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 text-sm">
                No recent activity to display.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{activity.id}</td>
                            <td className="px-6 py-4 text-slate-700">{activity.action}</td>
                            <td className="px-6 py-4 text-slate-600">{activity.user}</td>
                            <td className="px-6 py-4 text-slate-600">{activity.date}</td>
                            <td className="px-6 py-4">
                                <StatusBadge status={activity.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
