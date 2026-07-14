import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ServerRail from "../components/ServerRail";
import CreateOrJoinServerModal from "../components/CreateOrJoinServerModal";

export default function HomePage() {
  const servers = useQuery(api.servers.listMyServers);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-800">
      <ServerRail
        servers={servers ?? []}
        onCreateServer={() => setShowModal(true)}
      />
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        {servers === undefined
          ? "Loading…"
          : "Select a server, or create/join one to get started."}
      </div>
      {showModal && (
        <CreateOrJoinServerModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
