import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Music2, Volume2, VolumeX, Play } from 'lucide-react';
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
                    color={isLiked ? "text-red-500 fill-red-500" : "hover:text-red-500"}
                    onClick={handleToggleLike}
                />
                <SideAction icon={MessageCircle} count={reel.comments_count?.toString() || "0"} color="hover:text-primary" />
                <SideAction
                    icon={Share2}
                    count="Share"
                    color="hover:text-emerald-500"
                    onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/reels?id=${reel.id}`);
                        alert('Reel link copied!');
                    }}
                />
                <SideAction icon={MoreHorizontal} />
            </div>

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
