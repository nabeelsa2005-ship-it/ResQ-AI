import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Guidance from "./pages/Guidance";
import Nearby from "./pages/Nearby";
import Triage from "./pages/Triage";
import AppShell from "./components/AppShell";
import "./App.css";

const Guard = ({ children }) => {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/login" replace />;
};

const ProtectedShell = () => (
  <Guard>
    <AppShell />
  </Guard>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedShell />}>
      <Route path="/" element={<Home />} />
      <Route path="/guidance" element={<Guidance />} />
      <Route path="/triage/:id" element={<Triage />} />
      <Route path="/nearby" element={<Nearby />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AppProvider>
  );
}
