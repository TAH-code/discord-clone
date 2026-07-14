import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./routes/LoginPage";
import RequireAuth from "./routes/RequireAuth";
import HomePage from "./routes/HomePage";
import JoinInvitePage from "./routes/JoinInvitePage";
import ServerLayout from "./routes/ServerLayout";
import ChannelPage from "./routes/ChannelPage";
import DirectMessagePage from "./routes/DirectMessagePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/invite/:inviteCode" element={<JoinInvitePage />} />
        <Route path="/servers/:serverId" element={<ServerLayout />}>
          <Route path="channels/:channelId" element={<ChannelPage />} />
          <Route path="dm/:threadId" element={<DirectMessagePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
