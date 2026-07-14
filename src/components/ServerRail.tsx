import { Link, useParams } from "react-router-dom";

export interface ServerSummary {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface ServerRailProps {
  servers: ServerSummary[];
  onCreateServer: () => void;
}

export default function ServerRail({ servers, onCreateServer }: ServerRailProps) {
  const { serverId: activeServerId } = useParams();

  return (
    <nav className="flex w-[72px] flex-col items-center gap-2 overflow-y-auto bg-neutral-950 py-3">
      {servers.map((server) => (
        <Link
          key={server._id}
          to={`/servers/${server._id}`}
          title={server.name}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white transition-all hover:rounded-xl ${
            activeServerId === server._id
              ? "rounded-xl bg-indigo-600"
              : "bg-neutral-800 hover:bg-indigo-600"
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
      ))}
      <button
        onClick={onCreateServer}
        title="Create a server"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-2xl text-emerald-400 transition-all hover:rounded-xl hover:bg-emerald-600 hover:text-white"
      >
        +
      </button>
    </nav>
  );
}
