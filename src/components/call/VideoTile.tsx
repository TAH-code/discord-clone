import { useEffect, useRef } from "react";

interface VideoTileProps {
  name: string;
  stream: MediaStream | null;
  muted?: boolean;
  micOn: boolean;
  cameraOn: boolean;
  speaking: boolean;
  isYou?: boolean;
}

export default function VideoTile({
  name,
  stream,
  muted = false,
  micOn,
  cameraOn,
  speaking,
  isYou = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-neutral-800 ${
        speaking
          ? "ring-2 ring-emerald-500"
          : isYou
            ? "ring-2 ring-emerald-500/70"
            : "ring-1 ring-white/10"
      }`}
    >
      {cameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-600 text-lg font-semibold text-white">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300">
        camera feed
      </span>
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {!micOn && <span title="Muted">🔇</span>}
        <span>
          {name}
          {isYou && " · You"}
        </span>
      </div>
    </div>
  );
}
