import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import { getMe } from "../api/auth";
import { theme } from "../ui/theme";
import { createTitle, getTitles, updateTitle, deleteTitle } from "../api/titles";
import type { TitleKind } from "../api/titles";

type TitleDto = {
  id: string;
  name: string;
  kind: 'MOVIE' | 'SERIES';
  description?: string;
  posterUrl?: string;
  createdAt?: string;
};

export default function Editor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"ADMIN" | "EDITOR" | "USER" | null>(null);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<TitleKind>("MOVIE");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titles, setTitles] = useState<TitleDto[]>([]);

  useEffect(() => {
    async function check() {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const userData = await getMe(token);

      if (userData.role !== "EDITOR" && userData.role !== "ADMIN") {
        navigate("/mode");
        return;
      }

      setRole(userData.role);
      setLoading(false);

      // Load titles
      try {
        const res = await getTitles("ALL");
        setTitles(res.data || []);
      } catch (e) {
        console.error('Failed to load titles:', e);
      }
    }

    check();
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleCreate() {
    setMsg(null);
    setErr(null);

    const token = getToken();
    if (!token) return navigate("/login");

    if (!name.trim()) {
      setErr("İsim boş olamaz.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update logic
        await updateTitle(token, editingId, {
          name: name.trim(),
          kind,
          description: description.trim() || undefined,
        });
        setMsg("✅ İçerik güncellendi!");
      } else {
        // Create logic
        await createTitle(token, {
          name: name.trim(),
          kind,
          description: description.trim() || undefined,
        });
        setMsg("✅ İçerik eklendi! Home çarkında görünmeli.");
      }

      // Reset form
      setName("");
      setDescription("");
      setKind("MOVIE");
      setEditingId(null);

      // Reload titles
      const res = await getTitles("ALL");
      setTitles(res.data || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  }

  function editTitle(t: TitleDto) {
    setMsg(null);
    setErr(null);
    setEditingId(t.id);
    setName(t.name);
    setKind(t.kind);
    setDescription(t.description || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setKind("MOVIE");
    setDescription("");
    setMsg(null);
    setErr(null);
  }

  async function removeTitle(id: string) {
    const token = getToken();
    if (!token) return navigate("/login");

    if (!confirm("Silmek istediğinize emin misiniz?")) return;

    try {
      await deleteTitle(token, id);
      setMsg("Başlık silindi ✅");
      const res = await getTitles("ALL");
      setTitles(res.data || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Silme başarısız.");
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      padding: 18,
      background: theme.bg,
      color: theme.text,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    } as const,
    wrap: { maxWidth: 900, margin: "0 auto", display: "grid", gap: 14 } as const,
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 18,
      border: `1px solid ${theme.border}`,
      background: theme.panel,
      boxShadow: theme.glow,
      backdropFilter: "blur(10px)",
    } as const,
    title: { margin: 0, fontSize: 24, fontWeight: 900 } as const,
    subtitle: { margin: 0, fontSize: 13, color: theme.muted } as const,
    btn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.panel2,
      color: theme.text,
      cursor: "pointer",
    } as const,
    primaryBtn: {
      padding: "12px 14px",
      borderRadius: 14,
      border: `1px solid ${theme.border2}`,
      background:
        "linear-gradient(180deg, rgba(193,122,255,0.40), rgba(136,84,255,0.18))",
      color: "#fff",
      cursor: "pointer",
      boxShadow: "0 12px 30px rgba(160, 90, 255, 0.18)",
      fontWeight: 800,
      opacity: saving ? 0.7 : 1,
    } as const,
    card: {
      padding: 16,
      borderRadius: 18,
      border: `1px solid ${theme.border}`,
      background: theme.panel,
      boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
      backdropFilter: "blur(10px)",
    } as const,
    field: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: "rgba(0,0,0,0.18)",
      color: theme.text,
      outline: "none",
    } as const,
    msgBox: (type: "ok" | "err") =>
    ({
      padding: 10,
      borderRadius: 12,
      border:
        type === "ok"
          ? "1px solid rgba(120,255,200,0.25)"
          : "1px solid rgba(255,80,120,0.35)",
      background:
        type === "ok" ? "rgba(120,255,200,0.08)" : "rgba(255,80,120,0.10)",
      fontSize: 13,
    } as const),
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as const,
    label: { fontSize: 12, color: theme.muted } as const,
  };

  if (loading) return <div style={{ padding: 20 }}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>✏️ Editör Panel</h1>
            <p style={styles.subtitle}>
              Rolün: <b>{role}</b> • Film/Dizi ekle ve yönet
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.btn} onClick={() => navigate("/home")}>
              Ana Sayfa
            </button>
            <button style={styles.btn} onClick={() => navigate("/mode")}>
              Mod
            </button>
            <button style={styles.btn} onClick={handleLogout}>
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Add/Edit Content */}
        <div style={{ ...styles.card, borderColor: editingId ? "rgba(193,122,255,0.5)" : theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, marginBottom: 10 }}>
              {editingId ? "✏️ İçerik Düzenle" : "🎬 / 📺 İçerik Ekle"}
            </h2>
            {editingId && (
              <button
                onClick={cancelEdit}
                style={{
                  fontSize: 12,
                  background: 'rgba(255,255,255,0.1)',
                  border: 0,
                  color: theme.text,
                  padding: '4px 8px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                İptal
              </button>
            )}
          </div>

          <div style={styles.row2}>
            <div>
              <div style={styles.label}>Tür</div>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as TitleKind)}
                style={styles.field}
              >
                <option value="MOVIE">Film</option>
                <option value="SERIES">Dizi</option>
              </select>
            </div>

            <div>
              <div style={styles.label}>İsim</div>
              <input
                style={styles.field}
                placeholder="Örn: Inception / Breaking Bad"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Açıklama (opsiyonel)</div>
            <textarea
              style={{ ...styles.field, height: 90, resize: "vertical" }}
              placeholder="Kısa açıklama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>



          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              style={{ ...styles.primaryBtn, flex: 1 }}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "İşleniyor..." : (editingId ? "Güncelle" : "Ekle")}
            </button>

            {editingId && (
              <button
                style={{ ...styles.btn, background: 'rgba(255,80,120,0.15)', borderColor: 'rgba(255,80,120,0.3)', color: '#ffbdce' }}
                onClick={cancelEdit}
              >
                İptal
              </button>
            )}
          </div>

          {msg && <div style={{ ...styles.msgBox("ok"), marginTop: 12 }}>{msg}</div>}
          {err && <div style={{ ...styles.msgBox("err"), marginTop: 12 }}>{err}</div>}
        </div>

        {/* All Titles */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📚 Sistemdeki Tüm İçerikler</h2>
            <div style={{
              marginLeft: 'auto',
              background: 'rgba(193,122,255,0.15)',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(193,122,255,0.9)',
            }}>
              {titles.length}
            </div>
          </div>

          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <input
              style={{ ...styles.field, background: theme.panel2, border: `1px solid ${theme.border}` }}
              placeholder="🔍 Sistemde ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {titles.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              borderRadius: 12,
              border: `1px dashed ${theme.border}`,
              background: 'rgba(0,0,0,0.2)',
              fontSize: 13,
              color: theme.muted,
            }}>
              Henüz başlık eklemediniz
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {titles.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                <div
                  key={t.id}
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    background: 'rgba(193,122,255,0.05)',
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {t.kind === 'MOVIE' ? '🎬' : '📺'} {t.name}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                        {t.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => editTitle(t)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: `1px solid rgba(193,122,255,0.3)`,
                        background: 'rgba(193,122,255,0.1)',
                        color: 'rgba(193,122,255,0.9)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeTitle(t.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: `1px solid rgba(255,80,120,0.3)`,
                        background: 'rgba(255,80,120,0.1)',
                        color: 'rgba(255,80,120,0.9)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
