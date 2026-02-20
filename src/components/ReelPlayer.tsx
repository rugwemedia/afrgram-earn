import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, BookmarkPlus, Music2, Volume2, VolumeX, Play, X, Send, Loader2, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ReelProps {
    reel: any;
    isActive: boolean;
}

export function ReelPlayer({ reel, isActive }: ReelProps) {
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(Number(reel.likes_count || 0));
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    // Comment drawer
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentsCount, setCommentsCount] = useState(Number(reel.comments_count || 0));

    // Share to story
    const [sharingToStory, setSharingToStory] = useState(false);
    const [sharedToStory, setSharedToStory] = useState(false);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay may be blocked by browser
                setIsPlaying(false);
            });
            setIsPlaying(true);
        } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    useEffect(() => {
        if (user) {
            checkIfLiked();
        }
    }, [user, reel.id]);

    const checkIfLiked = async () => {
        const { data } = await supabase
            .from('reel_likes')
            .select('id')
            .eq('reel_id', reel.id)
            .eq('user_id', user?.id)
            .single();
        setIsLiked(!!data);
    };

    const handleToggleLike = async () => {
        if (!user) return;

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => prev + (newIsLiked ? 1 : -1));

        if (newIsLiked) {
            await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: user.id });
        } else {
            await supabase.from('reel_likes').delete().match({ reel_id: reel.id, user_id: user.id });
        }
    };

    const handleDoubleTap = () => {
        if (!isLiked) handleToggleLike();
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    };

    const handleOpenComments = async () => {
        setShowComments(true);
        if (comments.length > 0) return;
        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from('reel_comments')
                .select('id, content, created_at, profiles (full_name, avatar_url)')
                .eq('reel_id', reel.id)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setComments((data as any[] || []).map(c => ({
                ...c,
                profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
            })));
        } catch (err) {
            console.error('Error fetching reel comments:', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!user || !newComment.trim()) return;
        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from('reel_comments')
                .insert({ reel_id: reel.id, user_id: user.id, content: newComment.trim() })
                .select('id, content, created_at, profiles (full_name, avatar_url)')
                .single();
            if (error) throw error;
            const c = { ...data, profiles: Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles };
            setComments(prev => [...prev, c]);
            setNewComment('');
            setCommentsCount(prev => prev + 1);
        } catch (err: any) {
            console.error('Reel comment error:', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleShareToStory = async () => {
        if (!user || sharingToStory || sharedToStory) return;
        setSharingToStory(true);
        try {
            const { error } = await supabase.from('stories').insert({
                user_id: user.id,
                media_url: reel.video_url,
                media_type: 'video',
                caption: reel.caption ? `🎬 ${reel.caption}` : '🎬 Shared from Reels',
            });
            if (error) throw error;
            setSharedToStory(true);
            setTimeout(() => setSharedToStory(false), 3000);
        } catch (err: any) {
            alert('Share failed: ' + (err.message || 'Check stories table setup'));
        } finally {
            setSharingToStory(false);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="h-full w-full snap-start relative flex flex-col justify-end overflow-hidden group">
            {/* Video Element */}
            <video
                ref={videoRef}
                src={reel.video_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
            />

            {/* Tap Overlays */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                    >
                        <div className="p-6 rounded-full bg-black/40 backdrop-blur-md">
                            <Play size={48} className="text-white fill-white" />
                        </div>
                    </motion.div>
                )}
                {showHeartAnimation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1.5, y: -20 }}
                        exit={{ opacity: 0, scale: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                    >
                        <Heart size={100} className="text-red-500 fill-red-500 shadow-2xl" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mute Toggle */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-6 right-6 p-3 rounded-full bg-black/20 backdrop-blur-md z-30"
            >
                {isMuted ? <VolumeX className="text-white" size={20} /> : <Volume2 className="text-white" size={20} />}
            </button>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />

            {/* Sidebar Actions */}
            <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-6">
                <SideAction
                    icon={Heart}
                    count={likesCount.toString()}
                    color={isLiked ? 'text-red-500 fill-red-500' : 'hover:text-red-500'}
                    onClick={handleToggleLike}
                />
                <SideAction
                    icon={MessageCircle}
                    count={commentsCount.toString()}
                    color="hover:text-primary"
                    onClick={handleOpenComments}
                />
                <SideAction
                    icon={sharedToStory ? CheckCheck : BookmarkPlus}
                    count={sharedToStory ? 'Added!' : sharingToStory ? '…' : 'Story'}
                    color={sharedToStory ? 'text-emerald-500' : 'hover:text-emerald-500'}
                    onClick={handleShareToStory}
                />
            </div>

            {/* Comment Drawer */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowComments(false)}
                            className="absolute inset-0 bg-black/40 z-40"
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] rounded-t-[2.5rem] z-50 max-h-[65vh] flex flex-col"
                        >
                            <div className="p-4 flex items-center justify-between px-6 pt-5">
                                <div className="w-10 h-1 bg-white/10 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
                                <h3 className="text-base font-black text-white uppercase tracking-widest">{commentsCount} Comments</h3>
                                <button onClick={() => setShowComments(false)} className="p-1.5 bg-white/5 rounded-full text-white/60 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 no-scrollbar">
                                {commentLoading && comments.length === 0 ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                                ) : comments.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">No comments yet. Start the conversation!</p>
                                ) : comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                                            <img src={c.profiles?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{c.profiles?.full_name}</p>
                                            <p className="text-sm text-white/80 mt-0.5 leading-snug">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 pb-8 border-t border-white/5">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                            placeholder="Add a comment…"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 pr-11"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30 transition-all"
                                        >
                                            <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Content Overlay */}
            <div className="relative z-10 p-6 space-y-4 pb-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={reel.profiles?.avatar_url || 'https://via.placeholder.com/150'}
                            className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                        />
                        {(new Date().getTime() - new Date(reel.profiles?.last_seen_at || 0).getTime() < 300000) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full z-10" />
                        )}
                    </div>
                    <span className="font-bold text-white text-lg">{reel.profiles?.full_name || 'User'}</span>
                    <button className="bg-primary hover:bg-primary/90 text-white text-xs font-black px-4 py-1.5 rounded-full ml-2">Follow</button>
                </div>

                <p className="text-white/90 text-sm leading-snug line-clamp-2 max-w-[80%]">{reel.caption}</p>

                <div className="flex items-center gap-2 text-white/60 text-xs py-2">
                    <Music2 size={14} className="animate-spin-slow" />
                    <span className="font-medium">{reel.music_name || 'Original Audio'}</span>
                </div>
            </div>
        </div>
    );
}

function SideAction({ icon: Icon, count, color, onClick }: { icon: any, count?: string, color?: string, onClick?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={onClick}>
            <div className={cn(
                "p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all transform group-active:scale-90",
                color
            )}>
                <Icon size={24} className={color?.includes('fill') ? 'fill-current' : ''} />
            </div>
            {count && <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{count}</span>}
        </div>
    );
}
