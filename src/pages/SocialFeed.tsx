import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard } from '../components/PostCard';
import { MediaUploader } from '../components/MediaUploader';
import {
    Send, Loader2, X, Plus, ChevronLeft, ChevronRight,
    Eye, Trash2, ImageIcon, Video, Reply, CornerDownRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Post {
    id: string;
    content: string;
    image_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
        full_name: string;
        avatar_url: string;
        role: string;
        last_seen_at?: string;
        is_verified?: boolean;
    };
    user_id: string;
}

interface Story {
    id: string;
    user_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    caption?: string;
    created_at: string;
    expires_at: string;
    profiles: {
        full_name: string;
        avatar_url: string;
    };
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    reply_to_id?: string | null;
    reply_to_name?: string | null;
    profiles: {
        full_name: string;
        avatar_url: string;
    };
}

const ADMIN_EMAIL = 'sharibaru0@gmail.com';

// ─── Story Viewer ────────────────────────────────────────────────────────────
function StoryViewer({
    stories,
    startIndex,
    currentUserId,
    onClose,
    onDelete,
}: {
    stories: Story[];
    startIndex: number;
    currentUserId?: string;
    onClose: () => void;
    onDelete: (storyId: string) => void;
}) {
    const [current, setCurrent] = useState(startIndex);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const DURATION = 5000;

    const story = stories[current];

    const next = () => {
        if (current < stories.length - 1) { setCurrent(c => c + 1); setProgress(0); }
        else onClose();
    };
    const prev = () => { if (current > 0) { setCurrent(c => c - 1); setProgress(0); } };

    useEffect(() => {
        setProgress(0);
        timerRef.current = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { clearInterval(timerRef.current!); next(); return 100; }
                return p + (100 / (DURATION / 100));
            });
        }, 100);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [current]);

    if (!story) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        >
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
                <X size={22} />
            </button>

            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-14 z-20 flex gap-1">
                {stories.map((_, i) => (
                    <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-none"
                            style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-3 z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                    <img src={story.profiles?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                </div>
                <div>
                    <p className="text-white font-bold text-sm leading-none">{story.profiles?.full_name}</p>
                    <p className="text-white/50 text-[10px]">{new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {currentUserId === story.user_id && (
                    <button
                        onClick={() => { onDelete(story.id); if (current >= stories.length - 1) onClose(); else setCurrent(c => c); }}
                        className="ml-2 p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            {/* Media area */}
            <div className="w-full h-full max-w-sm mx-auto relative flex items-center justify-center">
                {story.media_type === 'video' ? (
                    <video
                        src={story.media_url}
                        autoPlay
                        loop
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={story.media_url}
                        className="w-full h-full object-contain"
                        alt="Story"
                    />
                )}

                {/* Caption */}
                {story.caption && (
                    <div className="absolute bottom-6 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-2xl p-4">
                        <p className="text-white text-sm font-medium text-center">{story.caption}</p>
                    </div>
                )}

                {/* Nav zones */}
                <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3" />
                <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/3" />
            </div>

            {/* Side arrows */}
            {current > 0 && (
                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <ChevronLeft size={22} />
                </button>
            )}
            {current < stories.length - 1 && (
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <ChevronRight size={22} />
                </button>
            )}

            {/* View count */}
            <div className="absolute bottom-6 right-4 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full z-20">
                <Eye size={13} className="text-white/60" />
                <span className="text-[11px] text-white/60 font-bold">0 views</span>
            </div>
        </motion.div>
    );
}

// ─── Story Creator Modal ─────────────────────────────────────────────────────
function StoryCreator({
    onClose,
    onPublish,
}: {
    onClose: () => void;
    onPublish: (url: string, type: 'image' | 'video', caption: string) => Promise<void>;
}) {
    const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [caption, setCaption] = useState('');
    const [publishing, setPublishing] = useState(false);

    const handlePublish = async () => {
        if (!preview) return;
        setPublishing(true);
        await onPublish(preview.url, preview.type, caption);
        setPublishing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
            <motion.div
                initial={{ y: 80, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 80, scale: 0.95 }}
                transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                className="glass-card w-full max-w-sm rounded-[2.5rem] overflow-hidden relative"
            >
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-purple-500" />

                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white italic tracking-tight">Add to Story</h3>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {!preview ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">Choose a photo or video to share</p>
                            <div className="grid grid-cols-2 gap-3">
                                <label htmlFor="story-upload" className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-all group">
                                    <ImageIcon size={32} className="text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">Photo</span>
                                    <input
                                        id="story-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const localUrl = URL.createObjectURL(file);
                                            setPreview({ url: localUrl, type: 'image' });
                                            // actual upload will happen on publish
                                        }}
                                    />
                                </label>
                                <label htmlFor="story-video-upload" className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-all group">
                                    <Video size={32} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Video</span>
                                    <input
                                        id="story-video-upload"
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const localUrl = URL.createObjectURL(file);
                                            setPreview({ url: localUrl, type: 'video' });
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="pt-2">
                                <MediaUploader
                                    label="Or Upload from Device"
                                    onUploadComplete={(url, type) => {
                                        const t = type as 'image' | 'video';
                                        setPreview({ url, type: t });
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Preview */}
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-64 flex items-center justify-center">
                                {preview.type === 'video' ? (
                                    <video src={preview.url} className="w-full h-full object-cover" autoPlay muted loop />
                                ) : (
                                    <img src={preview.url} className="w-full h-full object-cover" />
                                )}
                                <button
                                    onClick={() => setPreview(null)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Caption */}
                            <input
                                type="text"
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                placeholder="Add a caption… (optional)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                                maxLength={120}
                            />

                            <div className="space-y-3">
                                {/* If it's a local object URL, we still need to upload */}
                                {preview.url.startsWith('blob:') ? (
                                    <div className="text-center">
                                        <p className="text-xs text-amber-500 font-bold mb-3">Upload your media to publish</p>
                                        <MediaUploader
                                            label="Upload & Publish Story"
                                            onUploadComplete={async (url, type) => {
                                                setPublishing(true);
                                                await onPublish(url, type as 'image' | 'video', caption);
                                                setPublishing(false);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={handlePublish}
                                        disabled={publishing}
                                        className="btn-premium w-full py-4 font-black flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {publishing ? (
                                            <><Loader2 size={18} className="animate-spin" /> Publishing…</>
                                        ) : (
                                            <>{preview.type === 'video' ? <Video size={18} /> : <ImageIcon size={18} />} Share Story</>
                                        )}
                                    </button>
                                )}
                                <p className="text-[10px] text-muted-foreground text-center">Stories disappear after 24 hours</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main SocialFeed ─────────────────────────────────────────────────────────
export function SocialFeed() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchParams] = useSearchParams();
    const highlightPostId = searchParams.get('postId');

    useEffect(() => {
        if (highlightPostId && posts.length > 0) {
            setTimeout(() => {
                const element = document.getElementById(`post-${highlightPostId}`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [highlightPostId, posts]);

    const [stories, setStories] = useState<Story[]>([]);
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [newPostContent, setNewPostContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [showStoryCreator, setShowStoryCreator] = useState(false);
    const [viewingStory, setViewingStory] = useState<{ index: number } | null>(null);
    const [activePostForComments, setActivePostForComments] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchStories();
            fetchLiveSessions();
            fetchUserLikes();

            const subscription = supabase
                .channel('live_sessions_feed')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => fetchLiveSessions())
                .subscribe();

            return () => { supabase.removeChannel(subscription); };
        }
    }, [user]);

    const fetchLiveSessions = async () => {
        const { data } = await supabase
            .from('live_sessions')
            .select('*, profiles:host_id(full_name, avatar_url)')
            .eq('status', 'live');
        setLiveSessions(data || []);
    };

    useEffect(() => {
        if (activePostForComments) fetchComments(activePostForComments);
    }, [activePostForComments]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles (full_name, avatar_url, role, last_seen_at, is_verified)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId: string) => {
        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select('id, content, created_at, user_id, reply_to_id, reply_to_name, profiles (full_name, avatar_url)')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            const formatted = (data as any[] || []).map(c => ({
                ...c,
                profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
            }));
            setComments(formatted);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const fetchUserLikes = async () => {
        if (!user) return;
        const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
        setUserLikes(new Set((data || []).map(l => l.post_id)));
    };

    const fetchStories = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*, profiles (full_name, avatar_url)')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });
            if (error) throw error;
            setStories(data || []);
        } catch (err) {
            console.error('Error fetching stories:', err);
        }
    };

    const handleCreateStory = async (url: string, type: 'image' | 'video', caption: string) => {
        try {
            const { error } = await supabase.from('stories').insert({
                user_id: user?.id,
                media_url: url,
                media_type: type,
                caption: caption || null,
            });
            if (error) throw error;
            await fetchStories();
            setShowStoryCreator(false);
        } catch (err: any) {
            console.error('Error creating story:', err);
            alert('Failed to post story: ' + (err.message || 'Check your database setup'));
        }
    };

    const handleDeleteStory = async (storyId: string) => {
        try {
            await supabase.from('stories').delete().eq('id', storyId);
            setStories(prev => prev.filter(s => s.id !== storyId));
        } catch (err) {
            console.error('Error deleting story:', err);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !mediaUrl) return;
        setPosting(true);
        try {
            const { error } = await supabase.from('posts').insert({
                user_id: user?.id,
                content: newPostContent,
                image_url: mediaUrl,
            });
            if (error) throw error;
            setNewPostContent('');
            setMediaUrl('');
            setMediaType(null);
            fetchPosts();
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setPosting(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!user) return;
        const isLiked = userLikes.has(postId);
        setUserLikes(prev => {
            const s = new Set(prev);
            isLiked ? s.delete(postId) : s.add(postId);
            return s;
        });
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
            alert('Liking failed: ' + (err.message || 'Unknown error'));
        }
    };

    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

    const handleAddComment = async () => {
        if (!user || !newComment.trim() || !activePostForComments) return;
        setCommentLoading(true);
        try {
            const payload: any = {
                post_id: activePostForComments,
                user_id: user.id,
                content: newComment.trim(),
            };
            if (replyingTo) {
                payload.reply_to_id = replyingTo.id;
                payload.reply_to_name = replyingTo.name;
            }
            const { data, error } = await supabase
                .from('post_comments')
                .insert(payload)
                .select('id, content, created_at, user_id, reply_to_id, reply_to_name, profiles (full_name, avatar_url)')
                .single();
            if (error) throw error;
            const c = { ...data, profiles: Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles };
            setComments(prev => [...prev, c as any]);
            setNewComment('');
            setReplyingTo(null);
            setPosts(prev => prev.map(p =>
                p.id === activePostForComments ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p
            ));
        } catch (err: any) {
            alert('Commenting failed: ' + (err.message || 'Unknown error'));
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
            if (error) throw error;
            setComments(prev => prev.filter(c => c.id !== commentId));
            if (activePostForComments) {
                setPosts(prev => prev.map(p =>
                    p.id === activePostForComments ? { ...p, comments_count: Math.max(0, (Number(p.comments_count) || 0) - 1) } : p
                ));
            }
        } catch (err: any) {
            alert('Delete failed: ' + (err.message || 'Unknown error'));
        }
    };

    // Group stories by user
    const userStory = stories.find(s => s.user_id === user?.id);
    const otherStories = stories.filter(s => s.user_id !== user?.id);
    const storyGroups = [...(userStory ? [userStory] : []), ...otherStories];

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Story Creator Modal */}
            <AnimatePresence>
                {showStoryCreator && (
                    <StoryCreator
                        onClose={() => setShowStoryCreator(false)}
                        onPublish={handleCreateStory}
                    />
                )}
            </AnimatePresence>

            {/* Story Viewer */}
            <AnimatePresence>
                {viewingStory !== null && storyGroups.length > 0 && (
                    <StoryViewer
                        stories={storyGroups}
                        startIndex={viewingStory.index}
                        currentUserId={user?.id}
                        onClose={() => setViewingStory(null)}
                        onDelete={handleDeleteStory}
                    />
                )}
            </AnimatePresence>

            <header className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Social Feed</h2>
                <p className="text-muted-foreground font-medium mt-1">Connect, engage, and earn rewards.</p>
            </header>

            {/* ── Stories Bar ──────────────────────────────────────── */}
            <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-1 px-1 mb-6">
                {/* Add Story */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => setShowStoryCreator(true)}
                        className="relative w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all bg-white/5 group"
                    >
                        {userStory ? (
                            <>
                                <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={userStory.media_url} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                                    <Plus size={10} className="text-white" strokeWidth={3} />
                                </div>
                            </>
                        ) : (
                            <Plus size={26} className="group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-wide">Your Story</span>
                </div>

                {/* Live Sessions */}
                {liveSessions.map((session) => (
                    <div key={session.id} className="flex flex-col items-center gap-1.5 shrink-0 animate-in fade-in zoom-in duration-500">
                        <motion.button
                            onClick={() => window.location.href = '/live'}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="relative w-16 h-16 rounded-full p-[3px] bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-pointer"
                        >
                            <div className="w-full h-full rounded-full border-[2px] border-background overflow-hidden relative">
                                <img
                                    src={session.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.host_id}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-red-600/20" />
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter border border-background">
                                Live
                            </div>
                        </motion.button>
                        <span className="text-[9px] font-bold text-red-500 truncate w-16 text-center">
                            {session.profiles?.full_name?.split(' ')[0]}
                        </span>
                    </div>
                ))}

                {/* Other Avatars */}
                {storyGroups.map((story, i) => (
                    <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => setViewingStory({ index: i })}
                            className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-500 hover:scale-105 transition-transform"
                        >
                            <div className="w-full h-full rounded-full border-[3px] border-background overflow-hidden">
                                <img
                                    src={story.profiles?.avatar_url || 'https://via.placeholder.com/100'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </button>
                        <span className="text-[9px] font-bold text-muted-foreground truncate w-16 text-center">
                            {story.profiles?.full_name?.split(' ')[0] || 'User'}
                        </span>
                    </div>
                ))}

                {stories.length === 0 && (
                    <div className="flex items-center text-xs text-muted-foreground/50 italic pl-2">
                        No active stories. Be the first!
                    </div>
                )}
            </div>

            {/* ── Create Post ───────────────────────────────────────── */}
            <div className="glass-card p-5 rounded-[2rem] mb-8">
                <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-black text-lg">
                        {user?.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's happening in your digital workspace?"
                            className="w-full bg-transparent border-none outline-none text-white placeholder:text-muted-foreground/50 resize-none min-h-[56px] font-medium text-sm leading-relaxed"
                        />
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <MediaUploader
                                    label="Photo/Video"
                                    compact
                                    onUploadComplete={(url, type) => { setMediaUrl(url); setMediaType(type as 'image' | 'video'); }}
                                />
                                {mediaUrl && (
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20">
                                        {mediaType === 'video' ? (
                                            <video src={mediaUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={mediaUrl} className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            onClick={() => { setMediaUrl(''); setMediaType(null); }}
                                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleCreatePost}
                                disabled={posting || (!newPostContent.trim() && !mediaUrl)}
                                className="btn-premium px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {posting ? <Loader2 size={14} className="animate-spin" /> : <><span className="font-bold">Post</span> <Send size={13} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Posts ────────────────────────────────────────────── */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="text-primary animate-spin" size={32} /></div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No posts yet. Be the first to share!</div>
                ) : (
                    posts.map(post => {
                        const canDelete = user?.id === post.user_id || user?.email === ADMIN_EMAIL;
                        return (
                            <div
                                id={`post-${post.id}`}
                                key={post.id}
                                className={cn(
                                    'transition-all duration-700 rounded-[2rem]',
                                    highlightPostId === post.id && 'ring-2 ring-primary shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                                )}
                            >
                                <PostCard
                                    id={post.id}
                                    user={{
                                        name: post.profiles?.full_name || 'Anonymous',
                                        username: '@' + (post.profiles?.full_name?.toLowerCase().replace(/\s/g, '') || 'user'),
                                        avatar: post.profiles?.avatar_url || 'https://via.placeholder.com/100',
                                        verified: post.profiles?.is_verified,
                                        id: post.user_id,
                                        lastSeen: post.profiles?.last_seen_at,
                                        isLive: liveSessions.some(s => s.host_id === post.user_id),
                                    }}
                                    content={post.content}
                                    image={post.image_url}
                                    likes={Number(post.likes_count || 0)}
                                    isLiked={userLikes.has(post.id)}
                                    comments={Number(post.comments_count || 0)}
                                    timestamp={new Date(post.created_at).toLocaleDateString()}
                                    onLike={() => handleLikePost(post.id)}
                                    onComment={() => setActivePostForComments(post.id)}
                                    onDelete={canDelete ? () => handleDeletePost(post.id) : undefined}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Comment Drawer ────────────────────────────────────── */}
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
                            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] z-[101] min-h-[60vh] max-h-[85vh] flex flex-col"
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
                            <div className="flex-1 overflow-y-auto px-5 py-2 no-scrollbar space-y-4">
                                {commentLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm">No comments yet. Be the first!</div>
                                ) : (
                                    comments.map(comment => {
                                        const isOwn = comment.user_id === user?.id;
                                        const isReply = !!comment.reply_to_id;
                                        return (
                                            <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8' : ''}`}>
                                                {isReply && <CornerDownRight size={14} className="text-primary/40 shrink-0 mt-3" />}
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 shrink-0">
                                                    <img src={comment.profiles?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 bg-white/[0.03] rounded-2xl px-4 py-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-white">{comment.profiles?.full_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setReplyingTo({ id: comment.id, name: comment.profiles?.full_name || 'User' })}
                                                                className="p-1 text-muted-foreground/60 hover:text-primary transition-colors"
                                                                title="Reply"
                                                            >
                                                                <Reply size={13} />
                                                            </button>
                                                            {isOwn && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="p-1 text-muted-foreground/60 hover:text-red-500 transition-colors"
                                                                    title="Delete comment"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {comment.reply_to_name && (
                                                        <p className="text-[11px] text-primary/60 font-bold mb-1">↩ Replying to {comment.reply_to_name}</p>
                                                    )}
                                                    <p className="text-sm text-white/80 leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-4 pb-10 bg-[#0a0a0a] border-t border-white/5">
                                {replyingTo && (
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                        <span className="text-xs text-primary font-bold flex items-center gap-1">
                                            <Reply size={12} /> Replying to <strong>{replyingTo.name}</strong>
                                        </span>
                                        <button onClick={() => setReplyingTo(null)} className="p-0.5 text-muted-foreground hover:text-white">
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black shrink-0">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                            placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a comment…'}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-muted-foreground/50 pr-12"
                                            autoFocus={!!replyingTo}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
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
        </div>
    );
}
