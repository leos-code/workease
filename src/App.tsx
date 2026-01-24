import { Routes, Route } from "react-router-dom";
import { NewTaskPage, TaskPage, ConnectorsPage, SettingsPage } from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<NewTaskPage />} />
      <Route path="/task/:id" element={<TaskPage />} />
      <Route path="/connectors" element={<ConnectorsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
