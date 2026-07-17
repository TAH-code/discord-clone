import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ServerRail from "../components/ServerRail";
import CreateOrJoinServerModal from "../components/CreateOrJoinServerModal";

export default function HomePage() {
  const servers = useQuery(api.servers.listMyServers);
  const currentUser = useQuery(api.users.getCurrentUser);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="h-screen w-screen bg-app-bg p-3">
      <div className="flex h-full overflow-hidden rounded-2xl bg-panel shadow-lg">
        <ServerRail
          servers={servers ?? []}
          onCreateServer={() => setShowModal(true)}
          currentUserName={currentUser?.name}
        />
        <div className="flex flex-1 items-center justify-center text-neutral-400">
          {servers === undefined
            ? "Loading…"
            : "Select a server, or create/join one to get started."}
        </div>
      </div>
      {showModal && (
        <CreateOrJoinServerModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
