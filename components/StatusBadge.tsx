'use client';

interface StatusBadgeProps {
    status: 'completed' | 'pending' | 'in-progress';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const variants = {
        completed: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            label: 'Completed'
        },
        pending: {
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            border: 'border-orange-200',
            label: 'Pending'
        },
        'in-progress': {
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
            label: 'In Progress'
        }
    };

    const variant = variants[status];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variant.bg} ${variant.text} ${variant.border}`}>
            {variant.label}
        </span>
    );
}
