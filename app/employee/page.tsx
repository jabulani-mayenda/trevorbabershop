'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Briefcase,
    DollarSign,
    LogOut,
    Plus,
    History,
    Receipt,
    User,
    Loader2,
    TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState<any>(null);
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Fetch employee data
            const { data: empData } = await supabase
                .from('employees')
                .select('*, businesses(name)')
                .eq('user_id', session.user.id)
                .single();

            if (empData) {
                setEmployee(empData);
            }

            setUser(session.user);
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center gradient-light-bg text-slate-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen gradient-light-bg flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center shadow-md">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-slate-800">BizManager</span>
                </div>
                <button
                    onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
                    className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Desktop Sidebar */}
            <aside className="w-64 gradient-navy hidden md:flex flex-col fixed h-full z-10 shadow-xl">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center shadow-lg">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-white">BizManager</span>
                    </div>
                    <div className="mt-6 p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10 flex items-center space-x-3">
                        <div className="w-10 h-10 gradient-orange rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {employee?.name?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-white truncate">{employee?.name || 'Employee'}</p>
                            <p className="text-xs text-white/70 truncate">{employee?.businesses?.name}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem
                        icon={<DollarSign className="w-5 h-5" />}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <SidebarItem
                        icon={<Plus className="w-5 h-5" />}
                        label="New Sale"
                        active={activeTab === 'new-sale'}
                        onClick={() => setActiveTab('new-sale')}
                    />
                    <SidebarItem
                        icon={<Receipt className="w-5 h-5" />}
                        label="Expenses"
                        active={activeTab === 'expenses'}
                        onClick={() => setActiveTab('expenses')}
                    />
                    <SidebarItem
                        icon={<History className="w-5 h-5" />}
                        label="History"
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                    />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-white/80 hover:bg-red-500/20 hover:text-red-300 rounded-md transition-all text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 capitalize mb-2">{activeTab.replace('-', ' ')}</h1>
                    <p className="text-slate-600">Welcome back, {employee?.name}!</p>
                </header>

                <div className="max-w-2xl mx-auto md:mx-0">
                    {activeTab === 'dashboard' && <EmployeeHome employeeId={employee?.id} />}
                    {activeTab === 'new-sale' && <SalesEntryForm />}
                    {activeTab === 'expenses' && <ExpensesContent />}
                    {activeTab === 'history' && <HistoryContent />}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-20 shadow-lg">
                <MobileNavItem icon={<DollarSign />} label="Dash" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <MobileNavItem icon={<Plus />} label="Sale" active={activeTab === 'new-sale'} onClick={() => setActiveTab('new-sale')} />
                <MobileNavItem icon={<Receipt />} label="Exp" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
                <MobileNavItem icon={<History />} label="Hist" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            </nav>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-all text-sm font-medium ${active
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function MobileNavItem({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <span className="w-5 h-5">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}

function EmployeeHome({ employeeId }: any) {
    const [stats, setStats] = useState({ sales: 0, customers: 0, commission: 0 });

    useEffect(() => {
        if (employeeId) {
            fetchStats();
        }
    }, [employeeId]);

    const fetchStats = async () => {
        // Fetch today's sales
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase
            .from('daily_sales')
            .select('total_sales, service_count')
            .eq('employee_id', employeeId)
            .eq('sale_date', today)
            .single();

        if (salesData) {
            setStats(prev => ({
                ...prev,
                sales: salesData.total_sales || 0,
                customers: salesData.service_count || 0
            }));
        }

        // Fetch pending commission
        const { data: commissionData } = await supabase
            .from('monthly_commissions')
            .select('commission_amount')
            .eq('employee_id', employeeId)
            .eq('status', 'pending')
            .single();

        if (commissionData) {
            setStats(prev => ({
                ...prev,
                commission: commissionData.commission_amount || 0
            }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Today's Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 gradient-blue-cyan rounded-lg shadow-md">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-5 h-5 text-white/80" />
                        </div>
                        <p className="text-sm text-white/80 mb-1">Sales</p>
                        <p className="text-2xl font-bold text-white">${stats.sales.toFixed(2)}</p>
                    </div>
                    <div className="p-4 gradient-purple-pink rounded-lg shadow-md">
                        <div className="flex items-center justify-between mb-2">
                            <User className="w-5 h-5 text-white/80" />
                        </div>
                        <p className="text-sm text-white/80 mb-1">Customers</p>
                        <p className="text-2xl font-bold text-white">{stats.customers}</p>
                    </div>
                </div>
            </div>

            <div className="stat-card gradient-emerald-teal">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        Pending
                    </span>
                </div>
                <p className="text-sm font-medium text-white/90 mb-1">Commission</p>
                <h3 className="text-3xl font-bold text-white mb-2">${stats.commission.toFixed(2)}</h3>
                <p className="text-xs text-white/70">Payable in 30 days</p>
            </div>
        </div>
    );
}

function SalesEntryForm() {
    const [salesAmount, setSalesAmount] = useState('');
    const [customerCount, setCustomerCount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmitSale = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }

            // Get employee record
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('id, business_id')
                .eq('user_id', user.id)
                .single();

            if (empError || !employee) {
                setError('Employee record not found. Please contact admin.');
                setLoading(false);
                return;
            }

            // Insert daily sales record
            const { error: salesError } = await supabase
                .from('daily_sales')
                .insert({
                    employee_id: employee.id,
                    business_id: employee.business_id,
                    sale_date: new Date().toISOString().split('T')[0],
                    service_count: parseInt(customerCount),
                    total_sales: parseFloat(salesAmount),
                    status: 'pending'
                });

            if (salesError) throw salesError;

            setSalesAmount('');
            setCustomerCount('');
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Log Today's Performance</h3>
            <form onSubmit={handleSubmitSale} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Total Sales ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={salesAmount}
                        onChange={(e) => setSalesAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-field text-lg"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Customer Count</label>
                    <input
                        type="number"
                        min="0"
                        value={customerCount}
                        onChange={(e) => setCustomerCount(e.target.value)}
                        placeholder="0"
                        className="input-field text-lg"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-600 text-sm">
                        Sale logged successfully!
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-orange w-full h-12 text-base shadow-md"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <Plus className="w-5 h-5 mr-2" />
                            <span>Log Sales Entry</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

function ExpensesContent() {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Supplies');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [expenses, setExpenses] = useState<any[]>([]);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get employee id first
        const { data: employee } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (employee) {
            const { data } = await supabase
                .from('expenses')
                .select('*')
                .eq('employee_id', employee.id)
                .order('expense_date', { ascending: false })
                .limit(10);

            if (data) setExpenses(data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: employee } = await supabase
                .from('employees')
                .select('id, business_id')
                .eq('user_id', user.id)
                .single();

            if (!employee) throw new Error('Employee record not found');

            const { error } = await supabase
                .from('expenses')
                .insert({
                    business_id: employee.business_id,
                    employee_id: employee.id,
                    amount: parseFloat(amount),
                    category,
                    description,
                    expense_date: new Date().toISOString().split('T')[0]
                });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Expense logged successfully' });
            setAmount('');
            setDescription('');
            fetchExpenses();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Log New Expense</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amount ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="input-field"
                            >
                                <option value="Supplies">Supplies</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Travel">Travel</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field min-h-[80px]"
                            placeholder="Details about the expense..."
                            required
                        />
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-orange w-full">
                        {loading ? 'Saving...' : 'Save Expense'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-semibold text-slate-700">Recent Expenses</div>
                {expenses.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No recent expenses logged.</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {expenses.map((exp: any) => (
                                <tr key={exp.id}>
                                    <td className="px-4 py-3">{new Date(exp.expense_date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{exp.category}</td>
                                    <td className="px-4 py-3 font-medium">${exp.amount.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${exp.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {exp.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function HistoryContent() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: employee } = await supabase
                .from('employees')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (employee) {
                const { data } = await supabase
                    .from('daily_sales')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .order('sale_date', { ascending: false })
                    .limit(20);

                if (data) setSales(data);
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Sales History</h3>
            </div>
            {loading ? (
                <div className="p-8 text-center text-slate-500">Loading history...</div>
            ) : sales.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No sales history found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Customers</th>
                                <th className="px-6 py-3">Total Sales</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sales.map((sale: any) => (
                                <tr key={sale.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{sale.service_count}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">${sale.total_sales.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${sale.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
