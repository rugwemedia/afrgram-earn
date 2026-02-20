import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare, ChevronRight, Clock, CheckCircle2,
    XCircle, Search, Filter, Zap
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

type FilterType = 'all' | 'available' | 'pending' | 'completed';

export function TasksPage() {
    const { tasks, submissions } = useTasks();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    // Get user's submission status for each task
    const getTaskStatus = (taskId: string) => {
        const sub = submissions.find(s => s.taskId === taskId && s.userId === user?.id);
        if (!sub) return 'available';
        return sub.status === 'approved' ? 'completed'
            : sub.status === 'rejected' ? 'rejected'
                : 'pending';
    };

    const filteredTasks = tasks.filter(task => {
        const status = getTaskStatus(task.id);
        const matchesSearch =
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filter === 'all' ? true
                : filter === 'available' ? (status === 'available' || status === 'rejected')
                    : filter === 'pending' ? status === 'pending'
                        : filter === 'completed' ? status === 'completed'
                            : true;
        return matchesSearch && matchesFilter;
    });

    const counts = {
        all: tasks.length,
        available: tasks.filter(t => {
            const s = getTaskStatus(t.id);
            return s === 'available' || s === 'rejected';
        }).length,
        pending: tasks.filter(t => getTaskStatus(t.id) === 'pending').length,
        completed: tasks.filter(t => getTaskStatus(t.id) === 'completed').length,
    };

    const statusConfig = {
        available: { label: 'Available', color: 'text-primary', bg: 'bg-primary/10', icon: Zap },
        pending: { label: 'Under Review', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
        completed: { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
        rejected: { label: 'Rejected – Retry', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-10"
        >
            <header>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <CheckSquare className="text-primary" /> Tasks
                </h2>
                <p className="text-muted-foreground mt-1">
                    Complete tasks to earn RWF rewards. {counts.available} task{counts.available !== 1 ? 's' : ''} available.
                </p>
            </header>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'available', 'pending', 'completed'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize flex items-center gap-2',
                            filter === f
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/5 text-muted-foreground hover:text-white border border-white/10'
                        )}
                    >
                        {f}
                        <span className={cn(
                            'text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1',
                            filter === f ? 'bg-white/20 text-white' : 'bg-white/10'
                        )}>
                            {counts[f]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <div className="glass-card p-16 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Filter size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-white text-lg">No tasks found</h3>
                    <p className="text-muted-foreground text-sm">Try changing your filter or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredTasks.map((task, i) => {
                        const status = getTaskStatus(task.id);
                        const cfg = statusConfig[status as keyof typeof statusConfig];
                        const StatusIcon = cfg.icon;
                        const isClickable = status === 'available' || status === 'rejected';

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => isClickable && navigate(`/task/${task.id}`)}
                                className={cn(
                                    'glass-card p-6 rounded-[1.5rem] flex items-start justify-between gap-4 group transition-all',
                                    isClickable
                                        ? 'cursor-pointer hover:bg-white/5 hover:border-primary/30 active:scale-[0.98]'
                                        : 'opacity-90'
                                )}
                            >
                                {/* Left: Icon + info */}
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className={cn(
                                        'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg',
                                        task.type === 'gmail'
                                            ? 'bg-red-500/10 text-red-400'
                                            : task.type === 'social'
                                                ? 'bg-indigo-500/10 text-indigo-400'
                                                : 'bg-primary/10 text-primary'
                                    )}>
                                        {task.type === 'gmail' ? 'G' : task.type === 'social' ? 'S' : 'T'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white leading-snug truncate">{task.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>

                                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                                            <span className="text-emerald-500 font-black text-sm">+{task.reward} RWF</span>
                                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                                            <span className={cn(
                                                'text-[10px] uppercase tracking-widest font-black flex items-center gap-1',
                                                cfg.color
                                            )}>
                                                <StatusIcon size={11} />
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right arrow for clickable */}
                                {isClickable && (
                                    <ChevronRight
                                        size={22}
                                        className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1"
                                    />
                                )}

                                {/* Status badge for non-clickable */}
                                {!isClickable && (
                                    <span className={cn(
                                        'text-[10px] font-black px-2 py-1 rounded-lg uppercase shrink-0',
                                        cfg.bg, cfg.color
                                    )}>
                                        {cfg.label}
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
