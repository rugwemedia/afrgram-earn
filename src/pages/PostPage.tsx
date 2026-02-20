import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PostCard } from '../components/PostCard';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Post {
    id: string;
    content: string;
    image_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
        id: string;
        full_name: string;
        avatar_url: string;
        role: string;
        last_seen_at?: string;
    };
    user_id: string;
}

export function PostPage() {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (postId) {
            fetchPost();
            if (user) fetchUserLikes();
        }
    }, [postId, user]);

    const fetchPost = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (id, full_name, avatar_url, role, last_seen_at)
                `)
                .eq('id', postId)
                .single();

            if (error) throw error;
            setPost(data);
        } catch (err) {
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserLikes = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

        if (!error && data) {
            setUserLikes(new Set(data.map(l => l.post_id)));
        }
    };

    const handleLikePost = async (id: string) => {
        if (!user) return;
        const isLiked = userLikes.has(id);

        setUserLikes(prev => {
            const newSet = new Set(prev);
            if (isLiked) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });

        if (post) {
            setPost({
                ...post,
                likes_count: post.likes_count + (isLiked ? -1 : 1)
            });
        }

        try {
            if (isLiked) {
                await supabase.from('post_likes').delete().match({ post_id: id, user_id: user.id });
            } else {
                await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
            }
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="text-center py-20 px-6">
                <h3 className="text-xl font-black text-white mb-2">Post not found</h3>
                <p className="text-muted-foreground mb-6">The post you're looking for might have been deleted.</p>
                <button
                    onClick={() => navigate('/feed')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                >
                    Return to Feed
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
            >
                <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10">
                    <ChevronLeft size={20} />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Go Back</span>
            </button>

            <PostCard
                id={post.id}
                user={{
                    id: post.profiles.id,
                    name: post.profiles.full_name,
                    username: `@${post.profiles.full_name.toLowerCase().replace(/\s+/g, '')}`,
                    avatar: post.profiles.avatar_url || 'https://via.placeholder.com/150',
                    lastSeen: post.profiles.last_seen_at
                }}
                content={post.content}
                image={post.image_url}
                likes={Number(post.likes_count || 0)}
                comments={Number(post.comments_count || 0)}
                timestamp={new Date(post.created_at).toLocaleDateString()}
                isLiked={userLikes.has(post.id)}
                onLike={() => handleLikePost(post.id)}
                onComment={() => navigate(`/feed?postId=${post.id}`)}
            />
        </div>
    );
}
