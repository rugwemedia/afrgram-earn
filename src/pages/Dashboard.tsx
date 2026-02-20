import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight, Plus, CheckSquare,
    TrendingUp, Clock, ShieldCheck, Wallet,
    ChevronRight, Play, Users, MessageSquare,
    Send, X, Loader2
} from 'lucide-react';
import { WithdrawModal } from '../components/WithdrawModal';
import { PostCard } from '../components/PostCard';
import { cn } from '../utils/cn';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const { tasks, submissions } = useTasks();
    const { user, balance } = useAuth();
    const navigate = useNavigate();

    const [totalEarned, setTotalEarned] = useState(0);
    const [withdrawn, setWithdrawn] = useState(0);

    const [posts, setPosts] = useState<any[]>([]);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [loadingPosts, setLoadingPosts] = useState(true);

    // Comment drawer state
    const [activePostForComments, setActivePostForComments] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [newComment, setNewComment] = useState('');

    // Reels state
    const [reels, setReels] = useState<any[]>([]);
    const [loadingReels, setLoadingReels] = useState(true);

    // Share-to-story state
    const [sharingReelId, setSharingReelId] = useState<string | null>(null);
    const [shareSuccess, setShareSuccess] = useState(false);

    useEffect(() => {
        fetchRecentPosts();
        fetchRecentReels();
        if (user) {
            fetchStats();
            fetchUserLikes();
        }
    }, [user]);

    useEffect(() => {
        if (activePostForComments) fetchComments(activePostForComments);
    }, [activePostForComments]);

    const fetchStats = async () => {
        try {
            const { data: txns } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user!.id);
            const earned = (txns || []).filter(t => t.type === 'earned').reduce((s, t) => s + Number(t.amount), 0);
            const wd = (txns || []).filter(t => t.type === 'withdrawn').reduce((s, t) => s + Number(t.amount), 0);
            setTotalEarned(earned);
            setWithdrawn(wd);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchUserLikes = async () => {
        if (!user) return;
        const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
        setUserLikes(new Set((data || []).map(l => l.post_id)));
    };

    const fetchRecentPosts = async () => {
        setLoadingPosts(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles (full_name, avatar_url, role, last_seen_at, is_verified)')
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

    const fetchRecentReels = async () => {
        setLoadingReels(true);
        try {
            const { data, error } = await supabase
                .from('reels')
                .select('*, profiles (full_name, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(6);
            if (error) throw error;
            setReels(data || []);
        } catch (err) {
            console.error('Error fetching reels:', err);
        } finally {
            setLoadingReels(false);
        }
    };

    const fetchComments = async (postId: string) => {
        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select('id, content, created_at, profiles (full_name, avatar_url)')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setComments((data as any[] || []).map(c => ({
                ...c,
                profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
            })));
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!user) return;
        const isLiked = userLikes.has(postId);
        setUserLikes(prev => { const s = new Set(prev); isLiked ? s.delete(postId) : s.add(postId); return s; });
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, likes_count: (Number(p.likes_count) || 0) + (isLiked ? -1 : 1) } : p
        ));
        try {
            const { error } = isLiked
                ? await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id })
                : await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
            if (error) throw error;
        } catch (err: any) {
            // Revert
            setUserLikes(prev => { const s = new Set(prev); isLiked ? s.add(postId) : s.delete(postId); return s; });
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, likes_count: (Number(p.likes_count) || 0) + (isLiked ? 1 : -1) } : p
            ));
        }
    };

    const handleAddComment = async () => {
        if (!user || !newComment.trim() || !activePostForComments) return;
        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({ post_id: activePostForComments, user_id: user.id, content: newComment.trim() })
                .select('id, content, created_at, profiles (full_name, avatar_url)')
                .single();
            if (error) throw error;
            const c = { ...data, profiles: Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles };
            setComments(prev => [...prev, c]);
            setNewComment('');
            setPosts(prev => prev.map(p =>
                p.id === activePostForComments ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p
            ));
        } catch (err: any) {
            alert('Commenting failed: ' + (err.message || 'Unknown error'));
        } finally {
            setCommentLoading(false);
        }
    };

    // Share reel to story
    const handleShareReelToStory = async (reel: any) => {
        if (!user) return;
        setSharingReelId(reel.id);
        try {
            const { error } = await supabase.from('stories').insert({
                user_id: user.id,
                media_url: reel.video_url,
                media_type: 'video',
                caption: reel.caption ? `🎬 ${reel.caption}` : '🎬 Shared from Reels',
            });
            if (error) throw error;
            setShareSuccess(true);
            setTimeout(() => { setSharingReelId(null); setShareSuccess(false); }, 2000);
        } catch (err: any) {
            setSharingReelId(null);
            alert('Share failed: ' + (err.message || 'Check your stories table setup'));
        }
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } } };

    const getTaskStatus = (taskId: string) => {
        const sub = submissions.find(s => s.taskId === taskId);
        if (!sub) return 'Available';
        if (sub.status === 'approved') return 'Completed';
        if (sub.status === 'rejected') return 'Rejected';
        return 'Pending';
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-10">
            <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} balance={balance} />

            {/* Comment Drawer */}
            <AnimatePresence>
                {activePostForComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setActivePostForComments(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] z-[101] min-h-[55vh] max-h-[82vh] flex flex-col"
                        >
                            <div className="p-4 flex flex-col items-center">
                                <div className="w-12 h-1 bg-white/10 rounded-full mb-6" />
                                <div className="w-full flex justify-between items-center px-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Comments</h3>
                                    <button onClick={() => setActivePostForComments(null)} className="p-2 bg-white/5 rounded-full text-muted-foreground hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar space-y-5">
                                {commentLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm">No comments yet. Be the first!</div>
                                ) : comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5 shrink-0">
                                            <img src={comment.profiles?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-white">{comment.profiles?.full_name}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-white/80 leading-relaxed">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 pb-10 bg-[#0a0a0a] border-t border-white/5">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black shrink-0">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                            placeholder="Write a comment…"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-muted-foreground/50 pr-12"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <header>
                <h2 className="text-3xl font-black text-white tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground font-medium mt-1">Efficiently manage your digital earnings.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Earned', value: totalEarned.toLocaleString(), currency: 'RWF', icon: TrendingUp, color: 'emerald' },
                    { label: 'Withdrawn', value: withdrawn.toLocaleString(), currency: 'RWF', icon: Clock, color: 'indigo' },
                    { label: 'Available', value: balance.toLocaleString(), currency: 'RWF', icon: Wallet, color: 'amber' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={cardVariants}
                        className="glass-card p-6 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group"
                    >
                        <div className="p-3 rounded-xl bg-white/5 w-fit">
                            <stat.icon size={24} className={cn(
                                stat.color === 'emerald' && 'text-emerald-500',
                                stat.color === 'indigo' && 'text-indigo-500',
                                stat.color === 'amber' && 'text-amber-500',
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
                {/* Active Tasks */}
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
                                                        'text-xs uppercase tracking-widest font-black',
                                                        status === 'Completed' ? 'text-emerald-500' :
                                                            status === 'Rejected' ? 'text-red-500' :
                                                                status === 'Pending' ? 'text-amber-500' : 'text-muted-foreground'
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

                {/* Security */}
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
                    {loadingReels ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="min-w-[160px] h-[240px] rounded-3xl bg-white/5 animate-pulse shrink-0" />
                        ))
                    ) : reels.length === 0 ? (
                        <div className="w-full text-center py-10 text-muted-foreground text-sm">
                            No reels yet. <button onClick={() => navigate('/reels')} className="text-primary font-bold">Be the first!</button>
                        </div>
                    ) : (
                        reels.map((reel) => (
                            <div key={reel.id} className="relative min-w-[160px] h-[240px] rounded-3xl overflow-hidden glass-card group shrink-0">
                                <video
                                    src={reel.video_url}
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
                                    muted
                                    loop
                                    playsInline
                                    onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                                    onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {/* User info */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                    <img src={reel.profiles?.avatar_url || 'https://via.placeholder.com/100'} className="w-6 h-6 rounded-full border border-white/20" />
                                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{reel.profiles?.full_name || 'User'}</span>
                                </div>

                                {/* Action buttons on hover */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => navigate('/reels')}
                                        className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-primary/80 transition-all active:scale-90"
                                    >
                                        <Play size={20} className="fill-white ml-0.5" />
                                    </button>
                                    <button
                                        onClick={() => handleShareReelToStory(reel)}
                                        disabled={sharingReelId === reel.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/80 transition-all disabled:opacity-60"
                                    >
                                        {sharingReelId === reel.id && shareSuccess ? (
                                            '✓ Shared!'
                                        ) : sharingReelId === reel.id ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <>+ Add to Story</>
                                        )}
                                    </button>
                                </div>

                                {/* Play icon center when not hovering */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:opacity-0 transition-opacity">
                                    <Play size={18} className="text-white fill-white ml-1" />
                                </div>
                            </div>
                        ))
                    )}
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
                            <h4 className="font-bold text-white">No posts yet</h4>
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
                                    avatar: post.profiles?.avatar_url || 'https://via.placeholder.com/100',
                                    verified: post.profiles?.is_verified,
                                    id: post.user_id,
                                    lastSeen: post.profiles?.last_seen_at,
                                }}
                                content={post.content}
                                image={post.image_url}
                                likes={Number(post.likes_count || 0)}
                                isLiked={userLikes.has(post.id)}
                                comments={Number(post.comments_count || 0)}
                                timestamp={new Date(post.created_at).toLocaleDateString()}
                                onLike={() => handleLikePost(post.id)}
                                onComment={() => setActivePostForComments(post.id)}
                            />
                        ))
                    )}
                </div>
            </motion.section>
        </motion.div>
    );
}
