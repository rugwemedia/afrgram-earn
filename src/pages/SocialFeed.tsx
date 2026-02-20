import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard } from '../components/PostCard';
import { Send, Loader2, X, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MediaUploader } from '../components/MediaUploader';

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
    profiles: {
        full_name: string;
        avatar_url: string;
    };
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    profiles: {
        full_name: string;
        avatar_url: string;
    };
}

const ADMIN_EMAIL = 'sharibaru0@gmail.com';

export function SocialFeed() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchParams] = useSearchParams();
    const highlightPostId = searchParams.get('postId');

    useEffect(() => {
        if (highlightPostId && posts.length > 0) {
            setTimeout(() => {
                const element = document.getElementById(`post-${highlightPostId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [highlightPostId, posts]);

    const [stories, setStories] = useState<Story[]>([]);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [newPostContent, setNewPostContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [showStoryUploader, setShowStoryUploader] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchStories();
            fetchUserLikes();
        }
    }, [user]);

    useEffect(() => {
        if (activePostForComments) {
            fetchComments(activePostForComments);
        }
    }, [activePostForComments]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (full_name, avatar_url, role, last_seen_at, is_verified)
                `)
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
                .select(`
                    id, content, created_at,
                    profiles (full_name, avatar_url)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Handle case where profiles might be returned as an array
            const formattedComments = (data as any[] || []).map(comment => ({
                ...comment,
                profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            }));

            setComments(formattedComments);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const fetchUserLikes = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching user likes:', error);
            return;
        }
        setUserLikes(new Set(data.map(l => l.post_id)));
    };

    const fetchStories = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select(`
                    *,
                    profiles (full_name, avatar_url)
                `)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStories(data || []);
        } catch (err) {
            console.error('Error fetching stories:', err);
        }
    };

    const handleCreateStory = async (url: string, type: 'image' | 'video') => {
        try {
            const { error } = await supabase.from('stories').insert({
                user_id: user?.id,
                media_url: url,
                media_type: type
            });
            if (error) throw error;
            fetchStories();
            setShowStoryUploader(false);
        } catch (err) {
            console.error('Error creating story:', err);
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
            fetchPosts(); // Refresh feed
        } catch (err) {
            console.error('Error creating post:', err);
            // alert('Failed to post. Please try again.');
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
            alert('Failed to delete post.');
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!user) return;
        const isLiked = userLikes.has(postId);

        // Optimistic update
        setUserLikes(prev => {
            const newSet = new Set(prev);
            if (isLiked) newSet.delete(postId);
            else newSet.add(postId);
            return newSet;
        });

        // Update posts counts locally for speed with zero-fallback
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, likes_count: (Number(p.likes_count) || 0) + (isLiked ? -1 : 1) }
                : p
        ));

        try {
            const { error } = isLiked
                ? await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id })
                : await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });

            if (error) throw error;
        } catch (err: any) {
            console.error('Error toggling like:', err);
            // Revert changes on error
            setUserLikes(prev => {
                const newSet = new Set(prev);
                if (isLiked) newSet.add(postId);
                else newSet.delete(postId);
                return newSet;
            });
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, likes_count: (Number(p.likes_count) || 0) + (isLiked ? 1 : -1) } : p
            ));
            alert('Liking failed: ' + (err.message || 'Unknown error. Have you run the SQL script?'));
        }
    };

    const handleAddComment = async () => {
        if (!user || !newComment.trim() || !activePostForComments) return;
        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: activePostForComments,
                    user_id: user.id,
                    content: newComment.trim()
                })
                .select(`
                    id, content, created_at,
                    profiles (full_name, avatar_url)
                `)
                .single();

            if (error) throw error;

            const commentData = {
                ...data,
                profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
            };

            setComments(prev => [...prev, commentData as any]);
            setNewComment('');

            // Update posts counts locally
            setPosts(prev => prev.map(p =>
                p.id === activePostForComments ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p
            ));
        } catch (err: any) {
            console.error('Error adding comment:', err);
            // Revert comment count
            setPosts(prev => prev.map(p =>
                p.id === activePostForComments ? { ...p, comments_count: Math.max(0, (Number(p.comments_count) || 0) - 1) } : p
            ));
            alert('Commenting failed: ' + (err.message || 'Unknown error. Check your database tables and RLS policies.'));
        } finally {
            setCommentLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Social Feed</h2>
                <p className="text-muted-foreground font-medium mt-1">Connect, engage, and earn rewards.</p>
            </header>

            {/* Stories Bar */}
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-1 px-1 mb-4">
                {/* Add Story Button */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowStoryUploader(!showStoryUploader)}
                        className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group"
                    >
                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Your Story</span>
                </div>

                {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-indigo-500">
                            <div className="w-full h-full rounded-full border-2 border-[#0a0a0a] overflow-hidden">
                                <img src={story.profiles?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground truncate w-16 text-center">
                            {story.profiles?.full_name.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>

            {showStoryUploader && (
                <div className="glass-card p-6 rounded-[2rem] mb-8 border-primary/20 bg-primary/5">
                    <h4 className="text-white font-black text-center mb-4 uppercase tracking-widest text-xs">Share a Story</h4>
                    <MediaUploader
                        onUploadComplete={(url, type) => handleCreateStory(url, type)}
                        label="Choose Image or Video"
                        className="border-primary/20"
                    />
                </div>
            )}

            {/* Create Post Card */}
            <div className="glass-card p-6 rounded-[2rem] mb-8">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {/* Use a placeholder if user avatar is missing, ideally fetch from profile */}
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's happening in your digital workspace?"
                            className="w-full bg-transparent border-none outline-none text-white placeholder:text-muted-foreground resize-none min-h-[60px] font-medium"
                        />
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                            <div className="flex gap-4">
                                <MediaUploader
                                    label="Add Media"
                                    className="border-none p-0 hover:bg-transparent"
                                    onUploadComplete={(url, type) => {
                                        setMediaUrl(url);
                                        setMediaType(type);
                                    }}
                                />
                                {mediaUrl && (
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
                                        {mediaType === 'video' ? (
                                            <video src={mediaUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            onClick={() => { setMediaUrl(''); setMediaType(null); }}
                                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleCreatePost}
                                disabled={posting || (!newPostContent.trim() && !mediaUrl)}
                                className="btn-premium px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {posting ? <Loader2 size={14} className="animate-spin" /> : <><span className="font-bold">Post</span> <Send size={14} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts List */}
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
                                    "transition-all duration-1000 rounded-[2rem]",
                                    highlightPostId === post.id && "ring-2 ring-primary shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                )}
                            >
                                <PostCard
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

            {/* Comment Drawer Modal */}
            <AnimatePresence>
                {activePostForComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActivePostForComments(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] z-[101] min-h-[60vh] max-h-[85vh] flex flex-col"
                        >
                            <div className="p-4 flex flex-col items-center">
                                <div className="w-12 h-1 bg-white/10 rounded-full mb-6" />
                                <div className="w-full flex justify-between items-center px-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Comments</h3>
                                    <button
                                        onClick={() => setActivePostForComments(null)}
                                        className="p-2 bg-white/5 rounded-full text-muted-foreground hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
                                {commentLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No comments yet. Share your thoughts!</div>
                                ) : (
                                    <div className="space-y-6">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 shrink-0">
                                                    <img src={comment.profiles?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-white">{comment.profiles?.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-white/80 leading-relaxed">{comment.content}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tighter">Like</button>
                                                        <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tighter">Reply</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 pb-10 bg-[#0a0a0a] border-t border-white/5">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <div className="text-primary font-bold">{user?.email?.[0].toUpperCase()}</div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            placeholder="Write a comment..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-muted-foreground/50 transition-all pr-12"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
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
