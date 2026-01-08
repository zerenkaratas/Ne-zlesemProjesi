import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getToken, logout } from "../utils/auth";
import { getMe } from "../api/auth";
import { theme } from "../ui/theme";

type ReqStatus = "PENDING" | "APPROVED" | "REJECTED";

type UserDto = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: 'male' | 'female';
  role: "ADMIN" | "EDITOR" | "USER";
};

type EditorRequestDto = {
  id: string;
  requestedBy: UserDto;
  reviewedBy: UserDto | null;
  status: ReqStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Admin() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EditorRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [me, setMe] = useState<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: 'male' | 'female';
    role: string;
  } | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [editRole, setEditRole] = useState("USER");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAvatar, setEditAvatar] = useState<'male' | 'female'>('male');

  async function loadRequests() {
    setMsg(null);
    const token = getToken();
    if (!token) return navigate("/login");

    try {
      // ✅ SENİN BACKEND: GET /admin/requests
      const res = await api.get("/admin/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Talepler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setMsg(null);
    const token = getToken();
    if (!token) return navigate('/login');
    try {
      const res = await import('../api/users');
      const r = await res.getUsers(token);
      setUsers(r.data);
      setShowUsers(true);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? 'Kullanıcılar yüklenemedi.');
    }
  }

  function editUser(u: UserDto) {
    setEditingUser(u);
    setEditRole(u.role);
    setEditFirstName(u.firstName || "");
    setEditLastName(u.lastName || "");
    setEditAvatar(u.avatar || 'male');
    setMsg(null);
  }

  async function handleSaveUser() {
    if (!editingUser) return;
    const token = getToken();
    if (!token) return navigate('/login');

    try {
      const mod = await import('../api/users');
      await mod.updateUser(token, editingUser.id, {
        role: editRole,
        firstName: editFirstName,
        lastName: editLastName,
        avatar: editAvatar
      });
      setMsg(`✅ ${editingUser.username} güncellendi`);
      setEditingUser(null);
      await loadUsers();
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? 'Güncelleme başarısız');
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) navigate("/login");
    else loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const t = getToken();
    if (!t) return;

    (async () => {
      try {
        const mod = await import("../utils/auth");
        const cached = mod.getProfile();
        if (cached) setMe(cached as any);
        else {
          const d = await getMe(t);
          setMe(d);
        }
      } catch (e) {
        try {
          const d = await getMe(t);
          setMe(d);
        } catch { }
      }
    })();
  }, []);

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    getMe(t).then((d) => setMe(d)).catch(() => { });
  }, []);

  async function approve(id: string) {
    setMsg(null);
    const token = getToken();
    if (!token) return navigate("/login");

    try {
      // ✅ SENİN BACKEND: POST /admin/requests/:id/approve
      await api.post(
        `/admin/requests/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg("Talep onaylandı ✅");
      await loadRequests();
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Onay başarısız.");
    }
  }

  async function reject(id: string) {
    setMsg(null);
    const token = getToken();
    if (!token) return navigate("/login");

    const reason = prompt("Ret sebebi (opsiyonel):") ?? "";

    try {
      // ✅ SENİN BACKEND: POST /admin/requests/:id/reject
      await api.post(
        `/admin/requests/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg("Talep reddedildi ❌");
      await loadRequests();
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Ret başarısız.");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) return <div style={{ padding: 20 }}>Yükleniyor...</div>;

  return (
    <div style={{
      minHeight: "100vh",
      padding: "24px 20px",
      background: theme.bg,
      color: theme.text,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          paddingBottom: "20px",
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div>
            <h1 style={{
              fontSize: "32px",
              fontWeight: 900,
              margin: "0 0 4px",
              background: "linear-gradient(135deg, #F4F1FF, rgba(193,122,255,0.8))",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              👑 Admin Panel
            </h1>
            <p style={{
              margin: 0,
              color: theme.muted,
              fontSize: "14px",
            }}>
              Editör taleplerini yönet
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {me && (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{me.firstName ? `${me.firstName} ${me.lastName || ''}` : me.username}</div>
                  <div style={{ fontSize: 12, color: theme.muted }}>{me.role}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 999, display: 'grid', placeItems: 'center', border: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.04)' }}>{me.avatar === 'male' ? '👨' : '👩'}</div>
              </>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.muted,
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "13px",
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

        {/* Messages */}
        {msg && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: `1px solid ${msg.includes("onaylandı") ? "rgba(120,255,200,0.3)" : msg.includes("reddedildi") ? "rgba(255,80,120,0.4)" : "rgba(193,122,255,0.3)"}`,
            background: msg.includes("onaylandı") ? "rgba(120,255,200,0.08)" : msg.includes("reddedildi") ? "rgba(255,80,120,0.1)" : "rgba(193,122,255,0.08)",
            color: theme.text,
            fontSize: "13px",
            lineHeight: "1.5",
            marginBottom: "20px",
          }}>
            {msg}
          </div>
        )}

        {/* Requests Section */}
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "20px" }}>📋</div>
            <h2 style={{
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
            }}>
              Editör Olma Talepleri
            </h2>
            <div style={{
              marginLeft: "auto",
              background: "rgba(193,122,255,0.15)",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(193,122,255,0.9)",
            }}>
              {requests.length}
            </div>
          </div>

          {requests.length === 0 ? (
            <div style={{
              padding: "40px 24px",
              textAlign: "center",
              borderRadius: "16px",
              border: `1.5px dashed ${theme.border}`,
              background: "rgba(0,0,0,0.2)",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
              <p style={{
                margin: 0,
                color: theme.muted,
                fontSize: "14px",
              }}>
                Henüz talep yok
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    borderRadius: "14px",
                    border: `1px solid ${theme.border}`,
                    background: theme.panel,
                    padding: "20px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(193,122,255,0.4)";
                    e.currentTarget.style.background = "rgba(193,122,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.background = theme.panel;
                  }}
                >
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "16px",
                    marginBottom: "16px",
                  }}>
                    <div>
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          marginBottom: "2px",
                        }}>
                          {r.requestedBy.username}
                        </div>
                        <div style={{
                          color: theme.muted,
                          fontSize: "12px",
                        }}>
                          {r.requestedBy.email}
                        </div>
                      </div>
                      {r.rejectReason && (
                        <div style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "rgba(255,80,120,0.1)",
                          border: "1px solid rgba(255,80,120,0.2)",
                          marginTop: "8px",
                        }}>
                          <div style={{
                            fontSize: "11px",
                            color: "rgba(255,80,120,0.8)",
                            fontWeight: 600,
                            marginBottom: "2px",
                          }}>
                            Ret Sebebi
                          </div>
                          <div style={{
                            fontSize: "12px",
                            color: theme.muted,
                          }}>
                            {r.rejectReason}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}>
                      <div style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: r.status === "PENDING" ? "rgba(193,122,255,0.15)" : r.status === "APPROVED" ? "rgba(120,255,200,0.15)" : "rgba(255,80,120,0.15)",
                        color: r.status === "PENDING" ? "rgba(193,122,255,0.9)" : r.status === "APPROVED" ? "rgba(120,255,200,0.9)" : "rgba(255,80,120,0.9)",
                      }}>
                        {r.status === "PENDING" ? "⏳ Beklemede" : r.status === "APPROVED" ? "✅ Onaylandı" : "❌ Reddedildi"}
                      </div>
                    </div>
                  </div>

                  {r.status === "PENDING" && (
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      paddingTop: "16px",
                      borderTop: `1px solid ${theme.border}`,
                    }}>
                      <button
                        onClick={() => approve(r.id)}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "1px solid rgba(120,255,200,0.3)",
                          background: "rgba(120,255,200,0.1)",
                          color: "rgba(120,255,200,0.9)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "13px",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(120,255,200,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(120,255,200,0.1)";
                        }}
                      >
                        ✅ Onayla
                      </button>
                      <button
                        onClick={() => reject(r.id)}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,80,120,0.3)",
                          background: "rgba(255,80,120,0.1)",
                          color: "rgba(255,80,120,0.9)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "13px",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,80,120,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,80,120,0.1)";
                        }}
                      >
                        ❌ Reddet
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users management */}
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>👥 Kullanıcılar</h2>
            <button onClick={loadUsers} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted }}>Yükle</button>
          </div>

          {showUsers && users && (
            <div style={{ display: 'grid', gap: 12 }}>
              {users.map(u => (
                <div key={u.id} style={{ padding: 12, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>{u.email}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>Role: {u.role}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => editUser(u)} style={{ padding: '8px 10px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted }}>Düzenle</button>
                    <button
                      onClick={async () => {
                        if (confirm(`${u.username} kullanıcısını silmek istediğinize emin misiniz?`)) {
                          try {
                            const mod = await import('../api/users');
                            const t = getToken();
                            if (t) {
                              await mod.deleteUser(t, u.id);
                              setMsg(`✅ ${u.username} silindi.`);
                              loadUsers();
                            }
                          } catch (e: any) {
                            setMsg(e?.response?.data?.message ?? 'Silme başarısız.');
                          }
                        }
                      }}
                      style={{ padding: '8px 10px', borderRadius: 10, border: `1px solid rgba(255,80,120,0.3)`, background: 'rgba(255,80,120,0.1)', color: 'rgba(255,80,120,0.8)', cursor: 'pointer' }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'grid', placeItems: 'center'
        }}>
          <div style={{
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            padding: 24,
            borderRadius: 20,
            width: 400,
            maxWidth: '90%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: 22, margin: "0 0 16px" }}>Kullanıcı Düzenle</h2>
            <div style={{ marginBottom: 16, fontSize: 13, color: theme.muted }}>
              <b>{editingUser.username}</b> ({editingUser.email})
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Rol</div>
                <select
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                >
                  <option value="USER">USER</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Ad</div>
                <input
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Soyad</div>
                <input
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Avatar</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setEditAvatar('male')}
                    style={{
                      flex: 1, padding: 10, borderRadius: 10, cursor: 'pointer',
                      background: editAvatar === 'male' ? 'rgba(193,122,255,0.25)' : 'rgba(255,255,255,0.05)',
                      border: editAvatar === 'male' ? '1px solid rgba(193,122,255,0.6)' : `1px solid ${theme.border}`,
                      color: 'white'
                    }}
                  >
                    👨 Erkek
                  </button>
                  <button
                    onClick={() => setEditAvatar('female')}
                    style={{
                      flex: 1, padding: 10, borderRadius: 10, cursor: 'pointer',
                      background: editAvatar === 'female' ? 'rgba(193,122,255,0.25)' : 'rgba(255,255,255,0.05)',
                      border: editAvatar === 'female' ? '1px solid rgba(193,122,255,0.6)' : `1px solid ${theme.border}`,
                      color: 'white'
                    }}
                  >
                    👩 Kadın
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer" }}
                onClick={() => setEditingUser(null)}
              >
                İptal
              </button>
              <button
                style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(193,122,255,0.6)", background: "rgba(193,122,255,0.2)", color: "white", cursor: "pointer", fontWeight: 600 }}
                onClick={handleSaveUser}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
