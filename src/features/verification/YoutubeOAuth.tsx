/**
 * YoutubeOAuth.tsx — YouTube channel verification via Google OAuth.
 *
 * Flow:
 * 1. User clicks "Connect YouTube" button
 * 2. Google OAuth popup with youtube.readonly scope
 * 3. Access token used to call YouTube Data API
 * 4. Channel ID, name, metrics returned and saved to Firestore
 * 5. channelVerified: true is set — cannot be spoofed
 */
import React from 'react';
import { Play } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface YoutubeOAuthProps {
  onSuccess: (channelData: {
    channelId: string;
    channelName: string;
    subscriberCount: number;
    accessToken: string;
  }) => void;
  onError: (message: string) => void;
}

export default function YoutubeOAuth({ onSuccess, onError }: YoutubeOAuthProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (!accessToken) throw new Error('No access token received');

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true&access_token=${accessToken}`,
      );
      const data = await res.json();
      if (!data.items?.length) throw new Error('No YouTube channel on this account');

      const channel = data.items[0];
      onSuccess({
        channelId: channel.id,
        channelName: channel.snippet.title,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        accessToken,
      });
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        onError(err.message || 'YouTube connection failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 bg-red-600 border-2 border-black text-white font-black py-3.5 px-8 rounded-lg uppercase tracking-widest text-[10px] hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-60"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Play className="w-4 h-4" />
      )}
      {loading ? 'Connecting…' : 'Connect YouTube Account'}
    </button>
  );
}
