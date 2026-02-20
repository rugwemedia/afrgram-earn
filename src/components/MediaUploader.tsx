import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface MediaUploaderProps {
    onUploadComplete: (url: string, type: 'image' | 'video') => void;
    label?: string;
    className?: string;
    accept?: string;
}

export function MediaUploader({ onUploadComplete, label = "Upload Media", className, accept = "image/*,video/*" }: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset
        setError('');

        // Basic Validation
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            setError('File too large (Max 20MB)');
            return;
        }

        setUploading(true);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setError('Cloudinary not configured (Missing Cloud Name or Preset)');
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
        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <input
                type="file"
                id="media-upload"
                onChange={handleUpload}
                accept={accept}
                className="hidden"
                disabled={uploading}
            />
            <label
                htmlFor="media-upload"
                className={cn(
                    "flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border-2 border-dashed border-white/10 rounded-2xl p-6 hover:bg-white/5 hover:border-primary/50",
                    uploading && "opacity-50 pointer-events-none"
                )}
            >
                {uploading ? (
                    <Loader2 size={24} className="text-primary animate-spin" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload size={24} />
                        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                    </div>
                )}
            </label>
            {error && (
                <p className="absolute -bottom-6 left-0 text-[10px] text-red-500 font-bold">{error}</p>
            )}
        </div>
    );
}
