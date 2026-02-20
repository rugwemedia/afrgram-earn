import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';


interface PostProps {
    id: string;
    user: {
        name: string;
        username: string;
        avatar: string;
        verified?: boolean;
        id?: string;
        lastSeen?: string;
    };
    content: string;
    image?: string;
    likes: number;
    comments: number;
    timestamp: string;
    isLiked?: boolean;
    onLike?: () => void;
    onComment?: () => void;
    onDelete?: () => void;
}

export function PostCard({ id, user, content, image, likes, comments, timestamp, onLike, onComment, onDelete, isLiked }: PostProps) {
    const navigate = useNavigate();
    const isOnline = user.lastSeen ? (new Date().getTime() - new Date(user.lastSeen).getTime()) < 300000 : false;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2rem] overflow-hidden mb-6 group"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
                <div className="flex items-center gap-3">
                    {user.id ? (
                        <Link to={`/profile/${user.id}`} className="block shrink-0 relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 ring-2 ring-transparent hover:ring-primary/50 transition-all">
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            {isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10" />
                            )}
                        </Link>
                    ) : (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0 relative">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            {isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full z-10" />
                            )}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-1">
                            {user.id ? (
                                <Link to={`/profile/${user.id}`} className="font-bold text-white hover:text-primary transition-colors">
                                    {user.name}
                                </Link>
                            ) : (
                                <h3 className="font-bold text-white">{user.name}</h3>
                            )}
                            {user.verified && (
                                <div className="bg-blue-500 rounded-full p-1">
                                    <svg width={10} height={10} className="text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.username}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {user.id && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(`/messages?userId=${user.id}`);
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10"
                            title="Send Message"
                        >
                            <Mail size={18} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (window.confirm('Delete this post?')) onDelete();
                            }}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-2"
                            title="Delete Post"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
                <p className="text-sm text-white/90 leading-relaxed">{content}</p>
            </div>

            {/* Media */}
            {image && (
                <div className="relative aspect-square md:aspect-video overflow-hidden bg-white/5">
                    <img
                        src={image}
                        alt="Post content"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </div>
            )}

            {/* Footer Actions */}
            <div className="p-5 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                        <button onClick={onLike} className="flex items-center gap-2 group/btn">
                            <Heart
                                size={22}
                                className={cn(
                                    "transition-all active:scale-90",
                                    isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground group-hover/btn:text-red-500"
                                )}
                            />
                            <span className={cn(
                                "text-xs font-bold transition-colors",
                                isLiked ? "text-red-500" : "text-muted-foreground group-hover/btn:text-white"
                            )}>{likes}</span>
                        </button>

                        <button onClick={onComment} className="flex items-center gap-2 group/btn">
                            <MessageCircle size={22} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
                            <span className="text-xs font-bold text-muted-foreground group-hover/btn:text-white">{comments}</span>
                        </button>

                        <div className="relative group/share">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const url = `${window.location.origin}/post/${id}`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'AFGgram',
                                            text: content,
                                            url: url
                                        }).catch(() => { });
                                    } else {
                                        navigator.clipboard.writeText(url);
                                        alert('Link copied to clipboard!');
                                    }
                                }}
                                className="flex items-center gap-2 group/btn px-1"
                            >
                                <Share2 size={22} className="text-muted-foreground group-hover/btn:text-emerald-500 transition-colors" />
                            </button>

                            {/* Hover Share Menu (Desktop) */}
                            <div className="absolute bottom-full left-0 mb-4 hidden group-hover/share:flex flex-col gap-1 bg-[#1a1a1a] border border-white/10 p-2 rounded-[1.5rem] shadow-2xl z-50 min-w-[160px] backdrop-blur-xl">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(content + " " + window.location.origin + "/post/" + id)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-500/10 rounded-xl text-[10px] font-bold text-white transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    </div>
                                    <span className="uppercase tracking-widest text-[8px]">WhatsApp</span>
                                </a>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + "/post/" + id)}&text=${encodeURIComponent("Check out this post on AFGgram")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-400/10 rounded-xl text-[10px] font-bold text-white transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center text-blue-400">
                                        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    </div>
                                    <span className="uppercase tracking-widest text-[8px]">X (Twitter)</span>
                                </a>
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + "/post/" + id)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-600/10 rounded-xl text-[10px] font-bold text-white transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-600">
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    </div>
                                    <span className="uppercase tracking-widest text-[8px]">Facebook</span>
                                </a>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
                                        alert('Link copied to clipboard!');
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white transition-colors text-left w-full"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <Share2 size={16} />
                                    </div>
                                    <span className="uppercase tracking-widest text-[8px]">Copy Link</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button className="text-muted-foreground hover:text-amber-500 transition-colors">
                        <Bookmark size={22} />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    <span>{timestamp}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-primary/80">Commissionable Post</span>
                </div>
            </div>
        </motion.div>
    );
}
