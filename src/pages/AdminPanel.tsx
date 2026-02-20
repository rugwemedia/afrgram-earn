import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Eye, MousePointer2, Smartphone,
    MapPin, Plus, Edit2, Trash2,
    Search, ShieldAlert, CheckCircle2, XCircle, Image, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { Navigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'sharibaru0@gmail.com';

export function AdminPanel() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'analytics' | 'content' | 'tasks' | 'withdrawals' | 'verification' | 'config'>('analytics');

    if (user?.email !== ADMIN_EMAIL) {
        return <Navigate to="/" />;
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-primary" /> Admin Control
                    </h2>
                    <p className="text-muted-foreground">Secure management for AFGgram Articles & Users.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit overflow-x-auto">
                    {(['analytics', 'content', 'tasks', 'withdrawals', 'verification', 'config'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap",
                                activeTab === tab ? "bg-primary text-white shadow-lg" : "text-muted-foreground"
                            )}
                        >
                            {tab === 'config' ? 'Settings' : tab}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'content' && <ArticleManager />}
            {activeTab === 'tasks' && <TaskManager />}
            {activeTab === 'withdrawals' && <WithdrawalsManager />}
            {activeTab === 'verification' && <VerificationManager />}
            {activeTab === 'config' && <ConfigManager />}
        </div>
    );
}

function AnalyticsView() {
    const [stats, setStats] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrafficData();
    }, []);

    const fetchTrafficData = async () => {
        try {
            // 1. Fetch total visits
            const { count: totalVisits } = await supabase
                .from('traffic_stats')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch unique visitors
            const { data: allStats } = await supabase.from('traffic_stats').select('user_id');
            const uniqueCount = new Set(allStats?.map(s => s.user_id).filter(Boolean)).size;

            // 3. Fetch device stats
            const { data: deviceData } = await supabase.from('traffic_stats').select('device_type');
            const deviceCounts = (deviceData || []).reduce((acc: any, curr: any) => {
                const type = curr.device_type || 'Other';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            setStats([
                { label: 'Total Visits', value: totalVisits?.toLocaleString() || '0', change: 'Real-time', icon: Eye },
                { label: 'Unique Users', value: uniqueCount.toLocaleString() || '0', change: 'Live', icon: Users },
                { label: 'Active Sessions', value: (totalVisits || 0) > 0 ? 'Active' : 'Idle', change: '+100%', icon: MousePointer2 },
            ]);

            const total = deviceData?.length || 1;
            setDevices([
                { type: 'Mobile', value: Math.round(((deviceCounts['Mobile'] || 0) / total) * 100), color: 'bg-primary' },
                { type: 'Desktop', value: Math.round(((deviceCounts['Desktop'] || 0) / total) * 100), color: 'bg-indigo-500' },
                { type: 'Tablet', value: Math.round(((deviceCounts['Tablet'] || 0) / total) * 100), color: 'bg-emerald-500' },
            ]);

        } catch (err) {
            console.error('Error fetching traffic:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-muted-foreground">Syncing Real-time Traffic...</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl group cursor-default">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 uppercase tracking-widest">
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase">{stat.label}</p>
                        <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Smartphone size={20} className="text-primary" /> Device Distribution
                    </h3>
                    <div className="space-y-4">
                        {devices.map((device) => (
                            <div key={device.type} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-white">{device.type}</span>
                                    <span className="text-muted-foreground">{device.value}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${device.value}%` }}
                                        className={cn("h-full rounded-full", device.color)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <MapPin size={20} className="text-primary" /> Global Origins
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <span className="font-bold text-white italic">Localized Tracking Active</span>
                            <span className="text-primary font-black uppercase text-[10px] tracking-widest">Monitoring</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Currently tracking visit data from all regions. Country-specific labels will populate as high-volume data points are established.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArticleManager() {
    return (
        <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                </div>
                <button className="btn-premium px-8 flex items-center gap-2">
                    <Plus size={20} /> Create Article
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Article Title</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Stats</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {[
                            { title: 'How to Earn 500 RWF Daily', views: '1.2K', status: 'Published' },
                            { title: 'MTN Withdrawal Guide', views: '840', status: 'Draft' },
                        ].map((article, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{article.title}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                    <Eye size={12} className="inline mr-1" /> {article.views}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "text-xs font-black px-2 py-1 rounded-lg",
                                        article.status === 'Published' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                    )}>
                                        {article.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button className="p-2 rounded-lg bg-white/5 text-primary hover:bg-primary/20"><Edit2 size={16} /></button>
                                        <button className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-400/20"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function WithdrawalsManager() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    profiles (full_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWithdrawals(data || []);
        } catch (err) {
            console.error('Error fetching withdrawals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchWithdrawals();
        } catch (err) {
            console.error('Error updating withdrawal:', err);
            alert('Failed to update withdrawal.');
        }
    };

    if (loading) return <div className="p-20 text-center text-muted-foreground">Syncing Withdrawals...</div>;

    return (
        <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">User</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Method</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Phone</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Amount</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {withdrawals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No withdrawal requests found.</td>
                            </tr>
                        ) : (
                            withdrawals.map((w, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={w.profiles?.avatar_url || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full" />
                                            <div className="font-bold text-white font-sm">{w.profiles?.full_name || 'User'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "text-[10px] font-black px-2 py-1 rounded bg-white/5 text-white uppercase tracking-widest",
                                            w.method === 'MTN' ? "border-l-2 border-yellow-400" : "border-l-2 border-red-500"
                                        )}>
                                            {w.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{w.phone}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-bold">{Number(w.amount).toLocaleString()} RWF</div>
                                        <div className="text-[10px] text-muted-foreground">Incl. {Number(w.fee).toLocaleString()} Fee</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "text-xs font-black px-2 py-1 rounded-lg uppercase",
                                            w.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                                                w.status === 'rejected' ? "bg-red-500/10 text-red-500" :
                                                    "bg-amber-500/10 text-amber-500"
                                        )}>
                                            {w.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {w.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(w.id, 'approved')}
                                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(w.id, 'rejected')}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-400/20"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TaskManager() {
    const { tasks, submissions, addTask, deleteTask, approveSubmission, rejectSubmission, deleteSubmission } = useTasks();
    const [subTab, setSubTab] = useState<'manage' | 'submissions'>('manage');
    const [newTask, setNewTask] = useState<{
        title: string;
        description: string;
        reward: number;
        instruction: string;
        type: 'other' | 'gmail' | 'social';
        requiredEmailFormat: string;
        requiredPassword: string;
        recoveryEmail: string;
    }>({
        title: '',
        description: '',
        reward: 100,
        instruction: '',
        type: 'other',
        requiredEmailFormat: '',
        requiredPassword: '',
        recoveryEmail: ''
    });

    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState(false);

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.description) return;
        setCreating(true);
        setCreateError(null);
        setCreateSuccess(false);
        try {
            await addTask(newTask);
            setNewTask({
                title: '',
                description: '',
                reward: 100,
                instruction: '',
                type: 'other',
                requiredEmailFormat: '',
                requiredPassword: '',
                recoveryEmail: ''
            });
            setCreateSuccess(true);
            setTimeout(() => setCreateSuccess(false), 3000);
        } catch (err: any) {
            const msg = err?.message || err?.error_description || JSON.stringify(err);
            setCreateError(msg);
            console.error('Task publish error:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <button
                    onClick={() => setSubTab('manage')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                        subTab === 'manage' ? "bg-white/10 border-primary text-white" : "border-transparent text-muted-foreground hover:bg-white/5"
                    )}
                >
                    Manage Tasks
                </button>
                <button
                    onClick={() => setSubTab('submissions')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                        subTab === 'submissions' ? "bg-white/10 border-primary text-white" : "border-transparent text-muted-foreground hover:bg-white/5"
                    )}
                >
                    Review Submissions ({submissions.filter(s => s.status === 'pending').length})
                </button>
            </div>

            {subTab === 'manage' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Plus className="text-primary" /> Create New Task
                        </h3>
                        <div className="space-y-4">
                            <input
                                placeholder="Task Title"
                                value={newTask.title}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                            />
                            <textarea
                                placeholder="Short Description"
                                value={newTask.description}
                                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none h-20 resize-none"
                            />
                            <textarea
                                placeholder="Detailed Instructions"
                                value={newTask.instruction}
                                onChange={e => setNewTask({ ...newTask, instruction: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none h-32 resize-none"
                            />
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Reward (RWF)"
                                    value={newTask.reward}
                                    onChange={e => setNewTask({ ...newTask, reward: Number(e.target.value) })}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                />
                                <select
                                    value={newTask.type}
                                    onChange={e => setNewTask({ ...newTask, type: e.target.value as any })}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                >
                                    <option value="other">General Task</option>
                                    <option value="gmail">Gmail Task</option>
                                    <option value="social">Social Task</option>
                                </select>
                            </div>
                            {newTask.type === 'gmail' && (
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <input
                                        placeholder="Required Email Format"
                                        value={newTask.requiredEmailFormat}
                                        onChange={e => setNewTask({ ...newTask, requiredEmailFormat: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                    />
                                    <input
                                        placeholder="Required Password"
                                        value={newTask.requiredPassword}
                                        onChange={e => setNewTask({ ...newTask, requiredPassword: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                    />
                                    <input
                                        placeholder="Recovery Email"
                                        value={newTask.recoveryEmail}
                                        onChange={e => setNewTask({ ...newTask, recoveryEmail: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                            )}
                            {createError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                                    <XCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{createError}</span>
                                </div>
                            )}
                            {createSuccess && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    Task published successfully!
                                </div>
                            )}
                            <button
                                onClick={handleCreateTask}
                                disabled={creating}
                                className="btn-premium w-full flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 className="animate-spin" size={18} /> : <>Publish Task <Plus size={18} /></>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div key={task.id} className="glass-card p-6 rounded-2xl flex justify-between items-start group">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white">{task.title}</h4>
                                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-muted-foreground uppercase">{task.type}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                    <p className="text-emerald-500 font-bold mt-2 text-sm">+{task.reward} RWF</p>
                                </div>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'submissions' && (
                <div className="glass-card rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">User</th>
                                    <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Task</th>
                                    <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Proof</th>
                                    <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No submissions found.</td>
                                    </tr>
                                ) : (
                                    submissions.map((sub, i) => {
                                        const task = tasks.find(t => t.id === sub.taskId);
                                        return (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{sub.userName}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white">
                                                    {task?.title || 'Unknown Task'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a href={sub.proofImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-bold">
                                                        <Image size={16} /> View Proof
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "text-xs font-black px-2 py-1 rounded-lg uppercase",
                                                        sub.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                                                            sub.status === 'rejected' ? "bg-red-500/10 text-red-500" :
                                                                "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        {sub.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => approveSubmission(sub.id)}
                                                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => rejectSubmission(sub.id)}
                                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => deleteSubmission(sub.id)}
                                                            className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function VerificationManager() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('verification_requests')
                .select(`
                    *,
                    profiles (full_name, avatar_url, handle)
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setRequests(data || []);
        } catch (err: any) {
            console.error('Error fetching verification requests:', err);
            setError(err.message || 'Failed to fetch requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        if (newStatus === 'rejected' && !rejectionReason && !rejectingId) {
            setRejectingId(id);
            return;
        }

        try {
            const updates: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (newStatus === 'rejected') {
                updates.rejection_reason = rejectionReason || 'Requirements not met.';
                updates.rejected_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from('verification_requests')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            setRejectingId(null);
            setRejectionReason('');
            fetchRequests();
            alert(`Request ${newStatus}!`);
        } catch (err: any) {
            console.error('Error updating request:', err);
            alert('Failed to update verification request: ' + (err.message || 'Check SQL script.'));
        }
    };

    if (loading) return <div className="p-20 text-center text-muted-foreground">Syncing Verification Requests...</div>;

    if (error) return (
        <div className="p-10 text-center space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl max-w-lg mx-auto">
                <ShieldAlert className="mx-auto mb-4" size={32} />
                <h3 className="text-lg font-bold mb-2">Access Error</h3>
                <p className="text-sm opacity-80 mb-4">{error}</p>
                <div className="text-xs text-left bg-black/20 p-4 rounded-lg font-mono">
                    <p className="mb-2 uppercase font-bold text-[10px] opacity-50">Potential Fixes:</p>
                    <ul className="list-disc ml-4 space-y-1">
                        <li>Ensure you have run `verification_system.sql` in Supabase.</li>
                        <li>Ensure you have run `add_handle_to_profiles.sql`.</li>
                        <li>Ensure your account has the 'admin' role in the profiles table.</li>
                    </ul>
                </div>
            </div>
            <button onClick={fetchRequests} className="text-primary hover:underline text-sm font-bold">Try Refreshing</button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Verification Requests</h3>
                    <p className="text-sm text-muted-foreground">Manage blue tick applications from users.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Requested At</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No verification requests found.</td>
                                </tr>
                            ) : (
                                requests.map((r) => (
                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                                                    <img src={r.profiles?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{r.profiles?.full_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">@{r.profiles?.handle}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-1 rounded-lg uppercase",
                                                r.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                                                    r.status === 'rejected' ? "bg-red-500/10 text-red-500" :
                                                        "bg-amber-500/10 text-amber-500"
                                            )}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAction(r.id, 'approved')}
                                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(r.id, 'rejected')}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-400/20"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            {r.status === 'approved' && (
                                                <button
                                                    onClick={() => handleAction(r.id, 'rejected')}
                                                    className="text-[10px] font-bold text-red-500 hover:underline"
                                                >
                                                    Revoke Verification
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Dialog */}
            {rejectingId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-8 rounded-[2rem] max-w-md w-full"
                    >
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Reject Request</h3>
                        <p className="text-sm text-muted-foreground mb-6">Briefly explain why this user is being rejected. This will be shown to them.</p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., You need at least 100 followers to be verified."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white min-h-[120px] outline-none focus:ring-2 focus:ring-red-500/50 mb-6"
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                                className="flex-1 py-3 font-bold text-muted-foreground hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(rejectingId, 'rejected')}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function ConfigManager() {
    const [config, setConfig] = useState<any>({ min_followers: 100, monthly_fee: 500 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await supabase.from('verification_config').select('*').eq('id', 'global').single();
            if (data) setConfig(data);
        } catch (err) {
            console.error('Error fetching config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('verification_config')
                .upsert({ id: 'global', ...config, updated_at: new Date() });
            if (error) throw error;
            alert('Settings updated successfully!');
        } catch (err: any) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-20 text-center text-muted-foreground">Loading Security Parameters...</div>;

    return (
        <div className="max-w-2xl space-y-8">
            <div className="glass-card p-8 rounded-[2.5rem] border-l-4 border-primary">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Global Verification Rules</h3>
                <p className="text-sm text-muted-foreground mb-8">Set the requirements for the blue tick badge across AFGgram.</p>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-2">Minimum Followers</label>
                        <input
                            type="number"
                            value={config.min_followers}
                            onChange={(e) => setConfig({ ...config, min_followers: parseInt(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold text-lg"
                        />
                        <p className="text-[10px] text-muted-foreground mt-2">Recommended: 100+ for initial verification tier.</p>
                    </div>

                    <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-2">Monthly Fee (RWF)</label>
                        <input
                            type="number"
                            value={config.monthly_fee}
                            onChange={(e) => setConfig({ ...config, monthly_fee: parseInt(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold text-lg"
                        />
                        <p className="text-[10px] text-muted-foreground mt-2">This amount is automatically deducted from user's main balance.</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-premium w-full py-4 text-white font-black flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : 'Save Global Parameters'}
                    </button>
                </div>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <h4 className="text-sm font-bold text-white mb-2 italic">Developer Note:</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Changes take effect immediately for all new and pending verification requests. Existing verified users will remain verified unless manually revoked.
                </p>
            </div>
        </div>
    );
}
