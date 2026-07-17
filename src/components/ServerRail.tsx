import { Link, useParams } from "react-router-dom";

export interface ServerSummary {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface ServerRailProps {
  servers: ServerSummary[];
  onCreateServer: () => void;
  currentUserName?: string;
}

const SERVER_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-purple-600",
  "bg-teal-600",
  "bg-amber-600",
  "bg-rose-600",
];

function colorForServer(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return SERVER_COLORS[hash % SERVER_COLORS.length];
}

export default function ServerRail({
  servers,
  onCreateServer,
  currentUserName,
}: ServerRailProps) {
  const { serverId: activeServerId } = useParams();

  return (
    <nav className="flex w-[72px] flex-col items-center gap-2 overflow-y-auto border-r border-neutral-200 bg-panel py-3">
      <Link
        to="/"
        title="Home"
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white transition-all hover:rounded-xl"
      >
        {(currentUserName ?? "?").slice(0, 1).toUpperCase()}
      </Link>
      {servers.length > 0 && (
        <div className="my-1 h-px w-8 flex-shrink-0 bg-neutral-200" />
      )}
      {servers.map((server) => {
        const isActive = activeServerId === server._id;
        return (
          <Link
            key={server._id}
            to={`/servers/${server._id}`}
            title={server.name}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold transition-all hover:rounded-xl ${
              isActive
                ? "border-2 border-blue-500 bg-white text-blue-600"
                : `${colorForServer(server._id)} text-white`
            }`}
          >
            {server.imageUrl ? (
              <img
                src={server.imageUrl}
                alt={server.name}
                className="h-full w-full rounded-[inherit] object-cover"
              />
            ) : (
              server.name.slice(0, 2).toUpperCase()
            )}
          </Link>
        );
      })}
      <button
        onClick={onCreateServer}
        title="Create a server"
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl text-emerald-600 transition-all hover:rounded-xl hover:bg-emerald-600 hover:text-white"
      >
        +
      </button>
    </nav>
  );
}
