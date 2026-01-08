import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/Login";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Editor from "./pages/Editor";
import ModePage from "./pages/Mode"; // ✅ .tsx kaldır
import { getMe } from "./api/auth";

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      setChecking(false);
      return;
    }

    getMe(token)
      .then((me) => {
        if (me.role === "ADMIN") navigate("/admin", { replace: true });
        else navigate("/mode", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  if (checking) return <div style={{ padding: 20 }}>Yükleniyor...</div>;
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/mode" element={<ModePage />} />

        <Route path="/home" element={<Home />} />
        <Route path="/home/:view" element={<Home />} />

        <Route path="/admin" element={<Admin />} />
        <Route path="/editor" element={<Editor />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
