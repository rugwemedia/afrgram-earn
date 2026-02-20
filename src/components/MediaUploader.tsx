import { useState, useId } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface MediaUploaderProps {
    onUploadComplete: (url: string, type: 'image' | 'video') => void;
    label?: string;
    className?: string;
    accept?: string;
    compact?: boolean;
}

export function MediaUploader({
    onUploadComplete,
    label = 'Upload Media',
    className,
    accept = 'image/*,video/*',
    compact = false,
}: MediaUploaderProps) {
    const uid = useId();
    const inputId = `media-upload-${uid}`;
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setDone(false);

        if (file.size > 50 * 1024 * 1024) {
            setError('File too large (Max 50MB)');
            return;
        }

        setUploading(true);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setError('Cloudinary not configured');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || 'Upload failed');
            }

            const data = await res.json();
            onUploadComplete(data.secure_url, data.resource_type);
            setDone(true);
            // Reset "done" state after 3s
            setTimeout(() => setDone(false), 3000);
        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            // Reset the input so the same file can be re-selected
            e.target.value = '';
        }
    };

    return (
        <div className={cn('relative', className)}>
            <input
                type="file"
                id={inputId}
                onChange={handleUpload}
                accept={accept}
                className="hidden"
                disabled={uploading}
            />
            <label
                htmlFor={inputId}
                className={cn(
                    'flex items-center justify-center gap-2 cursor-pointer transition-all',
                    compact
                        ? 'px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40'
                        : 'flex-col border-2 border-dashed border-white/10 rounded-2xl p-6 hover:bg-white/5 hover:border-primary/50',
                    uploading && 'opacity-60 pointer-events-none',
                    done && 'border-emerald-500/40 bg-emerald-500/5'
                )}
            >
                {uploading ? (
                    <Loader2 size={compact ? 16 : 24} className="text-primary animate-spin" />
                ) : done ? (
                    <CheckCircle2 size={compact ? 16 : 24} className="text-emerald-500" />
                ) : (
                    <Upload size={compact ? 16 : 24} className="text-muted-foreground" />
                )}
                <span className={cn(
                    'font-bold uppercase tracking-wider text-muted-foreground',
                    compact ? 'text-[11px]' : 'text-xs'
                )}>
                    {uploading ? 'Uploading…' : done ? 'Uploaded!' : label}
                </span>
            </label>
            {error && (
                <p className="mt-1 text-[10px] text-red-500 font-bold text-center">{error}</p>
            )}
        </div>
    );
}
