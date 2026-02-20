import { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, X, Music2, Type, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ReelPlayer } from '../components/ReelPlayer';
import { MediaUploader } from '../components/MediaUploader';

export function Reels() {
    const { user } = useAuth();
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showUpload, setShowUpload] = useState(false);

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [musicName, setMusicName] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        try {
            const { data, error } = await supabase
                .from('reels')
                .select(`
                    *,
                    profiles (full_name, avatar_url, last_seen_at)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReels(data || []);
        } catch (err) {
            console.error('Error fetching reels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const index = Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const handleUploadComplete = (url: string, type: 'image' | 'video') => {
        if (type !== 'video') {
            alert('Please upload a video for Reels.');
            return;
        }
        setVideoUrl(url);
    };

    const handleCreateReel = async () => {
        if (!user || !videoUrl) return;
        setUploading(true);
        try {
            const { error } = await supabase.from('reels').insert({
                user_id: user.id,
                video_url: videoUrl,
                caption,
                music_name: musicName || 'Original Audio'
            });

            if (error) throw error;

            setVideoUrl('');
            setCaption('');
            setMusicName('');
            setShowUpload(false);
            fetchReels();
        } catch (err) {
            console.error('Error creating reel:', err);
            alert('Failed to upload reel.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-100px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="relative h-[calc(100vh-100px)] md:h-[calc(100vh-40px)] w-full max-w-lg mx-auto bg-black rounded-[2.5rem] overflow-hidden">
            {/* Reels Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full w-full snap-y snap-mandatory overflow-y-auto no-scrollbar"
            >
                {reels.length > 0 ? (
                    reels.map((reel, index) => (
                        <ReelPlayer
                            key={reel.id}
                            reel={reel}
                            isActive={index === activeIndex && !showUpload}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Plus size={40} className="text-white/20" />
                        </div>
                        <h3 className="text-white font-black text-2xl uppercase tracking-widest">No Reels Yet</h3>
                        <p className="text-muted-foreground mt-2 font-medium">Be the first to share a moment!</p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="mt-8 bg-primary text-white font-black px-8 py-3 rounded-2xl shadow-2xl hover:bg-primary/90 transition-all"
                        >
                            Upload Now
                        </button>
                    </div>
                )}
            </div>

            {/* Create Button Overlay */}
            {!showUpload && (
                <button
                    onClick={() => setShowUpload(true)}
                    className="absolute top-6 left-6 p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white z-40 hover:bg-primary transition-all active:scale-90"
                >
                    <Plus size={24} />
                </button>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col pt-10 px-6"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Post a Reel</h2>
                            <button onClick={() => setShowUpload(false)} className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar pb-20">
                            {!videoUrl ? (
                                <MediaUploader
                                    onUploadComplete={handleUploadComplete}
                                    label="Choose Video"
                                    accept="video/*"
                                    className="h-64 h-full"
                                />
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative h-64 rounded-3xl overflow-hidden bg-white/5">
                                        <video src={videoUrl} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setVideoUrl('')}
                                            className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <Type className="absolute left-4 top-4 text-muted-foreground" size={20} />
                                            <textarea
                                                placeholder="Write a catchy caption..."
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium h-32 resize-none"
                                            />
                                        </div>

                                        <div className="relative group">
                                            <Music2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Music name (Optional)"
                                                value={musicName}
                                                onChange={(e) => setMusicName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateReel}
                                        disabled={uploading}
                                        className="w-full bg-primary py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-2xl hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" /> : <>Post Now <Send size={20} /></>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
