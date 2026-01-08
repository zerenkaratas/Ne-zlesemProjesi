import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getToken, logout } from "../utils/auth";
import { theme } from "../ui/theme";

type Me = { userId: string; role: "ADMIN" | "EDITOR" | "USER" };

export default function ModePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data as Me;

        // admin ise mode sayfasına hiç gerek yok
        if (data.role === "ADMIN") {
          navigate("/admin");
          return;
        }

        setMe(data);
      })
      .catch(() => {
        // token bozuk/expired vb.
        logout();
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function goUser() {
    navigate("/home");
  }

  function goEditor() {
    if (!me) return;

    if (me.role === "EDITOR") {
      navigate("/editor");
    } else {
      setInfo("Siz editör değilsiniz. Editör olmak istiyorsanız admine talep gönderin.");
    }
  }

  async function requestEditor() {
    setInfo(null);
    const token = getToken();
    if (!token) return navigate("/login");

    try {
      await api.post(
        "/requests/become-editor",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInfo("Editör olma talebiniz gönderildi. Admin onayladığında editör modu açılacak.");
    } catch (e: any) {
      setInfo(e?.response?.data?.message ?? "Talep gönderilemedi.");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) return <div style={{ padding: 20 }}>Yükleniyor...</div>;
  if (!me) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: theme.bg,
      color: theme.text,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "540px",
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "40px",
        }}>
          <div style={{
            fontSize: "56px",
            marginBottom: "12px",
          }}>🎭</div>
          <h1 style={{
            fontSize: "36px",
            fontWeight: 900,
            margin: "0 0 12px",
            background: "linear-gradient(135deg, #F4F1FF, rgba(193,122,255,0.8))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Mod Seçin
          </h1>
          <p style={{
            color: theme.muted,
            fontSize: "14px",
            margin: 0,
          }}>
            Hangi rolde giriş yapmak istersiniz?
          </p>
        </div>

        <div style={{
          display: "grid",
          gap: "16px",
          marginBottom: "24px",
        }}>
          {/* User Mode */}
          <div
            onClick={goUser}
            style={{
              padding: "24px",
              borderRadius: "16px",
              border: `1.5px solid ${theme.border}`,
              background: theme.panel,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(193,122,255,0.15)";
              e.currentTarget.style.borderColor = "rgba(193,122,255,0.6)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.panel;
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: "32px" }}>👤</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                Kullanıcı Modu
              </div>
              <div style={{ color: theme.muted, fontSize: "13px" }}>
                Film ve dizi listelerinizi yönetin, çarkla rastgele seçim yapın
              </div>
            </div>
          </div>

          {/* Editor Mode */}
          <div
            onClick={goEditor}
            style={{
              padding: "24px",
              borderRadius: "16px",
              border: `1.5px solid ${theme.border}`,
              background: theme.panel,
              cursor: me?.role === "EDITOR" ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
              opacity: me?.role === "EDITOR" ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (me?.role === "EDITOR") {
                e.currentTarget.style.background = "rgba(193,122,255,0.15)";
                e.currentTarget.style.borderColor = "rgba(193,122,255,0.6)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.panel;
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: "32px" }}>✏️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                Editör Modu
              </div>
              <div style={{ color: theme.muted, fontSize: "13px" }}>
                Film ve dizileri ekleyin, sisteme katkıda bulunun
              </div>
            </div>
            {me?.role !== "EDITOR" && (
              <div style={{
                fontSize: "11px",
                color: theme.muted,
                fontWeight: 600,
                background: "rgba(255,80,120,0.15)",
                padding: "4px 8px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
              }}>
                Talep gerek
              </div>
            )}
          </div>
        </div>

        {/* Request Button */}
        {me?.role !== "EDITOR" && (
          <button
            onClick={requestEditor}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: `1px solid ${theme.border2}`,
              background: "linear-gradient(135deg, rgba(193,122,255,0.3), rgba(136,84,255,0.15))",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s ease",
              marginBottom: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(193,122,255,0.45), rgba(136,84,255,0.25))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(193,122,255,0.3), rgba(136,84,255,0.15))";
            }}
          >
            Editör Olma Talebinde Bulun
          </button>
        )}

        {/* Messages */}
        {info && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: `1px solid ${info.includes("gönderildi") ? "rgba(120,255,200,0.3)" : "rgba(255,80,120,0.4)"}`,
            background: info.includes("gönderildi") ? "rgba(120,255,200,0.08)" : "rgba(255,80,120,0.1)",
            color: theme.text,
            fontSize: "13px",
            lineHeight: "1.4",
            marginBottom: "12px",
          }}>
            {info}
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: `1px solid ${theme.border}`,
            background: "transparent",
            color: theme.muted,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "14px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,80,120,0.5)";
            e.currentTarget.style.color = "rgba(255,80,120,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.muted;
          }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
