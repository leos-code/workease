import { Routes, Route } from "react-router-dom";
import { NewTaskPage, TaskPage, FilesPage, ConnectorsPage } from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<NewTaskPage />} />
      <Route path="/task/:id" element={<TaskPage />} />
      <Route path="/files" element={<FilesPage />} />
      <Route path="/connectors" element={<ConnectorsPage />} />
    </Routes>
  );
}

export default App;
