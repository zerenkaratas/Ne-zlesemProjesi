import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getToken, logout } from "../utils/auth";
import { getMe } from "../api/auth";
import { updateUser } from "../api/users";
import { theme } from "../ui/theme";

type Kind = "ALL" | "MOVIE" | "SERIES";
type ListType = "WATCHED" | "CONTINUE" | "WISHLIST";

type Title = {
  id: string;
  name: string;
  kind: "MOVIE" | "SERIES";
  posterUrl?: string;
  description?: string;
};

type ListItem = {
  id: string;
  title: Title;
  createdAt: string;
};

type UserList = {
  id: string;
  type: ListType;
  items: ListItem[];
  createdAt: string;
};

function kindLabel(kind: Kind) {
  if (kind === "MOVIE") return "Film";
  if (kind === "SERIES") return "Dizi";
  return "Film+Dizi";
}

function listLabel(t: ListType) {
  if (t === "WATCHED") return "İzlediklerim";
  if (t === "CONTINUE") return "İzlemeye Devam";
  return "İstek Listem";
}

export default function Home() {
  const navigate = useNavigate();

  const [kind, setKind] = useState<Kind>("MOVIE");
  const [titles, setTitles] = useState<Title[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);
  const [selected, setSelected] = useState<Title | null>(null);

  const [me, setMe] = useState<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: 'male' | 'female';
    role: string;
  } | null>(null);

  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [info, setInfo] = useState<string | null>(null);


  // Unified Modal State
  const [activeModal, setActiveModal] = useState<'SEARCH' | 'WATCHED' | 'CONTINUE' | 'WISHLIST' | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  const [filterWatched, setFilterWatched] = useState(false);
  const [filterCont, setFilterCont] = useState(false);
  const [filterWish, setFilterWish] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);

  // Profile Edit State
  const [showProfile, setShowProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAvatar, setEditAvatar] = useState<'male' | 'female'>('male');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // 🔐 login kontrolü
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const mod = await import("../utils/auth");
        const cached = mod.getProfile();
        if (cached) {
          setMe(cached);
        } else {
          const data = await getMe(token);
          setMe(data);
        }
      } catch (e) {
        try {
          const data = await getMe(token);
          setMe(data);
        } catch (err) {
          logout();
          navigate("/login");
        }
      }
    })();
  }, [navigate]);

  function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadTitles() {
    setLoadingTitles(true);
    setInfo(null);
    try {
      // Always fetch ALL titles so client-side filtering works for everything
      const res = await api.get(`/titles?kind=ALL`);
      setTitles(res.data);
    } catch (e: any) {
      setInfo(e?.response?.data?.message ?? "Başlıklar alınamadı.");
    } finally {
      setLoadingTitles(false);
    }
  }

  async function loadLists() {
    setLoadingLists(true);
    setInfo(null);
    try {
      // Always fetch ALL lists
      const res = await api.get(`/lists?kind=ALL`, { headers: authHeaders() });
      setLists(res.data);
    } catch (e: any) {
      setInfo(e?.response?.data?.message ?? "Listeler alınamadı.");
    } finally {
      setLoadingLists(false);
    }
  }

  // filtre değişince verileri çek
  useEffect(() => {
    loadTitles();
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // sol panel için listeleri ayır
  const watched = useMemo(() => lists.find((l) => l.type === "WATCHED"), [lists]);
  const cont = useMemo(() => lists.find((l) => l.type === "CONTINUE"), [lists]);
  const wish = useMemo(() => lists.find((l) => l.type === "WISHLIST"), [lists]);

  const filteredTitles = useMemo(() => {
    // 1. Filter by Kind (Client-side)
    let pool = Array.isArray(titles) ? titles : [];
    if (kind !== 'ALL') {
      pool = pool.filter(t => t.kind === kind);
    }
    pool = pool.slice(); // Copy

    if (!filterWatched && !filterCont && !filterWish) {
      return pool;
    }

    const union = new Set<string>();
    if (filterWatched && watched) {
      (watched.items || []).forEach(i => union.add(i.title.id));
    }
    if (filterCont && cont) {
      (cont.items || []).forEach(i => union.add(i.title.id));
    }
    if (filterWish && wish) {
      (wish.items || []).forEach(i => union.add(i.title.id));
    }
    return pool.filter(t => union.has(t.id));
  }, [titles, filterWatched, filterCont, filterWish, watched, cont, wish]);

  const activeFiltersLabel = useMemo(() => {
    const parts = [kindLabel(kind)];
    const sub = [];
    if (filterWatched) sub.push("İzlediklerim");
    if (filterCont) sub.push("Devam");
    if (filterWish) sub.push("İstek");

    if (sub.length > 0) {
      return `${parts[0]} + (${sub.join(", ")})`;
    }
    return parts[0];
  }, [kind, filterWatched, filterCont, filterWish]);

  function spin() {
    setInfo(null);
    if (!filteredTitles || filteredTitles.length === 0) {
      setInfo(
        filterWatched || filterCont || filterWish
          ? "Bu filtreleme ile eşleşen içerik yok."
          : "İçerik bulunamadı."
      );
      return;
    }

    /* pool is now filteredTitles */
    const pool = filteredTitles;

    const selectedItem = pool[Math.floor(Math.random() * pool.length)];

    if (wheelRef.current) {
      const spins = 8 + Math.random() * 4;
      const selectedIndex = pool.indexOf(selectedItem);
      const rotation = spins * 360 + (selectedIndex / pool.length) * 360;
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = `rotate(0deg)`;

      setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.style.transition = "transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          wheelRef.current.style.transform = `rotate(${rotation}deg)`;
        }
        setTimeout(() => {
          setSelected(selectedItem);
        }, 2000);
      }, 50);
    } else {
      setSelected(selectedItem);
    }
  }

  async function addTo(type: ListType) {
    setInfo(null);
    if (!selected) return;

    try {
      await api.post(
        `/lists/${type}/add`,
        { titleId: selected.id },
        { headers: authHeaders() }
      );
      setInfo(`✅ "${selected.name}" → ${listLabel(type)} listesine eklendi.`);
      await loadLists();
    } catch (e: any) {
      setInfo(e?.response?.data?.message ?? "Listeye eklenemedi.");
    }
  }

  async function removeFromList(type: ListType, titleId: string) {
    try {
      await api.post(
        `/lists/${type}/remove`,
        { titleId },
        { headers: authHeaders() }
      );
      // Reload lists to update UI immediately
      await loadLists();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Listeden silinemedi.");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function openProfile() {
    if (!me) return;
    setEditFirstName(me.firstName || "");
    setEditLastName(me.lastName || "");
    setEditAvatar(me.avatar || 'male');
    setProfileMsg(null);
    setShowProfile(true);
  }

  async function handleSaveProfile() {
    if (!me) return;
    setProfileMsg(null);
    const token = getToken();
    if (!token) return navigate("/login");

    try {
      await updateUser(token, me.userId, {
        firstName: editFirstName,
        lastName: editLastName,
        avatar: editAvatar,
      });

      // Update local state
      setMe({
        ...me,
        firstName: editFirstName,
        lastName: editLastName,
        avatar: editAvatar,
      });

      setProfileMsg("✅ Profil güncellendi!");
      setTimeout(() => setShowProfile(false), 1500);
    } catch (e) {
      setProfileMsg("Güncelleme başarısız.");
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      background: theme.bg,
      color: theme.text,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    } as const,
    content: { display: 'flex', flex: 1 },
    sidebar: {
      width: 320,
      padding: 18,
      borderRight: "1px solid rgba(255,255,255,0.08)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
      backdropFilter: "blur(10px)",
    } as const,
    card: {
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      padding: 14,
      background: "rgba(255,255,255,0.05)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    } as const,
    pillRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
    pill: (active: boolean) =>
    ({
      padding: "8px 12px",
      borderRadius: 999,
      border: `1px solid ${active ? "rgba(193,122,255,0.8)" : "rgba(255,255,255,0.12)"}`,
      background: active ? "rgba(193,122,255,0.18)" : "rgba(255,255,255,0.04)",
      color: "#f4f1ff",
      cursor: "pointer",
    } as const),
    main: { flex: 1, padding: 22 } as const,
    header: {
      padding: '14px 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderBottom: `1px solid ${theme.border}`,
      background: 'transparent',
    } as const,
    profileCircle: {
      width: 48,
      height: 48,
      borderRadius: 999,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${theme.border}`,
    } as const,
    profileName: { fontSize: 14, fontWeight: 700 } as const,
    h1: { fontSize: 28, margin: 0, letterSpacing: 0.2 } as const,
    h2: { fontSize: 18, margin: "14px 0 10px" } as const,
    small: { opacity: 0.8, fontSize: 13 } as const,
    btn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
      color: "#f4f1ff",
      cursor: "pointer",
    } as const,
    primaryBtn: {
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(193,122,255,0.65)",
      background: "linear-gradient(180deg, rgba(193,122,255,0.35), rgba(136,84,255,0.18))",
      color: "#fff",
      cursor: "pointer",
      boxShadow: "0 12px 30px rgba(160, 90, 255, 0.18)",
    } as const,
    listItemBtn: {
      width: "100%",
      textAlign: "left" as const,
      padding: "10px 10px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.10)",
      color: "#f4f1ff",
      cursor: "pointer",
    } as const,
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 20 }}>🎡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Ne İzlesem?</div>
            <div style={{ color: theme.muted, fontSize: 12 }}>{kindLabel(kind)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {me && (
            <>
              <div style={{ textAlign: 'right', marginRight: 8 }}>
                <div style={styles.profileName}>{me.firstName ? `${me.firstName} ${me.lastName || ''}` : me.username}</div>
                <div style={{ fontSize: 12, color: theme.muted }}>{me.role}</div>
              </div>
              <div
                style={{ ...styles.profileCircle, cursor: 'pointer' }}
                title="Profili Düzenle"
                onClick={openProfile}
              >
                <div style={{ fontSize: 20 }}>{me.avatar === 'male' ? '👨' : '👩'}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  ...styles.btn,
                  padding: '8px 12px',
                  fontSize: 13,
                  background: 'rgba(255,80,120,0.15)',
                  borderColor: 'rgba(255,80,120,0.3)',
                  color: '#ffbdce',
                  marginLeft: 8
                }}
              >
                Çıkış
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* SOL PANEL */}
        <aside style={styles.sidebar}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
            <div>
              <h3 style={styles.h1}>Listeler</h3>
              <div style={styles.small}>Filtre: <b>{kindLabel(kind)}</b></div>
            </div>
            <button style={styles.btn} onClick={() => navigate("/mode")}>Mod</button>
          </div>

          <div style={{ marginTop: 14, ...styles.card }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Filtre</div>
            <div style={styles.pillRow}>
              <button style={styles.pill(kind === "ALL")} onClick={() => setKind("ALL")}>Film+Dizi</button>
              <button style={styles.pill(kind === "MOVIE")} onClick={() => setKind("MOVIE")}>Film</button>
              <button style={styles.pill(kind === "SERIES")} onClick={() => setKind("SERIES")}>Dizi</button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: theme.muted, fontSize: 13 }}>
                <input type="checkbox" checked={filterWatched} onChange={(e) => setFilterWatched(e.target.checked)} />
                İzlediklerim
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: theme.muted, fontSize: 13 }}>
                <input type="checkbox" checked={filterCont} onChange={(e) => setFilterCont(e.target.checked)} />
                İzlemeye Devam
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: theme.muted, fontSize: 13 }}>
                <input type="checkbox" checked={filterWish} onChange={(e) => setFilterWish(e.target.checked)} />
                İzleyeceklerim
              </label>
            </div>
          </div>



          <div style={{ marginTop: 14, ...styles.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>İzlediklerim</div>
              <div style={styles.small}>{watched?.items?.length ?? 0}</div>
            </div>
            <button
              style={{ ...styles.btn, width: '100%', textAlign: 'center' }}
              onClick={() => {
                setModalSearch("");
                setActiveModal('WATCHED');
              }}
            >
              Görüntüle
            </button>
          </div>

          <div style={{ marginTop: 14, ...styles.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Devam Ettiklerim</div>
              <div style={styles.small}>{cont?.items?.length ?? 0}</div>
            </div>
            <button
              style={{ ...styles.btn, width: '100%', textAlign: 'center' }}
              onClick={() => {
                setModalSearch("");
                setActiveModal('CONTINUE');
              }}
            >
              Görüntüle
            </button>
          </div>

          <div style={{ marginTop: 14, ...styles.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>İzleyeceklerim</div>
              <div style={styles.small}>{wish?.items?.length ?? 0}</div>
            </div>
            <button
              style={{ ...styles.btn, width: '100%', textAlign: 'center' }}
              onClick={() => {
                setModalSearch("");
                setActiveModal('WISHLIST');
              }}
            >
              Görüntüle
            </button>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <button
                style={{ ...styles.btn, background: "rgba(193,122,255,0.15)", border: "1px solid rgba(193,122,255,0.4)" }}
                onClick={() => {
                  setModalSearch("");
                  setActiveModal('SEARCH');
                }}
              >
                🔍 Bütün Dizi/Filmler
              </button>
              {(loadingLists || loadingTitles) && (
                <div style={styles.small}>Yükleniyor…</div>
              )}
            </div>
            {(loadingLists || loadingTitles) && (
              <div style={styles.small}>Yükleniyor…</div>
            )}
          </div>
        </aside>

        {/* ANA ALAN */}
        <main style={styles.main}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={styles.h1}>🎡 Ne İzlesem?</h1>
              <div style={styles.h1}>
                Çarkı çevir, ne izleyeceğini seç!
              </div>
            </div>
            {/* Removed duplicate spin button */}
          </div>

          {info && (
            <div style={{ marginTop: 14, ...styles.card, borderColor: "rgba(193,122,255,0.25)" }}>
              {info}
            </div>
          )}

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            {/* Seçilen kart */}
            <div style={{ ...styles.card, minHeight: 220 }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                Seçili filtre: <b>{activeFiltersLabel}</b> • İlgili içerik: <b>{filteredTitles.length}</b>
              </div>

              {!selected ? (
                <div style={{ marginTop: 22, opacity: 0.85 }}>
                  Çarkı çevir veya soldaki listelerden bir içerik seç.
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
                    {selected.name}
                  </div>
                  <div style={{ marginTop: 8, opacity: 0.9 }}>
                    {selected.kind === "MOVIE" ? "🎬 Film" : "📺 Dizi"}
                  </div>

                  {selected.description && (
                    <div style={{ marginTop: 10, opacity: 0.85 }}>
                      {selected.description}
                    </div>
                  )}

                  <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={styles.btn} onClick={() => addTo("WATCHED")}>İzlediklerime ekle</button>
                    <button style={styles.btn} onClick={() => addTo("CONTINUE")}>İzlemeye devam ettiklerime ekle</button>
                    <button style={styles.btn} onClick={() => addTo("WISHLIST")}>İzleyeceklerime ekle</button>
                  </div>
                </div>
              )}
            </div>

            {/* SPINNER WHEEL */}
            <div style={{ ...styles.card, minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ fontSize: 28, color: "rgba(193,122,255,0.8)" }}>▼</div>
              <div
                ref={wheelRef}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: "conic-gradient(from 0deg, #c17aff 0deg 60deg, #9d5eff 60deg 120deg, #7b42f6 120deg 180deg, #6b3dd4 180deg 240deg, #c17aff 240deg 300deg, #9d5eff 300deg 360deg)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 12px 40px rgba(193,122,255,0.3), inset 0 0 25px rgba(0,0,0,0.3)",
                  border: "4px solid rgba(193,122,255,0.6)",
                  transformOrigin: "center",
                } as React.CSSProperties}
              >
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg, #1a1625, #0f0a15)", display: "grid", placeItems: "center", boxShadow: "0 6px 15px rgba(0,0,0,0.5)", border: "2px solid rgba(193,122,255,0.8)", fontWeight: 800, fontSize: 18 }}>
                  🎡
                </div>
              </div>
              <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={spin} disabled={loadingTitles}>
                Çarkı Çevir
              </button>
            </div>
          </div>

          {/* TÜM İÇERİK LİSTESİ */}
          <div style={{ marginTop: 16, ...styles.card }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>Filmler/Diziler ({filteredTitles.length})</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, maxHeight: 400, overflowY: "auto" }}>
              {filteredTitles.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: selected?.id === t.id ? "2px solid rgba(193,122,255,0.8)" : "1px solid rgba(255,255,255,0.12)",
                    background: selected?.id === t.id ? "rgba(193,122,255,0.15)" : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                  onClick={() => setSelected(t)}
                >
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{t.kind === "MOVIE" ? "🎬" : "📺"}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, wordBreak: "break-word" }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      {/* PROFILE MODAL OVERLAY */}
      {showProfile && (
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
            <h2 style={{ ...styles.h1, fontSize: 22, marginBottom: 16 }}>Profili Düzenle</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={styles.small}>Ad</div>
                <input
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                />
              </div>
              <div>
                <div style={styles.small}>Soyad</div>
                <input
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${theme.border}`, background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                />
              </div>
              <div>
                <div style={styles.small}>Avatar</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    onClick={() => setEditAvatar('male')}
                    style={{ ...styles.btn, background: editAvatar === 'male' ? 'rgba(193,122,255,0.25)' : 'rgba(255,255,255,0.05)', border: editAvatar === 'male' ? '1px solid rgba(193,122,255,0.6)' : styles.btn.border }}
                  >
                    👨 Erkek
                  </button>
                  <button
                    onClick={() => setEditAvatar('female')}
                    style={{ ...styles.btn, background: editAvatar === 'female' ? 'rgba(193,122,255,0.25)' : 'rgba(255,255,255,0.05)', border: editAvatar === 'female' ? '1px solid rgba(193,122,255,0.6)' : styles.btn.border }}
                  >
                    👩 Kadın
                  </button>
                </div>
              </div>
            </div>

            {profileMsg && (
              <div style={{ marginTop: 12, padding: 10, background: 'rgba(120,255,200,0.15)', borderRadius: 10, color: '#aaffaa', fontSize: 14 }}>
                {profileMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button style={styles.btn} onClick={() => setShowProfile(false)}>İptal</button>
              <button style={styles.primaryBtn} onClick={handleSaveProfile}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED CONTENT MODAL */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40
        }}>
          <div style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
            <button
              onClick={() => setActiveModal(null)}
              style={{ position: 'absolute', right: -40, top: 0, background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}
            >✕</button>
            <h2 style={{ ...styles.h1, textAlign: 'center', marginBottom: 20 }}>
              {activeModal === 'SEARCH' && "Bütün Dizi/Filmler"}
              {activeModal === 'WATCHED' && "İzlediklerim"}
              {activeModal === 'CONTINUE' && "İzlemeye Devam Ettiklerim"}
              {activeModal === 'WISHLIST' && "İzleyeceklerim"}
            </h2>

            <input
              style={{
                width: '100%', padding: 16, fontSize: 18,
                borderRadius: 16, border: `1px solid ${theme.border}`,
                background: 'rgba(255,255,255,0.1)', color: 'white',
                outline: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }}
              placeholder="İçerik ara..."
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{
            marginTop: 40, width: '100%', maxWidth: 800,
            display: 'flex', flexDirection: 'column', gap: 10,
            overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', paddingBottom: 40
          }}>
            {(() => {
              let source: Title[] = [];
              if (activeModal === 'SEARCH') source = titles;
              else if (activeModal === 'WATCHED') source = (watched?.items || []).map(i => i.title);
              else if (activeModal === 'CONTINUE') source = (cont?.items || []).map(i => i.title);
              else if (activeModal === 'WISHLIST') source = (wish?.items || []).map(i => i.title);

              return source
                .filter(t => !modalSearch || t.name.toLowerCase().includes(modalSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      background: 'rgba(20,20,20,0.85)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: 10,
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, cursor: 'pointer' }}
                      onClick={() => {
                        setSelected(t);
                        setActiveModal(null);
                      }}
                    >
                      {t.posterUrl ? (
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: `url(${t.posterUrl}) center/cover`, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.1)', fontSize: 24, flexShrink: 0 }}>
                          {t.kind === 'MOVIE' ? '🎬' : '📺'}
                        </div>
                      )}
                      <div style={{ color: 'white' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{t.name}</div>
                        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>{t.kind === 'MOVIE' ? 'Film' : 'Dizi'}</div>
                      </div>
                    </div>

                    {/* Remove Button - Only for lists, not general search */}
                    {activeModal !== 'SEARCH' && (
                      <button
                        title="Listeden Kaldır"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Listeden kaldırmak istediğinize emin misiniz?")) return;
                          await removeFromList(activeModal as any, t.id);
                        }}
                        style={{
                          background: 'rgba(255,80,120,0.15)',
                          border: '1px solid rgba(255,80,120,0.3)',
                          color: '#ffbdce',
                          width: 36, height: 36,
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'grid', placeItems: 'center',
                          fontSize: 18,
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ));
            })()}
            {/* Empty state handled roughly by source length, but let's keep it simple */}
          </div>
        </div>
      )}
    </div>
  );
}

