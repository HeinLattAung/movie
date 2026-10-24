import { useEffect, useRef, useState } from 'react';

let apiPromise;
function youtubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise(resolve => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function HeroVideo({ videoId }) {
  const host = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    let disposed = false;
    let player;
    const mount = document.createElement('div');
    host.current.appendChild(mount);
    youtubeAPI().then(YT => {
      if (disposed) return;
      player = new YT.Player(mount, {
        videoId,
        playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, playsinline: 1, loop: 1, playlist: videoId, rel: 0 },
        events: {
          onReady: event => { event.target.mute(); event.target.playVideo(); },
          onStateChange: event => { if (!disposed) setPlaying(event.data === YT.PlayerState.PLAYING); },
          onError: () => { if (!disposed) setPlaying(false); },
        },
      });
    });
    return () => { disposed = true; player?.destroy(); mount.remove(); };
  }, [videoId]);
  return <div ref={host} className={`hero-video-bg${playing ? ' is-playing' : ''}`} aria-hidden="true" />;
}
