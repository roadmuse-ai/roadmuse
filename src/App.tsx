import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ConfigScreen } from "./screens/ConfigScreen";
import { HelpScreen } from "./screens/HelpScreen";
import { MainScreen } from "./screens/MainScreen";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/config" element={<ConfigScreen />} />
        <Route path="/help" element={<HelpScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
