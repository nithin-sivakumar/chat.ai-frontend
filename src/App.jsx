import React from "react";
import { Route, Routes } from "react-router-dom";
import Chat from "./pages/Chat";
import Landing from "./pages/Landing";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
};

export default App;
