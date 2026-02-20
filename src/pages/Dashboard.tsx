import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowUpRight, Plus, CheckSquare,
    TrendingUp, Clock, ShieldCheck, Wallet,
    ChevronRight, Play, Users, MessageSquare
} from 'lucide-react';
import { WithdrawModal } from '../components/WithdrawModal';
import { PostCard } from '../components/PostCard';
import { cn } from '../utils/cn';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const MOCK_REELS = [
    {
        id: '1',
        user: { name: 'AfriGlobal Dev', avatar: 'https://images.unsplash.com/photo-1614850523296-d8c1af03d400?q=80&w=2070&auto=format&fit=crop' },
        videoThumb: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop'
    },
    {
        id: '2',
        user: { name: 'Digital Nomad', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop' },
        videoThumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop'
    },
    {
        id: '3',
        user: { name: 'Tech Guru', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop' },
        videoThumb: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2052&auto=format&fit=crop'
    }
];

export function Dashboard() {
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const { tasks, submissions } = useTasks();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [balance, setBalance] = useState(0);
    const [totalEarned, setTotalEarned] = useState(0);
    const [withdrawn, setWithdrawn] = useState(0);

    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    useEffect(() => {
        fetchRecentPosts();
        if (user) fetchBalance();
    }, [user]);

    const fetchBalance = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', user!.id)
                .single();
            if (data) setBalance(Number(data.balance) || 0);

            // Aggregate earnings from transactions
            const { data: txns } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user!.id);

            const earned = (txns || []).filter(t => t.type === 'earned').reduce((s, t) => s + Number(t.amount), 0);
            const wd = (txns || []).filter(t => t.type === 'withdrawn').reduce((s, t) => s + Number(t.amount), 0);
            setTotalEarned(earned);
            setWithdrawn(wd);
        } catch (err) {
            console.error('Error fetching balance:', err);
        }
    };

    const fetchRecentPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (full_name, avatar_url, role, last_seen_at, is_verified)
                `)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching dashboard posts:', err);
        } finally {
            setLoadingPosts(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 100 }
        }
    };

    const getTaskStatus = (taskId: string) => {
        const sub = submissions.find(s => s.taskId === taskId);
        if (!sub) return 'Available';
        if (sub.status === 'approved') return 'Completed';
        if (sub.status === 'rejected') return 'Rejected';
        return 'Pending';
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                balance={balance}
            />

            <header>
                <h2 className="text-3xl font-black text-white tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground font-medium mt-1">Efficiently manage your digital earnings.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Earned', value: totalEarned.toLocaleString(), currency: 'RWF', color: 'wallet-balance', icon: TrendingUp },
                    { label: 'Withdrawn', value: withdrawn.toLocaleString(), currency: 'RWF', color: 'wallet-withdrawn', icon: Clock },
                    { label: 'Available', value: balance.toLocaleString(), currency: 'RWF', color: 'wallet-available', icon: Wallet }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={cardVariants}
                        className="glass-card p-6 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group"
                    >
                        <div className="p-3 rounded-xl bg-white/5 w-fit">
                            <stat.icon size={24} className={cn(
                                stat.color === 'wallet-balance' && "text-emerald-500",
                                stat.color === 'wallet-withdrawn' && "text-indigo-500",
                                stat.color === 'wallet-available' && "text-amber-500"
                            )} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white mt-1">
                                {stat.value} <span className="text-sm font-bold text-muted-foreground">{stat.currency}</span>
                            </h3>
                        </div>
                        {stat.label === 'Available' && (
                            <button
                                onClick={() => setIsWithdrawModalOpen(true)}
                                className="btn-premium w-full mt-2 flex items-center justify-center gap-2 text-sm"
                            >
                                Cash Out Now <ArrowUpRight size={16} />
                            </button>
                        )}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all duration-500" />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Task Section */}
                <motion.section variants={cardVariants} className="space-y-5">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <CheckSquare className="text-primary" /> Active Tasks
                        </h3>
                        <button onClick={() => navigate('/tasks')} className="text-sm font-bold text-primary hover:underline">View All</button>
                    </div>

                    <div className="space-y-4">
                        {tasks.length === 0 ? (
                            <div className="glass-card p-6 rounded-[1.5rem] flex items-center justify-center text-muted-foreground">
                                No tasks available right now.
                            </div>
                        ) : (
                            tasks.slice(0, 2).map(task => {
                                const status = getTaskStatus(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/task/${task.id}`)}
                                        className="glass-card p-6 rounded-[1.5rem] flex items-center justify-between group cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-black">
                                                    {task.type === 'gmail' ? 'G' : 'T'}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg leading-snug">{task.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-emerald-500 text-sm font-bold">+{task.reward} RWF</span>
                                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                    <span className={cn(
                                                        "text-xs uppercase tracking-widest font-black",
                                                        status === 'Completed' ? "text-emerald-500" :
                                                            status === 'Rejected' ? "text-red-500" :
                                                                status === 'Pending' ? "text-amber-500" :
                                                                    "text-muted-foreground"
                                                    )}>{status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                );
                            })
                        )}

                        <div
                            onClick={() => navigate('/tasks')}
                            className="glass-card p-6 rounded-[1.5rem] border-dashed border-2 flex flex-col items-center justify-center gap-4 py-8 group cursor-pointer hover:border-primary/50 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors font-black">
                                <Plus size={24} />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-white">Browse New Market</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">Start earning more commissions today</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Verification Status */}
                <motion.section variants={cardVariants} className="space-y-5">
                    <h3 className="text-xl font-bold flex items-center gap-2 px-1">
                        <ShieldCheck className="text-emerald-500" /> Security Status
                    </h3>
                    <div className="glass-card p-8 rounded-[2rem] border-l-4 border-emerald-500 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Verified Earner</p>
                            <div className="flex items-baseline gap-3 mt-1">
                                <span className="text-4xl font-black text-white italic tracking-tighter">Tier 1</span>
                            </div>
                            <div className="mt-8 flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase block">Monthly Limit</span>
                                    <span className="text-sm font-bold text-white">50,000 RWF</span>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase block">Task Multiplier</span>
                                    <span className="text-sm font-bold text-primary">1.0x</span>
                                </div>
                            </div>
                            <div className="mt-6 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[15%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>

                        {/* Background Texture */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <ShieldCheck size={180} />
                        </div>
                    </div>
                </motion.section>
            </div>

            {/* Trending Reels */}
            <motion.section variants={cardVariants} className="space-y-5">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Play className="text-primary fill-primary/20" /> Trending Reels
                    </h3>
                    <button onClick={() => navigate('/reels')} className="text-sm font-bold text-primary hover:underline">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                    {MOCK_REELS.map((reel) => (
                        <div
                            key={reel.id}
                            onClick={() => navigate('/reels')}
                            className="relative min-w-[160px] h-[240px] rounded-3xl overflow-hidden glass-card group cursor-pointer active:scale-95 transition-all"
                        >
                            <img
                                src={reel.videoThumb}
                                alt="Reel thumb"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                <img src={reel.user.avatar} className="w-6 h-6 rounded-full border border-white/20" />
                                <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{reel.user.name}</span>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={20} className="text-white fill-white ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Community Feed */}
            <motion.section variants={cardVariants} className="space-y-5">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="text-indigo-500" /> Community Feed
                    </h3>
                    <button onClick={() => navigate('/feed')} className="text-sm font-bold text-primary hover:underline">Open Feed</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingPosts ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="glass-card h-64 rounded-[2rem] animate-pulse bg-white/5" />
                        ))
                    ) : posts.length === 0 ? (
                        <div className="col-span-full glass-card p-10 rounded-[2rem] flex flex-col items-center justify-center text-center">
                            <MessageSquare size={48} className="text-muted-foreground/30 mb-4" />
                            <h4 className="font-bold text-white">No stories yet</h4>
                            <p className="text-sm text-muted-foreground mt-1">Be the first to share something with the community!</p>
                            <button onClick={() => navigate('/feed')} className="mt-6 btn-premium px-6 py-2 text-sm">Join the Conversation</button>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                id={post.id}
                                user={{
                                    name: post.profiles?.full_name || 'Anonymous User',
                                    username: '@' + (post.profiles?.full_name?.toLowerCase().replace(/\s/g, '') || 'user'),
                                    avatar: post.profiles?.avatar_url || 'https://via.placeholder.com/150',
                                    verified: post.profiles?.is_verified,
                                    id: post.user_id,
                                    lastSeen: post.profiles?.last_seen_at
                                }}
                                content={post.content}
                                image={post.image_url} // Corrected: the DB field is image_url in SocialFeed it seems
                                likes={Number(post.likes_count) || 0}
                                comments={Number(post.comments_count) || 0}
                                timestamp={new Date(post.created_at).toLocaleDateString()}
                            />
                        ))
                    )}
                </div>
            </motion.section>
        </motion.div>
    );
}
