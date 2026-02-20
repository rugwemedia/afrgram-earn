import { v2 as cloudinary } from 'cloudinary';

// Configure with credentials from the user's request
cloudinary.config({
    cloud_name: 'dm9q1subo',
    api_key: '714264798969573',
    api_secret: '0jwYOJLSrcM55pNpG6BzDHtEIP4'
});

async function createPreset() {
    try {
        const presetName = 'afrgam_unsigned';

        // Check if it already exists or just try to create it
        // We'll try to create/update an unsigned preset
        const result = await cloudinary.api.create_upload_preset({
            name: presetName,
            unsigned: true,
            folder: 'afrgam_uploads',
            allowed_formats: ['jpg', 'png', 'mp4', 'mov'],
        });

        console.log('SUCCESS: Upload Preset Created!');
        console.log('Preset Name:', result.name);
    } catch (error: any) {
        if (error.error?.message?.includes('already exists')) {
            console.log('Preset already exists: afrgam_unsigned');
        } else {
            console.error('Error creating preset:', error);
        }
    }
}

createPreset();
