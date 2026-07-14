import { useEffect, useRef } from "react";

interface VideoTileProps {
  name: string;
  stream: MediaStream | null;
  muted?: boolean;
  micOn: boolean;
  cameraOn: boolean;
  speaking: boolean;
}

export default function VideoTile({
  name,
  stream,
  muted = false,
  micOn,
  cameraOn,
  speaking,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-900 ${
        speaking ? "ring-2 ring-emerald-500" : "ring-1 ring-neutral-700"
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-700 text-lg font-semibold text-white">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {!micOn && <span title="Muted">🔇</span>}
        <span>{name}</span>
      </div>
    </div>
  );
}
