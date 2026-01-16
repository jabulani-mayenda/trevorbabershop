'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart3,
    Users,
    Building2,
    Briefcase,
    LogOut,
    Plus,
    FileText,
    TrendingUp,
    X,
    MapPin,
    Mail,
    Lock,
    Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ActivityTable from '@/components/ActivityTable';
import RevenueChart from '@/components/RevenueChart';
import BusinessDistributionChart from '@/components/BusinessDistributionChart';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [stats, setStats] = useState({ revenue: 0, businesses: 0, employees: 0 });
    const [adminId, setAdminId] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            const { data: user } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (user?.role !== 'admin') {
                router.push('/employee');
                return;
            }

            setAdminId(session.user.id);
            await fetchData(session.user.id);
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    const fetchData = async (adminId: string) => {
        // Fetch businesses
        const { data: bizData } = await supabase
            .from('businesses')
            .select('*')
            .eq('admin_id', adminId);

        if (bizData) {
            setBusinesses(bizData);

            // Fetch total employees across all businesses
            const businessIds = bizData.map(b => b.id);
            let totalEmployees = 0;
            let totalRevenue = 0;

            if (businessIds.length > 0) {
                const { data: empData, count } = await supabase
                    .from('employees')
                    .select('id', { count: 'exact' })
                    .in('business_id', businessIds);

                totalEmployees = count || 0;

                // Fetch total revenue from daily_sales
                const { data: salesData } = await supabase
                    .from('daily_sales')
                    .select('total_sales')
                    .in('business_id', businessIds);

                if (salesData) {
                    totalRevenue = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_sales) || 0), 0);
                }
            }

            setStats({
                businesses: bizData.length,
                employees: totalEmployees,
                revenue: totalRevenue
            });
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center gradient-light-bg text-slate-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen gradient-light-bg flex">
            {/* Sidebar */}
            <aside className="w-64 gradient-navy hidden md:flex flex-col fixed h-full z-10 shadow-xl">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center shadow-lg">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-white">BizManager</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem
                        icon={<BarChart3 className="w-5 h-5" />}
                        label="Overview"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={<Building2 className="w-5 h-5" />}
                        label="My Businesses"
                        active={activeTab === 'businesses'}
                        onClick={() => setActiveTab('businesses')}
                    />
                    <SidebarItem
                        icon={<Users className="w-5 h-5" />}
                        label="Employees"
                        active={activeTab === 'employees'}
                        onClick={() => setActiveTab('employees')}
                    />
                    <SidebarItem
                        icon={<FileText className="w-5 h-5" />}
                        label="Reports"
                        active={activeTab === 'reports'}
                        onClick={() => setActiveTab('reports')}
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
            <main className="flex-1 md:ml-64 p-4 md:p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h1>
                    <div className="flex items-center space-x-4">
                        <button className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-white font-bold text-sm shadow-md">
                            A
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto">
                    {activeTab === 'overview' && <OverviewContent stats={stats} businesses={businesses} />}
                    {activeTab === 'businesses' && <BusinessesContent businesses={businesses} onRefresh={() => adminId && fetchData(adminId)} />}
                    {activeTab === 'employees' && <EmployeesContent businesses={businesses} />}
                    {activeTab === 'reports' && <ReportsContent businesses={businesses} />}
                </div>
            </main>
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

function OverviewContent({ stats, businesses }: any) {
    // Real distribution data from businesses
    const distributionData = businesses.reduce((acc: any[], biz: any) => {
        const type = biz.business_type || 'Other';
        const existing = acc.find(item => item.name === type);
        if (existing) {
            existing.value += 1;
        } else {
            const colors: Record<string, string> = {
                'Barbershop': '#3b82f6',
                'Retail': '#8b5cf6',
                'Restaurant': '#ec4899',
                'Service': '#14b8a6',
                'Other': '#64748b'
            };
            acc.push({ name: type, value: 1, color: colors[type] || '#64748b' });
        }
        return acc;
    }, []);

    // Empty state for charts if no data
    const hasData = businesses.length > 0;

    const recentActivities: any[] = []; // Will be empty - real activities would come from a separate table

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card gradient-emerald-teal">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            +12%
                        </span>
                    </div>
                    <p className="text-sm font-medium text-white/80 mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-white">${stats.revenue.toLocaleString()}</h3>
                </div>

                <div className="stat-card gradient-purple-pink">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            Active
                        </span>
                    </div>
                    <p className="text-sm font-medium text-white/80 mb-1">Total Businesses</p>
                    <h3 className="text-3xl font-bold text-white">{stats.businesses}</h3>
                </div>

                <div className="stat-card gradient-blue-cyan">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            Team
                        </span>
                    </div>
                    <p className="text-sm font-medium text-white/80 mb-1">Total Employees</p>
                    <h3 className="text-3xl font-bold text-white">{stats.employees}</h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Trend</h3>
                    {hasData ? (
                        <RevenueChart data={[]} />
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-400">
                            No sales data yet. Add businesses and record sales to see trends.
                        </div>
                    )}
                </div>

                {/* Business Distribution Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Business Distribution</h3>
                    {hasData ? (
                        <BusinessDistributionChart data={distributionData} />
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-400">
                            No businesses yet. Create your first business to see distribution.
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                </div>
                {recentActivities.length > 0 ? (
                    <ActivityTable activities={recentActivities} />
                ) : (
                    <div className="p-8 text-center text-slate-400">
                        No recent activity. Your actions will appear here.
                    </div>
                )}
            </div>
        </div>
    );
}

function BusinessesContent({ businesses, onRefresh }: any) {
    const [showModal, setShowModal] = useState(false);
    const [selectedBusinessForDetails, setSelectedBusinessForDetails] = useState<any>(null);

    const handleDelete = async (businessId: string) => {
        if (!confirm('Are you sure you want to delete this business? All associated employees and data will also be deleted.')) return;

        try {
            const { error } = await supabase
                .from('businesses')
                .delete()
                .eq('id', businessId);

            if (error) throw error;
            onRefresh();
        } catch (err: any) {
            alert('Error deleting business: ' + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Your Businesses</h3>
                    <p className="text-sm text-slate-500">Manage your business entities</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-orange space-x-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    <span>Add Business</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {businesses.length === 0 ? (
                    <div className="p-16 text-center">
                        {/* Illustration */}
                        <div className="inline-flex items-center justify-center w-32 h-32 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full">
                            <div className="relative">
                                <Building2 className="w-16 h-16 text-blue-500 absolute -left-4 -top-2" />
                                <Building2 className="w-12 h-12 text-purple-400 absolute left-6 top-4 opacity-60" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No businesses yet!</h3>
                        <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                            Create your first business to get started with tracking sales, employees, and performance.
                        </p>
                        <button onClick={() => setShowModal(true)} className="btn-orange space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Create Business</span>
                        </button>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {businesses.map((biz: any) => {
                                const typeColors: Record<string, string> = {
                                    'Barbershop': 'from-blue-500 to-blue-600',
                                    'Retail': 'from-purple-500 to-purple-600',
                                    'Restaurant': 'from-pink-500 to-pink-600',
                                    'Service': 'from-teal-500 to-teal-600',
                                    'Other': 'from-slate-500 to-slate-600'
                                };
                                const gradient = typeColors[biz.business_type] || typeColors['Other'];

                                return (
                                    <div key={biz.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
                                        {/* Card Header with Gradient */}
                                        <div className={`bg-gradient-to-r ${gradient} p-4`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                        <Building2 className="w-6 h-6 text-white" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-white/90 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                                        {biz.business_type}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(biz.id); }}
                                                    className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm text-white"
                                                    title="Delete Business"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5">
                                            <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                {biz.name}
                                            </h4>

                                            <div className="flex items-center text-slate-500 text-sm mb-4">
                                                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                                {biz.location}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <span className="text-xs text-slate-400">
                                                    Created {new Date(biz.created_at).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedBusinessForDetails(biz)}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    View Details →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {showModal && <CreateBusinessModal onClose={() => { setShowModal(false); onRefresh(); }} />}
            {selectedBusinessForDetails && (
                <BusinessDetailsModal
                    business={selectedBusinessForDetails}
                    onClose={() => setSelectedBusinessForDetails(null)}
                />
            )}
        </div>
    );
}

function CreateBusinessModal({ onClose }: any) {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            console.log('Creating business for user:', user.id);

            const { data: insertedData, error: insertError } = await supabase
                .from('businesses')
                .insert({
                    admin_id: user.id,
                    name,
                    business_type: type,
                    location,
                    description
                })
                .select();

            console.log('Insert result:', { insertedData, insertError });

            if (insertError) throw insertError;

            alert('Business created successfully!');
            onClose();
        } catch (err: any) {
            console.error('Business creation error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-bold">Create New Business</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Business Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="Enter your business name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Business Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select a type</option>
                            <option value="Barbershop">Barbershop</option>
                            <option value="Retail">Retail</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Service">Service</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Enter location"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field min-h-[80px]"
                            placeholder="Briefly describe your business activities..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-outline">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-orange">
                            {loading ? 'Creating...' : 'Create Business'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EmployeesContent({ businesses }: any) {
    const [showModal, setShowModal] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        if (selectedBusiness) {
            fetchEmployees();
        }
    }, [selectedBusiness]);

    const fetchEmployees = async () => {
        const { data } = await supabase
            .from('employees')
            .select('*, users(email)')
            .eq('business_id', selectedBusiness);

        if (data) setEmployees(data);
    };

    const handleDelete = async (employeeId: string) => {
        if (!confirm('Are you sure you want to remove this employee? This cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', employeeId);

            if (error) throw error;

            setEmployees(prev => prev.filter(e => e.id !== employeeId));
        } catch (err: any) {
            alert('Error deleting employee: ' + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Team Members</h3>
                    <p className="text-sm text-slate-500">Manage employee accounts and access</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    disabled={businesses.length === 0}
                    className="btn-orange space-x-2 w-full sm:w-auto disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Employee</span>
                </button>
            </div>

            {businesses.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
                    Create a business first to add employees
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Select Business</label>
                        <select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            className="input-field max-w-md"
                        >
                            <option value="">Choose a business...</option>
                            {businesses.map((biz: any) => (
                                <option key={biz.id} value={biz.id}>{biz.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedBusiness && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {employees.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No employees found. Add your first team member!
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-blue-50 text-slate-700 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Commission Rate</th>
                                            <th className="px-6 py-3">Joined</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employees.map((emp: any) => (
                                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
                                                <td className="px-6 py-4 text-slate-600">{emp.users?.email}</td>
                                                <td className="px-6 py-4 text-slate-600">{emp.commission_rate}%</td>
                                                <td className="px-6 py-4 text-slate-600">{new Date(emp.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(emp.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Remove Employee"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {showModal && <CreateEmployeeModal businesses={businesses} onClose={() => { setShowModal(false); fetchEmployees(); }} />}
        </div>
    );
}

function CreateEmployeeModal({ businesses, onClose }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessId, setBusinessId] = useState('');
    const [commissionRate, setCommissionRate] = useState('10');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user');

            // Create user record
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email,
                    role: 'employee'
                });

            if (userError) throw userError;

            // Create employee record
            const { error: empError } = await supabase
                .from('employees')
                .insert({
                    user_id: authData.user.id,
                    business_id: businessId,
                    name,
                    commission_rate: parseFloat(commissionRate)
                });

            if (empError) throw empError;

            alert('Employee created successfully! They can now login with their email and password.');
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-bold">Add New Employee</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="Enter employee name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pl-10"
                                placeholder="employee@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Business</label>
                        <select
                            value={businessId}
                            onChange={(e) => setBusinessId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select a business</option>
                            {businesses.map((biz: any) => (
                                <option key={biz.id} value={biz.id}>{biz.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Commission Rate (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-start space-x-2">
                        <div className="mt-0.5"><Mail className="w-4 h-4" /></div>
                        <p>The employee will receive a confirmation email. They must click the link in that email before they can log in.</p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-outline">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-orange">
                            {loading ? 'Creating...' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}

function BusinessDetailsModal({ business, onClose }: any) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ employees: 0, revenue: 0, expenses: 0, profit: 0, salesCount: 0 });
    const [employees, setEmployees] = useState<any[]>([]);

    const fetchDetails = async () => {
        // Fetch employees
        const { data: empData, count: empCount } = await supabase
            .from('employees')
            .select('*, users(email)', { count: 'exact' })
            .eq('business_id', business.id);

        // Fetch sales
        const { data: salesData, count: salesCount } = await supabase
            .from('daily_sales')
            .select('total_sales', { count: 'exact' })
            .eq('business_id', business.id);

        // Fetch expenses
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount')
            .eq('business_id', business.id);

        const totalRevenue = salesData?.reduce((sum, sale) => sum + (parseFloat(sale.total_sales) || 0), 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0;

        setStats({
            employees: empCount || 0,
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: totalRevenue - totalExpenses,
            salesCount: salesCount || 0
        });
        setEmployees(empData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchDetails();
    }, [business]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="text-xl font-bold">{business.name}</h2>
                        <span className="text-sm text-slate-500">{business.business_type} • {business.location}</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-blue-600 text-sm font-medium">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats.revenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <p className="text-purple-600 text-sm font-medium">Employees</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.employees}</h3>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                            <p className="text-emerald-600 text-sm font-medium">Net Profit</p>
                            <h3 className="text-2xl font-bold text-slate-800">${(stats.revenue - stats.expenses).toLocaleString()}</h3>
                            <p className="text-xs text-emerald-600/80 mt-1">Expenses: ${stats.expenses.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {business.description && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">About</h4>
                            <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">{business.description}</p>
                        </div>
                    )}

                    {/* Employees Table */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Staff Members</h4>
                        {loading ? (
                            <div className="text-center py-4 text-slate-500">Loading details...</div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-lg text-slate-500 text-sm">
                                No employees added yet.
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-700 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Position</th>
                                            <th className="px-4 py-2">Commission</th>
                                            <th className="px-4 py-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employees.map((emp: any) => (
                                            <tr key={emp.id}>
                                                <td className="px-4 py-2 font-medium">{emp.name}</td>
                                                <td className="px-4 py-2 text-slate-600">{emp.position || 'Staff'}</td>
                                                <td className="px-4 py-2 text-slate-600">{emp.commission_rate}%</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Are you sure you want to remove this employee?')) {
                                                                await supabase.from('employees').delete().eq('id', emp.id);
                                                                fetchDetails(); // Refresh list
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                        title="Remove Employee"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportsContent({ businesses }: any) {
    const [reportType, setReportType] = useState('daily');
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        generateReport();
    }, [reportType, businesses]);

    const generateReport = async () => {
        if (!businesses.length) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const businessIds = businesses.map((b: any) => b.id);

        // Fetch sales data
        const { data: salesData } = await supabase
            .from('daily_sales')
            .select('*, employees(name), businesses(name)')
            .in('business_id', businessIds)
            .order('sale_date', { ascending: false });

        // Fetch expenses
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount')
            .in('business_id', businessIds);

        if (salesData) {
            // Process data based on report type
            // For simplicity, we'll just show aggregate data for now
            const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + (parseFloat(sale.total_sales) || 0), 0);
            const totalExpenses = expensesData?.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0) || 0;
            const totalServices = salesData.reduce((sum: number, sale: any) => sum + (sale.service_count || 0), 0);

            // Top employees
            const employeeStats: Record<string, number> = {};
            salesData.forEach((sale: any) => {
                const name = sale.employees?.name || 'Unknown';
                employeeStats[name] = (employeeStats[name] || 0) + (parseFloat(sale.total_sales) || 0);
            });

            const topEmployees = Object.entries(employeeStats)
                .map(([name, total]) => ({ name, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            setReportData({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                totalServices,
                topEmployees,
                recentSales: salesData.slice(0, 10)
            });
        }
        setLoading(false);
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Generating report...</div>;

    if (!reportData) return <div className="p-8 text-center text-slate-500">No data available for reports.</div>;

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-slate-800">Business Reports</h2>
                <div className="flex space-x-3">
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="input-field w-auto"
                    >
                        <option value="daily">Daily Summary</option>
                        <option value="weekly">Weekly Summary</option>
                        <option value="monthly">Monthly Summary</option>
                    </select>
                    <button onClick={handleDownloadPDF} className="btn-outline flex items-center space-x-2">
                        <span className="text-sm">Download PDF</span>
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">BizManager Report</h1>
                <p className="text-slate-600">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-slate-800">${reportData.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                    <h3 className="text-2xl font-bold text-red-600">${reportData.totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Net Profit</p>
                    <h3 className="text-2xl font-bold text-emerald-600">${reportData.netProfit.toLocaleString()}</h3>
                </div>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Services</p>
                    <h3 className="text-2xl font-bold text-slate-800">{reportData.totalServices}</h3>
                </div>
            </div>

            {/* Top Employees */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pag-break-inside-avoid">
                <div className="p-4 border-b border-slate-200 font-semibold text-slate-700">Top Performing Staff</div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3 text-right">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.topEmployees.map((emp: any, i: number) => (
                            <tr key={i}>
                                <td className="px-4 py-3 font-medium">{emp.name}</td>
                                <td className="px-4 py-3 text-right font-bold">${emp.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Sales Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pag-break-inside-avoid">
                <div className="p-4 border-b border-slate-200 font-semibold text-slate-700">Recent Transactions</div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Business</th>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.recentSales.map((sale: any) => (
                            <tr key={sale.id}>
                                <td className="px-4 py-3">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{sale.businesses?.name}</td>
                                <td className="px-4 py-3">{sale.employees?.name}</td>
                                <td className="px-4 py-3 text-right font-medium">${parseFloat(sale.total_sales).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
