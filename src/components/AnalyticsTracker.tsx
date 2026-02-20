import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function AnalyticsTracker() {
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        const trackView = async () => {
            try {
                // Determine device type
                const userAgent = navigator.userAgent;
                let deviceType = 'Desktop';
                if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
                if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

                // Basic country detection (Optional, would need a geo API usually, 
                // but we can at least log what we have)

                await supabase.from('traffic_stats').insert({
                    page_path: location.pathname,
                    user_id: user?.id || null,
                    device_type: deviceType,
                    browser: getBrowser(),
                });
            } catch (err) {
                // Silent fail for analytics
                console.error('Analytics error:', err);
            }
        };

        trackView();
    }, [location.pathname, user?.id]);

    return null; // This component doesn't render anything
}

function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Browser';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'Internet Explorer';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Other';
}
