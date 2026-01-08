import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, login, register } from "../api/auth";
import { setProfile, setToken } from "../utils/auth";
import { theme } from "../ui/theme";

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // login
  const [loginValue, setLoginValue] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // register
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAvatar, setRegAvatar] = useState<"male" | "female">("female");

  async function goByRole(token: string) {
    const me = await getMe(token);
    setProfile(me);
    setToken(token);
    if (me.role === "ADMIN") navigate("/admin", { replace: true });
    else navigate("/mode", { replace: true });
  }

  async function handleLogin() {
    setError(null);
    setSuccess(null);
    try {
      const { access_token } = await login(loginValue, loginPassword);
      await goByRole(access_token);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Giriş başarısız");
    }
  }

  async function handleRegister() {
    setError(null);
    setSuccess(null);
    try {
      await register(regUsername, regEmail, regPassword, regFirstName, regLastName, regAvatar);
      setSuccess("Hesap oluşturuldu. Şimdi giriş yapabilirsin.");
      setMode("login");
      setLoginValue(regEmail);
      setLoginPassword("");
      setRegFirstName("");
      setRegLastName("");
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setRegAvatar("female");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Kayıt başarısız");
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 18,
      background: theme.bg,
      color: theme.text,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    } as const,
    card: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 18,
      border: `1px solid ${theme.border}`,
      background: theme.panel,
      boxShadow: theme.glow,
      padding: 18,
      backdropFilter: "blur(10px)",
    } as const,
    brand: {
      display: "grid",
      gap: 6,
      marginBottom: 12,
    } as const,
    title: { fontSize: 26, fontWeight: 900, letterSpacing: 0.2, margin: 0 } as const,
    subtitle: { margin: 0, color: theme.muted, fontSize: 13 } as const,
    tabs: { display: "flex", gap: 10, marginTop: 10 } as const,
    tab: (active: boolean) =>
    ({
      flex: 1,
      padding: "10px 12px",
      borderRadius: 12,
      border: `1px solid ${active ? theme.border2 : theme.border}`,
      background: active ? "rgba(193,122,255,0.16)" : theme.panel2,
      color: theme.text,
      cursor: "pointer",
    } as const),
    field: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: "rgba(0,0,0,0.18)",
      color: theme.text,
      outline: "none",
    } as const,
    btn: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 14,
      border: `1px solid ${theme.border2}`,
      background:
        "linear-gradient(180deg, rgba(193,122,255,0.40), rgba(136,84,255,0.18))",
      color: "#fff",
      cursor: "pointer",
      boxShadow: "0 12px 30px rgba(160, 90, 255, 0.18)",
      fontWeight: 800,
      letterSpacing: 0.2,
    } as const,
    msg: (kind: "error" | "success") =>
    ({
      padding: 10,
      borderRadius: 12,
      border:
        kind === "error"
          ? "1px solid rgba(255,80,120,0.35)"
          : "1px solid rgba(120,255,200,0.25)",
      background:
        kind === "error"
          ? "rgba(255,80,120,0.10)"
          : "rgba(120,255,200,0.08)",
      color: theme.text,
      fontSize: 13,
    } as const),
    row: { display: "grid", gap: 10, marginTop: 12 } as const,
    hint: { color: theme.muted, fontSize: 12, marginTop: 10 } as const,
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <h1 style={styles.title}>Ne İzlesem?</h1>
          <p style={styles.subtitle}>
            Film & dizi önerileri • Çark ile rastgele seçim • Listelerini yönet
          </p>
        </div>

        <div style={styles.tabs}>
          <button
            style={styles.tab(mode === "login")}
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccess(null);
            }}
          >
            Giriş
          </button>
          <button
            style={styles.tab(mode === "register")}
            onClick={() => {
              setMode("register");
              setError(null);
              setSuccess(null);
            }}
          >
            Yeni Hesap
          </button>
        </div>

        <div style={styles.row}>
          {mode === "login" ? (
            <>
              <input
                style={styles.field}
                placeholder="Kullanıcı adı veya e-posta"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
              />
              <input
                style={styles.field}
                type="password"
                placeholder="Şifre"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button style={styles.btn} onClick={handleLogin}>
                Giriş Yap
              </button>

            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "12px", color: theme.muted, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Avatar Seçin
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: 12,
                      border: `2px solid ${regAvatar === "female" ? "rgba(193,122,255,0.6)" : theme.border}`,
                      background: regAvatar === "female" ? "rgba(193,122,255,0.15)" : "rgba(0,0,0,0.15)",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      gap: 6,
                    }}
                    onClick={() => setRegAvatar("female")}
                  >
                    <div style={{ fontSize: "28px" }}>👩</div>
                    <div style={{ fontSize: "11px", color: theme.muted }}>Kadın</div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: 12,
                      border: `2px solid ${regAvatar === "male" ? "rgba(193,122,255,0.6)" : theme.border}`,
                      background: regAvatar === "male" ? "rgba(193,122,255,0.15)" : "rgba(0,0,0,0.15)",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      gap: 6,
                    }}
                    onClick={() => setRegAvatar("male")}
                  >
                    <div style={{ fontSize: "28px" }}>👨</div>
                    <div style={{ fontSize: "11px", color: theme.muted }}>Erkek</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  style={styles.field}
                  placeholder="İsim"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                />
                <input
                  style={styles.field}
                  placeholder="Soyisim"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                />
              </div>
              <input
                style={styles.field}
                placeholder="Kullanıcı adı"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              <input
                style={styles.field}
                placeholder="E-posta"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <input
                style={styles.field}
                type="password"
                placeholder="Şifre (en az 6 karakter)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <button style={styles.btn} onClick={handleRegister}>
                Hesap Oluştur
              </button>
              <div style={styles.hint}>
                Avatar seçin ve tüm bilgilerinizi doldurun.
              </div>
            </>
          )}

          {error && <div style={styles.msg("error")}>{error}</div>}
          {success && <div style={styles.msg("success")}>{success}</div>}
        </div>
      </div>
    </div>
  );
}
