"use client";
import { useEffect, useRef, useState } from "react";

const ICE_FALLBACK = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }] };

function mediaError(e, what) {
  if (typeof window !== "undefined" && !window.isSecureContext) return { what, reason: "insecure" };
  if (e?.name === "NotAllowedError" || e?.name === "SecurityError") return { what, reason: "denied" };
  if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") return { what, reason: "notfound" };
  if (e?.name === "NotReadableError") return { what, reason: "busy" };
  return { what, reason: "other" };
}

function PermHelp({ perm, onRetry, onClose }) {
  const nome = perm.what === "mic" ? "microfone" : "câmera";
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
  return (
    <div className="perm">
      <div className="perm-box">
        <b>{perm.what === "mic" ? CallIcons.micOff : CallIcons.camOff} Não deu pra usar o {nome}</b>
        {perm.reason === "insecure" && <>
          <p>O navegador só libera câmera e microfone em sites com <b>https</b>. Você está em <code>{location.origin}</code>.</p>
          <ol>
            <li>Rode o projeto com <code>npm run dev</code> (já vem com https).</li>
            <li>Abra <code>https://{location.hostname}:{location.port}</code></li>
            <li>Se aparecer &quot;Sua conexão não é particular&quot;, clique em <b>Avançado → Continuar</b>.</li>
          </ol>
          <p className="perm-note">Na Vercel isso não acontece, ela já é https.</p>
        </>}
        {perm.reason === "denied" && <>
          <p>A permissão foi bloqueada. Para liberar:</p>
          {isMobile ? <ol>
            <li>Toque no ícone ao lado do endereço do site (cadeado ou ⓘ).</li>
            <li>Vá em <b>Permissões</b> e ative <b>{nome}</b>.</li>
            <li>Recarregue a página.</li>
          </ol> : <ol>
            <li>Clique no ícone à esquerda do endereço do site (cadeado ou ajustes).</li>
            <li>Em <b>{nome === "câmera" ? "Câmera" : "Microfone"}</b>, escolha <b>Permitir</b>.</li>
            <li>Clique em <b>Tentar de novo</b>.</li>
          </ol>}
        </>}
        {perm.reason === "notfound" && <p>Nenhum {nome} foi encontrado neste aparelho. Conecte um e tente de novo.</p>}
        {perm.reason === "busy" && <p>O {nome} está sendo usado por outro programa (Zoom, Meet, OBS...). Feche-o e tente de novo.</p>}
        {perm.reason === "other" && <p>Ocorreu um erro ao acessar o {nome}. Tente de novo.</p>}
        <div className="perm-actions">
          <button className="btn ghost" onClick={onClose}>Fechar</button>
          {perm.reason !== "insecure" && <button className="btn" onClick={onRetry}>Tentar de novo</button>}
        </div>
      </div>
    </div>
  );
}

const S = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
export const CallIcons = {
  mic: <S><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M19 10a7 7 0 0 1-14 0M12 19v3" /></S>,
  micOff: <S><path d="M2 2l20 20M9 9v1a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.7M19 10a7 7 0 0 1-1.2 3.9M5 10a7 7 0 0 0 11 5.7M12 19v3" /></S>,
  cam: <S><path d="m22 8-6 4 6 4V8z" /><rect x="2" y="6" width="14" height="12" rx="2" /></S>,
  camOff: <S><path d="M2 2l20 20M16 16v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2m5 0h5a1 1 0 0 1 1 1v3.3l1 1L22 8v8" /></S>,
  screen: <S><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></S>,
  hangup: <S><path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7" /><path d="M22 2 2 22" /></S>,
};

const COLORS = ["#ededed", "#a1e3c4", "#f5c8a0", "#b9c6ff", "#f2b8d4", "#d9e3a1", "#a8dcef"];
const colorOf = (n) => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

function Tile({ name, stream, track, on, mic, me, screen }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (track) v.srcObject = new MediaStream([track]);
    else if (stream) v.srcObject = stream;
    else v.srcObject = null;
    v.play?.().catch(() => {});
  }, [stream, track]);
  return (
    <div className={`tile ${on ? "has-video" : ""}`}>
      {/* o elemento fica sempre montado pra tocar o áudio mesmo com câmera desligada */}
      <video ref={ref} autoPlay playsInline muted={me} className={me && !screen ? "mirror" : ""} style={{ display: on ? "block" : "none" }} />
      {!on && <div className="tile-avatar" style={{ background: colorOf(name) }}>{name[0]?.toUpperCase()}</div>}
      <div className="tile-name">{!mic && <span className="tile-muted">{CallIcons.micOff}</span>}{name}{me && " (você)"}</div>
    </div>
  );
}

export default function CallView({ room, roomKey, name, kind = "video", compact, onLeave }) {
  const peerId = useRef(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const peers = useRef(new Map()); // id -> { pc, stream, audio, video, ice: [] }
  const tracks = useRef({ audio: null, video: null });
  const after = useRef(0);
  const ice = useRef(ICE_FALLBACK);
  const [perm, setPerm] = useState(null);
  const [hint, setHint] = useState(true);
  const flags = useRef({ cam: false, mic: false, screen: false });
  const [list, setList] = useState([]);
  const [, bump] = useState(0);
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [screen, setScreen] = useState(false);
  const [error, setError] = useState("");
  const rerender = () => bump((x) => x + 1);

  const call = (action, extra = {}) =>
    fetch(`/api/rooms/${room.id}/call`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, peer: peerId.current, key: roomKey || "", name, kind, ...flags.current, ...extra }),
    }).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(d.error || "Erro"), { status: r.status }); return d; });

  const signal = (to, data) => call("signal", { to, data }).catch(() => {});

  function attach(p) {
    p.audio?.replaceTrack(tracks.current.audio).catch(() => {});
    p.video?.replaceTrack(tracks.current.video).catch(() => {});
  }

  function closePeer(id) {
    const p = peers.current.get(id);
    if (p) { p.pc.close(); peers.current.delete(id); rerender(); }
  }

  function createPeer(id, initiator) {
    const pc = new RTCPeerConnection(ice.current);
    const p = { pc, stream: new MediaStream(), audio: null, video: null, ice: [] };
    peers.current.set(id, p);
    pc.onicecandidate = (e) => e.candidate && signal(id, { type: "ice", c: e.candidate });
    pc.ontrack = (e) => { p.stream.addTrack(e.track); rerender(); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === "failed") closePeer(id); };
    if (initiator) {
      // transceivers fixos: ligar/desligar câmera e mic só troca a faixa, sem renegociar
      p.audio = pc.addTransceiver("audio", { direction: "sendrecv" }).sender;
      p.video = pc.addTransceiver("video", { direction: "sendrecv" }).sender;
      attach(p);
      pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => signal(id, { type: "offer", sdp: pc.localDescription })).catch(() => closePeer(id));
    }
    rerender();
    return p;
  }

  async function onSignal({ from, data }) {
    let p = peers.current.get(from);
    try {
      if (data.type === "offer") {
        if (p) { p.pc.close(); peers.current.delete(from); }
        p = createPeer(from, false);
        await p.pc.setRemoteDescription(data.sdp);
        for (const t of p.pc.getTransceivers()) {
          t.direction = "sendrecv";
          if (t.receiver.track.kind === "audio") p.audio = t.sender; else p.video = t.sender;
        }
        attach(p);
        await p.pc.setLocalDescription(await p.pc.createAnswer());
        signal(from, { type: "answer", sdp: p.pc.localDescription });
        for (const c of p.ice.splice(0)) await p.pc.addIceCandidate(c).catch(() => {});
      } else if (data.type === "answer" && p) {
        await p.pc.setRemoteDescription(data.sdp);
        for (const c of p.ice.splice(0)) await p.pc.addIceCandidate(c).catch(() => {});
      } else if (data.type === "ice" && p) {
        if (p.pc.remoteDescription) await p.pc.addIceCandidate(data.c).catch(() => {});
        else p.ice.push(data.c);
      }
    } catch { closePeer(from); }
  }

  function sync(participants) {
    setList(participants);
    const ids = new Set(participants.map((x) => x.peer_id));
    for (const id of [...peers.current.keys()]) if (!ids.has(id)) closePeer(id);
    // quem tem o id menor faz a oferta, evita os dois ligarem ao mesmo tempo
    for (const x of participants) {
      if (x.peer_id !== peerId.current && !peers.current.has(x.peer_id) && peerId.current < x.peer_id) createPeer(x.peer_id, true);
    }
  }

  useEffect(() => {
    let alive = true, timer;
    const loop = async () => {
      try {
        const d = await call("poll", { after: after.current });
        if (!alive) return;
        for (const s of d.signals) { after.current = Math.max(after.current, s.id); await onSignal(s); }
        sync(d.participants);
      } catch (e) {
        if (e.status === 403 || e.status === 404 || e.status === 410) { if (alive) { alert(e.message); leave(); } return; }
      }
      if (alive) timer = setTimeout(loop, 1000);
    };
    fetch("/api/ice").then((r) => r.json()).then((c) => { if (c?.iceServers) ice.current = c; }).catch(() => {})
      .then(() => call("join")).then((d) => { if (!alive) return; sync(d.participants); loop(); })
      .catch((e) => { if (alive) { setError(e.message); } });
    const bye = () => navigator.sendBeacon?.(`/api/rooms/${room.id}/call`,
      new Blob([JSON.stringify({ action: "leave", peer: peerId.current, key: roomKey || "" })], { type: "application/json" }));
    window.addEventListener("pagehide", bye);
    return () => {
      alive = false; clearTimeout(timer);
      window.removeEventListener("pagehide", bye);
      bye();
      for (const id of [...peers.current.keys()]) peers.current.get(id).pc.close();
      peers.current.clear();
      Object.values(tracks.current).forEach((t) => t?.stop());
    };
  }, [room.id]);

  function setTrack(kindKey, track) {
    tracks.current[kindKey]?.stop();
    tracks.current[kindKey] = track;
    for (const p of peers.current.values()) p[kindKey]?.replaceTrack(track).catch(() => {});
    rerender();
  }
  const setFlag = (k, v, set) => { flags.current[k] = v; set(v); };

  async function toggleMic() {
    if (mic) { setTrack("audio", null); return setFlag("mic", false, setMic); }
    if (!navigator.mediaDevices?.getUserMedia) return setPerm(mediaError(null, "mic"));
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      setTrack("audio", s.getAudioTracks()[0]); setFlag("mic", true, setMic); setPerm(null); setHint(false);
    } catch (e) { setPerm(mediaError(e, "mic")); }
  }
  async function toggleCam() {
    if (cam) { setTrack("video", null); return setFlag("cam", false, setCam); }
    if (!navigator.mediaDevices?.getUserMedia) return setPerm(mediaError(null, "cam"));
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 360 } } });
      setFlag("screen", false, setScreen);
      setTrack("video", s.getVideoTracks()[0]); setFlag("cam", true, setCam); setPerm(null); setHint(false);
    } catch (e) { setPerm(mediaError(e, "cam")); }
  }
  async function toggleScreen() {
    if (screen) { setTrack("video", null); return setFlag("screen", false, setScreen); }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const t = s.getVideoTracks()[0];
      t.onended = () => { if (tracks.current.video === t) { setTrack("video", null); setFlag("screen", false, setScreen); } };
      setFlag("cam", false, setCam);
      setTrack("video", t); setFlag("screen", true, setScreen);
    } catch {}
  }
  function leave() { onLeave?.(); }

  if (error) return (
    <div className={`call ${compact ? "compact" : ""}`}>
      <div className="empty">{error}<button className="btn" onClick={leave}>Voltar</button></div>
    </div>
  );

  const others = list.filter((x) => x.peer_id !== peerId.current);
  const n = others.length + 1;
  return (
    <div className={`call ${compact ? "compact" : ""}`}>
      <div className="call-grid" data-n={Math.min(n, 10)}>
        <Tile me name={name} track={tracks.current.video} on={cam || screen} mic={mic} screen={screen} />
        {others.map((x) => (
          <Tile key={x.peer_id} name={x.name} stream={peers.current.get(x.peer_id)?.stream} on={x.cam || x.screen} mic={x.mic} />
        ))}
      </div>
      {hint && !mic && !cam && !screen && (
        <div className="call-hint">
          <span>Você entrou só com o avatar. Ligue o microfone ou a câmera — o navegador vai pedir permissão.</span>
          <button className="btn" onClick={toggleMic}>{CallIcons.mic} Microfone</button>
          {kind !== "audio" && <button className="btn" onClick={toggleCam}>{CallIcons.cam} Câmera</button>}
          <button className="icon-btn" title="Fechar" onClick={() => setHint(false)}>✕</button>
        </div>
      )}
      {perm && <PermHelp perm={perm} onClose={() => setPerm(null)} onRetry={() => (perm.what === "mic" ? toggleMic() : toggleCam())} />}
      <div className="call-bar">
        <span className="call-count">{n}/10</span>
        <button className={`cbtn ${mic ? "" : "off"}`} title={mic ? "Desligar microfone" : "Ligar microfone"} onClick={toggleMic}>{mic ? CallIcons.mic : CallIcons.micOff}</button>
        {kind !== "audio" && <>
          <button className={`cbtn ${cam ? "" : "off"}`} title={cam ? "Desligar câmera" : "Ligar câmera"} onClick={toggleCam}>{cam ? CallIcons.cam : CallIcons.camOff}</button>
          {navigator.mediaDevices?.getDisplayMedia && <button className={`cbtn ${screen ? "on" : ""}`} title="Compartilhar tela" onClick={toggleScreen}>{CallIcons.screen}</button>}
        </>}
        <button className="cbtn hang" title="Sair da chamada" onClick={leave}>{CallIcons.hangup}</button>
      </div>
    </div>
  );
}
