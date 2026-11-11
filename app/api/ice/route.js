// servidores pra conectar a chamada. STUN resolve a maioria das redes;
// TURN repassa o vídeo quando a rede bloqueia conexão direta (4G, rede de empresa, etc.)
export const dynamic = "force-dynamic";

export async function GET() {
  const servers = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"] },
  ];
  if (process.env.TURN_URLS) {
    servers.push({ urls: process.env.TURN_URLS.split(",").map((s) => s.trim()), username: process.env.TURN_USER, credential: process.env.TURN_PASS });
  } else {
    // TURN público e gratuito (sem garantia). Pra produção, coloque o seu no .env
    servers.push({
      urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp", "turns:openrelay.metered.ca:443"],
      username: "openrelayproject", credential: "openrelayproject",
    });
  }
  return Response.json({ iceServers: servers });
}
