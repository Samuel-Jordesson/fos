"use client";
import { useEffect, useRef, useState } from "react";
import CallView from "./call";

const ADJ = ["Feliz","Veloz","Sábio","Ninja","Cósmico","Tímido","Bravo","Sereno","Elétrico","Curioso"];
const ANI = ["Pinguim","Tatu","Capivara","Lobo","Falcão","Jabuti","Panda","Raposa","Tucano","Gato"];
function guestName() {
  let n = null;
  try { n = localStorage.getItem("guestName"); } catch {}
  if (!n) {
    n = `${ANI[Math.random()*ANI.length|0]} ${ADJ[Math.random()*ADJ.length|0]} ${Math.random()*900+100|0}`;
    try { localStorage.setItem("guestName", n); } catch {}
  }
  return n;
}
const api = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...opts.headers }, body: opts.body && JSON.stringify(opts.body) })
    .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Erro"); return d; });


const I = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const Icons = {
  logo: <I size={18} d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />,
  search: <I size={14} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />,
  plus: <I d={<path d="M12 5v14M5 12h14" />} />,
  hash: <I size={15} d={<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />} />,
  trash: <I size={14} d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>} />,
  back: <I d={<path d="m15 18-6-6 6-6" />} />,
  send: <I size={15} d={<><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>} />,
  logout: <I size={15} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>} />,
  palette: <I d={<><circle cx="13.5" cy="6.5" r="1.2" /><circle cx="17.5" cy="10.5" r="1.2" /><circle cx="8.5" cy="7.5" r="1.2" /><circle cx="6.5" cy="12.5" r="1.2" /><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.9-4.5-8.6-10-8.6z" /></>} />,
  check: <I size={14} d={<path d="M20 6 9 17l-5-5" />} />,
  clip: <I d={<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />} />,
  x: <I size={18} d={<path d="M18 6 6 18M6 6l12 12" />} />,
  link: <I size={13} d={<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>} />,
  lock: <I size={15} d={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />,
  eyeOff: <I size={13} d={<><path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>} />,
  gear: <I d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>} />,
  key: <I d={<><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" /></>} />,
  copy: <I size={14} d={<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>} />,
  refresh: <I size={14} d={<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>} />,
  video: <I size={15} d={<><path d="m22 8-6 4 6 4V8z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>} />,
  phone: <I size={15} d={<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" />} />,
  users: <I size={12} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>} />,
  heart: <I size={15} d={<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />} />,
  heartFill: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" /></svg>,
  reply: <I size={15} d={<><path d="M9 17 4 12l5-5" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></>} />,
  image: <I size={15} d={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>} />,
  chat: <I size={28} d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />,
};
const THEMES = [
  ["dark", "Escuro", "#0a0a0a"], ["light", "Claro", "#ffffff"], ["blue", "Azul", "#4c7dff"],
  ["pink", "Rosa", "#e64f8b"], ["whatsapp", "WhatsApp", "#00a884"], ["retro", "Retrô 2000", "linear-gradient(135deg,#0a246a,#d4d0c8)"],
];
function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const ref = useRef(null);
  useEffect(() => { try { setTheme(localStorage.getItem("theme") || "dark"); } catch {} }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const pick = (t) => {
    setTheme(t); setOpen(false);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
  };
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn" title="Tema" onClick={() => setOpen(!open)}>{Icons.palette}</button>
      {open && (
        <div className="menu">
          {THEMES.map(([id, label, color]) => (
            <button key={id} className={theme === id ? "on" : ""} onClick={() => pick(id)}>
              <span className="sw" style={{ background: color }} />{label}
              {theme === id && <span className="ck">{Icons.check}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?"')\]])/g;
const ytId = (u) => u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)?.[1];
const isImg = (u) => /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(u);
const isVid = (u) => /\.(mp4|webm|mov)(\?.*)?$/i.test(u);

function Linkify({ text }) {
  return text.split(URL_RE).map((part, i) =>
    i % 2 ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part);
}

function LinkPreview({ url, onOpen }) {
  const [data, setData] = useState(null);
  const yt = ytId(url);
  useEffect(() => {
    if (yt || isImg(url) || isVid(url)) return;
    let ok = true;
    fetch(`/api/preview?url=${encodeURIComponent(url)}`).then((r) => r.json()).then((d) => ok && setData(d)).catch(() => {});
    return () => { ok = false; };
  }, [url]);
  if (yt) return <div className="embed yt"><iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /></div>;
  if (isImg(url)) return <img className="media" src={url} alt="" loading="lazy" onClick={() => onOpen({ type: "image", src: url })} />;
  if (isVid(url)) return <video className="media" src={url} controls preload="metadata" />;
  if (!data?.title) return null;
  return (
    <a className="card" href={url} target="_blank" rel="noopener noreferrer">
      {data.image && <img src={data.image} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />}
      <div className="card-txt">
        <small>{Icons.link}{data.site}</small>
        <b>{data.title}</b>
        {data.description && <p>{data.description}</p>}
      </div>
    </a>
  );
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="icon-btn lb-close" onClick={onClose}>{Icons.x}</button>
      {item.type === "image"
        ? <img src={item.src} alt="" onClick={(e) => e.stopPropagation()} />
        : <video src={item.src} controls autoPlay onClick={(e) => e.stopPropagation()} />}
      <a className="lb-open" href={item.src} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Abrir original</a>
    </div>
  );
}

// reduz imagens grandes antes de enviar (gif fica como está pra manter animação)
async function compress(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 600 * 1024) return file;
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.85));
  return blob && blob.size < file.size ? blob : file;
}

const COLORS = ["#ededed","#a1e3c4","#f5c8a0","#b9c6ff","#f2b8d4","#d9e3a1","#a8dcef"];
const colorOf = (n) => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export default function Home() {
  const [user, setUser] = useState(null);
  const [guest, setGuest] = useState("");
  const [rooms, setRooms] = useState([]);
  const [q, setQ] = useState("");
  const [room, setRoomState] = useState(null);
  const [roomKey, setRoomKey] = useState(null);
  const setRoom = (r, key = null) => {
    setRoomState(r); setRoomKey(key); setCallStatus(null);
    setInCall(r?.kind === "call" ? { kind: "video" } : null); // sala de chamada já entra direto
  };
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [modal, setModal] = useState(null); // "login" | "register" | "room" | "code" | "edit"
  const [codeFor, setCodeFor] = useState(null); // sala privada pedindo código
  const [lightbox, setLightbox] = useState(null);
  const [inCall, setInCall] = useState(null); // { kind } quando estou na ligação
  const [callStatus, setCallStatus] = useState(null); // ligação rolando na sala
  const [dismissed, setDismissed] = useState(() => new Set());
  const [likes, setLikes] = useState({});
  const [ctx, setCtx] = useState(null); // menu do botão direito { x, y, m }
  const [replyTo, setReplyTo] = useState(null);
  const textInput = useRef(null);
  const [file, setFile] = useState(null); // { blob, url, type }
  const [sending, setSending] = useState(false);
  const fileInput = useRef(null);
  const lastId = useRef(0);
  const box = useRef(null);

  useEffect(() => {
    setGuest(guestName());
    api("/api/auth/me").then((d) => setUser(d.user)).catch(() => {});
    // entrada por link de convite: /?sala=ID&k=TOKEN
    const sp = new URLSearchParams(location.search);
    const id = sp.get("sala"), k = sp.get("k");
    if (id) {
      history.replaceState(null, "", location.pathname);
      api(`/api/rooms/${id}?key=${encodeURIComponent(k || "")}`).then((d) => setRoom(d.room, k)).catch((e) => alert(e.message));
    }
  }, []);
  // ao logar/deslogar, recarrega lista (salas ocultas do dono)
  useEffect(() => { loadRooms(); }, [user?.id]);

  function openRoom(r) {
    if (room?.id === r.id) return;
    if (r.is_private && user?.id !== r.owner_id) { setCodeFor(r); setModal("code"); return; }
    setRoom(r);
  }

  const loadRooms = () => api(`/api/rooms?q=${encodeURIComponent(q)}`).then((d) => setRooms(d.rooms)).catch(() => {});
  useEffect(() => { const t = setTimeout(loadRooms, 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { const t = setInterval(loadRooms, 8000); return () => clearInterval(t); }, [q]);

  // tempo real: busca mensagens novas a cada 1.5s
  useEffect(() => {
    if (!room || room.kind === "call") return;
    let alive = true;
    setMsgs([]); setLikes({}); setReplyTo(null); lastId.current = 0;
    const tick = async () => {
      try {
        const d = await api(`/api/rooms/${room.id}/messages?after=${lastId.current}`, { headers: { "x-room-key": roomKey || "", "x-guest": guestName() } });
        if (!alive) return;
        setCallStatus(d.call);
        setLikes(d.likes || {});
        if (!d.messages.length) return;
        lastId.current = d.messages.at(-1).id;
        setMsgs((m) => { const ids = new Set(m.map((x) => x.id)); return [...m, ...d.messages.filter((x) => !ids.has(x.id))]; });
      } catch (e) {
        if (e.message === "Sala não existe" || e.message === "Sem acesso a esta sala") {
          if (alive) { setRoom(null); loadRooms(); if (e.message !== "Sala não existe") alert("Seu acesso a esta sala expirou. Entre de novo com o link ou código."); }
        }
      }
    };
    tick();
    const t = setInterval(tick, 1500);
    return () => { alive = false; clearInterval(t); };
  }, [room?.id, roomKey]);

  useEffect(() => { box.current?.scrollTo(0, box.current.scrollHeight); }, [msgs.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim(); if ((!body && !file) || sending) return;
    setSending(true);
    try {
      let fileId = null;
      if (file) {
        const up = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": file.type }, body: file.blob });
        const u = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(u.error || (up.status === 413 ? "Arquivo maior que 4 MB" : "Falha no envio"));
        fileId = u.id;
      }
      const d = await api(`/api/rooms/${room.id}/messages`, { method: "POST", body: { body, guestName: guest, fileId, replyTo: replyTo?.id }, headers: { "x-room-key": roomKey || "" } });
      setText(""); clearFile(); setReplyTo(null);
      lastId.current = Math.max(lastId.current, d.message.id);
      setMsgs((m) => m.some((x) => x.id === d.message.id) ? m : [...m, d.message]);
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  }
  function clearFile() { setFile((f) => { if (f) URL.revokeObjectURL(f.url); return null; }); if (fileInput.current) fileInput.current.value = ""; }
  async function pickFile(f) {
    if (!f) return;
    if (!/^(image|video)\//.test(f.type)) return alert("Envie só imagem ou vídeo");
    const blob = await compress(f);
    if (blob.size > 4 * 1024 * 1024) { alert("Arquivo maior que 4 MB"); return clearFile(); }
    clearFile();
    setFile({ blob, url: URL.createObjectURL(blob), type: blob.type || f.type });
  }
  const myName = user ? user.name : guest;
  async function like(m) {
    const cur = likes[m.id] || { n: 0, mine: false };
    setLikes((l) => ({ ...l, [m.id]: { n: cur.n + (cur.mine ? -1 : 1), mine: !cur.mine } }));
    try {
      const d = await api(`/api/messages/${m.id}/like`, { method: "POST", body: { guestName: guest }, headers: { "x-room-key": roomKey || "" } });
      setLikes((l) => ({ ...l, [m.id]: d }));
    } catch { setLikes((l) => ({ ...l, [m.id]: cur })); }
  }
  function reply(m) { setReplyTo(m); setTimeout(() => textInput.current?.focus(), 0); }
  function jumpTo(id) {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1200);
  }
  function startCall(kind) {
    // se já tem ligação rolando, entra nela
    setInCall({ kind: callStatus?.msg_id ? callStatus.kind || "video" : kind });
  }
  async function delRoom(r, e) {
    e.stopPropagation();
    if (!confirm(`Apagar a sala "${r.name}"?`)) return;
    try { await api(`/api/rooms/${r.id}`, { method: "DELETE" }); if (room?.id === r.id) setRoom(null); loadRooms(); }
    catch (err) { alert(err.message); }
  }
  async function logout() { await api("/api/auth/logout", { method: "POST" }); setUser(null); }

  return (
    <div className="app">
      <div className="top">
        <div className="brand">{Icons.logo} Fórum</div>
        <div className="auth">
          <ThemeMenu />
          {user ? (<><div className="user"><div className="avatar" style={{ background: colorOf(user.name), width: 24, height: 24, fontSize: 11 }}>{user.name[0].toUpperCase()}</div><span>{user.name}</span></div><button className="icon-btn" title="Sair" onClick={logout}>{Icons.logout}</button></>)
                : (<><button className="btn ghost" onClick={() => setModal("login")}>Entrar</button><button className="btn" onClick={() => setModal("register")}>Cadastrar</button></>)}
        </div>
      </div>

      <div className={`main ${room ? "open" : ""}`}>
        <aside className="side">
          <div className="tools">
            <label className="search">{Icons.search}<input placeholder="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <button className="icon-btn" title="Entrar com código" onClick={() => { setCodeFor(null); setModal("code"); }}>{Icons.key}</button>
            <button className="icon-btn" title={user ? "Criar sala" : "Faça login para criar salas"} disabled={!user} onClick={() => setModal("room")}>{Icons.plus}</button>
          </div>
          <div className="label">Salas</div>
          <ul className="rooms">
            {rooms.map((r) => (
              <li key={r.id} className={room?.id === r.id ? "on" : ""} onClick={() => openRoom(r)}>
                {r.is_private ? Icons.lock : r.kind === "call" ? Icons.video : Icons.hash}
                <div className="name"><div>{r.name}</div><small>por {r.owner}{r.hidden && <span className="tag">{Icons.eyeOff}oculta</span>}</small></div>
                {r.in_call > 0 && <span className="live" title="Pessoas em chamada">{Icons.users}{r.in_call}</span>}
                {user?.id === r.owner_id && <button className="icon-btn del" title="Apagar sala" onClick={(e) => delRoom(r, e)}>{Icons.trash}</button>}
              </li>
            ))}
            {!rooms.length && <div className="empty" style={{ fontSize: 13 }}>Nenhuma sala</div>}
          </ul>
        </aside>

        <section className="chat">
          {room ? (<>
            <header><button className="icon-btn back" onClick={() => setRoom(null)}>{Icons.back}</button>{room.is_private ? Icons.lock : Icons.hash}{room.name}<small>por {room.owner}</small>
              <div className="head-actions">
                {room.kind !== "call" && room.calls_enabled && !inCall && <>
                  <button className="icon-btn" title="Chamada de voz" onClick={() => startCall("audio")}>{Icons.phone}</button>
                  <button className="icon-btn" title="Chamada de vídeo" onClick={() => startCall("video")}>{Icons.video}</button>
                </>}
                {user?.id === room.owner_id && <button className="icon-btn" title="Configurar sala" onClick={() => setModal("edit")}>{Icons.gear}</button>}
              </div></header>
            {inCall && <CallView key={room.id} room={room} roomKey={roomKey} name={myName} kind={inCall.kind} compact={room.kind !== "call"}
              onLeave={() => setInCall(null)} />}
            {room.kind === "call" && !inCall && (
              <div className="empty">{Icons.video}Você saiu da chamada
                <button className="btn" onClick={() => setInCall({ kind: "video" })}>Entrar de novo</button></div>
            )}
            {room.kind !== "call" && <>
            <div className="msgs" ref={box}>
              {msgs.map((m) => m.call_kind ? (
                <CallCard key={m.id} m={m} status={callStatus} inCall={!!inCall} mine={user ? m.user_id === user.id : !m.user_id && m.author === guest}
                  dismissed={dismissed.has(m.id)} onJoin={() => setInCall({ kind: m.call_kind })}
                  onDismiss={() => setDismissed((d) => new Set(d).add(m.id))} />
              ) : (
                <div className={`msg ${(user ? m.user_id === user.id : !m.user_id && m.author === guest) ? "mine" : ""}`} key={m.id} id={`msg-${m.id}`}
                  onContextMenu={(e) => { if (e.target.closest("a, video, iframe")) return; e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, m }); }}>
                  <div className={`avatar ${m.user_id ? "" : "guest"}`} style={{ background: colorOf(m.author) }}>{m.author[0].toUpperCase()}</div>
                  <div className="content">
                    <div className="meta"><b>{m.author}</b>{!m.user_id && <span>visitante</span>}
                      <time>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>
                    {m.reply_to && (
                      <button className="quote" onClick={() => jumpTo(m.reply_to)}>
                        <b>{m.reply_author || "Mensagem"}</b>
                        <span>{m.reply_body || (m.reply_file ? (m.reply_file.startsWith("video/") ? "🎬 Vídeo" : "📷 Imagem") : "mensagem apagada")}</span>
                      </button>
                    )}
                    {m.file_id && (m.file_mime?.startsWith("video/")
                      ? <video className="media" src={`/api/files/${m.file_id}`} controls preload="metadata" />
                      : <img className="media" src={`/api/files/${m.file_id}`} alt="" loading="lazy" onClick={() => setLightbox({ type: "image", src: `/api/files/${m.file_id}` })} />)}
                    {m.body && <div className="body"><Linkify text={m.body} /></div>}
                    {[...new Set(m.body?.match(URL_RE) || [])].slice(0, 2).map((u) => <LinkPreview key={u} url={u} onOpen={setLightbox} />)}
                    {likes[m.id]?.n > 0 && (
                      <button className={`likes ${likes[m.id].mine ? "mine" : ""}`} onClick={() => like(m)} title={likes[m.id].mine ? "Descurtir" : "Curtir"}>
                        {Icons.heartFill}{likes[m.id].n}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!msgs.length && <div className="empty">{Icons.chat}Nenhuma mensagem ainda</div>}
            </div>
            <div className="send">
              {replyTo && (
                <div className="replying">
                  {Icons.reply}
                  <div><b>Respondendo a {replyTo.author}</b><span>{replyTo.body || (replyTo.file_mime?.startsWith("video/") ? "🎬 Vídeo" : "📷 Imagem")}</span></div>
                  <button type="button" className="icon-btn" onClick={() => setReplyTo(null)} title="Cancelar">{Icons.x}</button>
                </div>
              )}
              {file && (
                <div className="attach">
                  {file.type.startsWith("video/") ? <video src={file.url} muted /> : <img src={file.url} alt="" />}
                  <span>{(file.blob.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" className="icon-btn" onClick={clearFile} title="Remover">{Icons.x}</button>
                </div>
              )}
              <form onSubmit={send} onPaste={(e) => { const f = [...e.clipboardData.files][0]; if (f) { e.preventDefault(); pickFile(f); } }}>
              <input ref={fileInput} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden onChange={(e) => pickFile(e.target.files[0])} />
              <button type="button" className="icon-btn" title="Enviar imagem ou vídeo" onClick={() => fileInput.current?.click()}>{Icons.clip}</button>
              <input ref={textInput} onKeyDown={(e) => e.key === "Escape" && setReplyTo(null)} placeholder={`Mensagem como ${user ? user.name : guest}`} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
              <button className="icon-btn send-btn" disabled={(!text.trim() && !file) || sending} title="Enviar">{Icons.send}</button>
            </form></div>
            </>}
          </>) : <div className="empty">{Icons.chat}Escolha uma sala</div>}
        </section>
      </div>

      {ctx && <MsgMenu ctx={ctx} liked={!!likes[ctx.m.id]?.mine} onClose={() => setCtx(null)}
        onLike={() => like(ctx.m)} onReply={() => reply(ctx.m)}
        onOpen={ctx.m.file_id && !ctx.m.file_mime?.startsWith("video/") ? () => setLightbox({ type: "image", src: `/api/files/${ctx.m.file_id}` }) : null} />}
      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
      {modal === "code" && <CodeModal room={codeFor} onClose={() => setModal(null)} onDone={(r, key) => { setModal(null); setRoom(r, key); }} />}
      {modal === "edit" && room && <EditModal room={room} onClose={() => setModal(null)}
        onSaved={(r) => { setRoomState(r); loadRooms(); }}
        onDeleted={() => { setModal(null); setRoom(null); loadRooms(); }} />}
      {modal === "room" && <RoomModal onClose={() => setModal(null)} onDone={(r) => { setModal(null); loadRooms(); setRoom(r); }} />}
      {(modal === "login" || modal === "register") &&
        <AuthModal mode={modal} setMode={setModal} onClose={() => setModal(null)} onDone={(u) => { setUser(u); setModal(null); }} />}
    </div>
  );
}

function AuthModal({ mode, setMode, onClose, onDone }) {
  const [name, setName] = useState(""); const [password, setPassword] = useState(""); const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try { const d = await api(`/api/auth/${mode}`, { method: "POST", body: { name, password } }); onDone(d.user); }
    catch (x) { setErr(x.message); }
  };
  return (
    <div className="modal" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{mode === "login" ? "Entrar" : "Criar conta"}</h3>
        <p>{mode === "login" ? "Bem-vindo de volta." : "Crie uma conta para criar salas."}</p>
        <div className="field"><input placeholder="Nome de usuário" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
        <div className="field"><input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <div className="err">{err}</div>}
        <button className="btn">{mode === "login" ? "Entrar" : "Cadastrar"}</button>
        <span className="switch" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}</span>
      </form>
    </div>
  );
}

function Toggle({ checked, onChange, title, desc }) {
  return (
    <label className="toggle">
      <div><b>{title}</b><small>{desc}</small></div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sw-track" />
    </label>
  );
}

function RoomModal({ onClose, onDone }) {
  const [name, setName] = useState(""); const [err, setErr] = useState("");
  const [isPrivate, setPrivate] = useState(false); const [hidden, setHidden] = useState(false);
  const [code, setCode] = useState(""); const [kind, setKind] = useState("chat");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try { const d = await api("/api/rooms", { method: "POST", body: { name, is_private: isPrivate, hidden, access_code: code, kind } }); onDone(d.room); }
    catch (x) { setErr(x.message); }
  };
  return (
    <div className="modal" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Nova sala</h3>
        <div className="seg">
          <button type="button" className={kind === "chat" ? "on" : ""} onClick={() => setKind("chat")}>{Icons.hash} Chat</button>
          <button type="button" className={kind === "call" ? "on" : ""} onClick={() => setKind("call")}>{Icons.video} Chamada de vídeo</button>
        </div>
        <div className="field"><input placeholder="Nome da sala" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus /></div>
        <Toggle checked={isPrivate} onChange={setPrivate} title="Privada" desc="Só entra quem tiver o código ou o link" />
        {isPrivate && <div className="field"><input placeholder="Código de acesso (vazio = gerar automático)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} /></div>}
        <Toggle checked={hidden} onChange={setHidden} title="Oculta" desc="Não aparece na lista de salas" />
        {err && <div className="err">{err}</div>}
        <button className="btn">Criar</button>
      </form>
    </div>
  );
}

function CodeModal({ room, onClose, onDone }) {
  const [code, setCode] = useState(""); const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try { const d = await api("/api/rooms/join", { method: "POST", body: { code, roomId: room?.id } }); onDone(d.room, d.key); }
    catch (x) { setErr(x.message); }
  };
  return (
    <div className="modal" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{room ? <>{Icons.lock} {room.name}</> : "Entrar com código"}</h3>
        <p>{room ? "Esta sala é privada. Digite o código de acesso." : "Digite o código de acesso da sala."}</p>
        <div className="field"><input className="code-input" placeholder="CÓDIGO" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} autoFocus /></div>
        {err && <div className="err">{err}</div>}
        <button className="btn">Entrar</button>
      </form>
    </div>
  );
}

function EditModal({ room, onClose, onSaved, onDeleted }) {
  const [name, setName] = useState(room.name);
  const [isPrivate, setPrivate] = useState(room.is_private);
  const [hidden, setHidden] = useState(room.hidden);
  const [calls, setCalls] = useState(room.calls_enabled);
  const [code, setCode] = useState(room.access_code || "");
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const link = typeof location !== "undefined" ? `${location.origin}/?sala=${room.id}&k=${room.invite_token}` : "";
  const save = async (extra = {}) => {
    setErr(""); setOk("");
    try {
      const d = await api(`/api/rooms/${room.id}`, { method: "PATCH", body: { name, is_private: isPrivate, hidden, access_code: code, calls_enabled: calls, ...extra } });
      onSaved(d.room); setCode(d.room.access_code || ""); setOk("Salvo");
    } catch (x) { setErr(x.message); }
  };
  const copy = (t) => { navigator.clipboard?.writeText(t); setOk("Copiado!"); };
  const del = async () => {
    if (!confirm(`Apagar a sala "${room.name}"?`)) return;
    try { await api(`/api/rooms/${room.id}`, { method: "DELETE" }); onDeleted(); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="modal" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); save(); }}>
        <h3>Configurar sala</h3>
        <div className="field"><input placeholder="Nome da sala" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
        <Toggle checked={isPrivate} onChange={setPrivate} title="Privada" desc="Só entra quem tiver o código ou o link" />
        <Toggle checked={hidden} onChange={setHidden} title="Oculta" desc="Não aparece na lista de salas" />
        {room.kind !== "call" && <Toggle checked={calls} onChange={setCalls} title="Chamadas de vídeo e voz" desc="Permite ligar dentro do chat" />}

        <div className="sec">Código de acesso</div>
        <div className="row">
          <div className="field"><input className="code-input" placeholder="sem código" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} /></div>
          {code && <button type="button" className="icon-btn" title="Copiar" onClick={() => copy(code)}>{Icons.copy}</button>}
          <button type="button" className="icon-btn" title="Gerar novo código" onClick={() => save({ new_code: true })}>{Icons.refresh}</button>
        </div>

        <div className="sec">Link de convite</div>
        <div className="row">
          <div className="field"><input readOnly value={link} onFocus={(e) => e.target.select()} /></div>
          <button type="button" className="icon-btn" title="Copiar" onClick={() => copy(link)}>{Icons.copy}</button>
          <button type="button" className="icon-btn" title="Gerar novo link (o antigo para de funcionar)" onClick={() => save({ new_link: true })}>{Icons.refresh}</button>
        </div>
        <small className="hint">Trocar o código ou o link tira quem entrou com o antigo.</small>

        {err && <div className="err">{err}</div>}
        {ok && <div className="ok">{ok}</div>}
        <button className="btn">Salvar</button>
        <button type="button" className="btn ghost danger" onClick={del}>{Icons.trash} Apagar sala</button>
      </form>
    </div>
  );
}

function CallCard({ m, status, inCall, mine, dismissed, onJoin, onDismiss }) {
  const active = status?.msg_id === m.id && !m.call_ended_at;
  const label = m.call_kind === "audio" ? "chamada de voz" : "chamada de vídeo";
  const icon = m.call_kind === "audio" ? Icons.phone : Icons.video;
  const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  let dur = "";
  if (m.call_ended_at) {
    const min = Math.round((new Date(m.call_ended_at) - new Date(m.created_at)) / 60000);
    dur = min < 1 ? "menos de 1 min" : `${min} min`;
  }
  return (
    <div className={`call-card ${active ? "active" : ""}`}>
      <div className="cc-icon">{icon}</div>
      <div className="cc-txt">
        <b>{mine ? "Você" : m.author} iniciou uma {label}</b>
        <small>{time}{active ? ` · ${status.count} na chamada` : ` · encerrada${dur ? " · " + dur : ""}`}</small>
      </div>
      {active && !inCall && (!mine && !dismissed ? (
        <div className="cc-actions">
          <button className="btn hang-btn" onClick={onDismiss}>Recusar</button>
          <button className="btn answer-btn" onClick={onJoin}>Atender</button>
        </div>
      ) : <button className="btn answer-btn" onClick={onJoin}>Entrar</button>)}
      {active && inCall && <small className="cc-in">você está na chamada</small>}
    </div>
  );
}

function MsgMenu({ ctx, liked, onClose, onLike, onReply, onOpen }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: ctx.x, top: ctx.y });
  useEffect(() => {
    const el = ref.current;
    if (el) {
      const w = el.offsetWidth, h = el.offsetHeight;
      setPos({ left: Math.min(ctx.x, innerWidth - w - 8), top: Math.min(ctx.y, innerHeight - h - 8) });
    }
    const close = (e) => { if (!el?.contains(e.target)) onClose(); };
    const key = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", onClose);
    document.querySelector(".msgs")?.addEventListener("scroll", onClose, { once: true });
    return () => {
      document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", key); window.removeEventListener("resize", onClose);
    };
  }, []);
  const act = (fn) => () => { fn(); onClose(); };
  const text = ctx.m.body;
  return (
    <div className="menu ctx" ref={ref} style={pos}>
      <button onClick={act(onLike)}>{liked ? Icons.heartFill : Icons.heart}{liked ? "Descurtir" : "Curtir"}</button>
      <button onClick={act(onReply)}>{Icons.reply}Responder</button>
      {text && <button onClick={act(() => navigator.clipboard?.writeText(text))}>{Icons.copy}Copiar texto</button>}
      {onOpen && <button onClick={act(onOpen)}>{Icons.image}Abrir imagem</button>}
    </div>
  );
}
