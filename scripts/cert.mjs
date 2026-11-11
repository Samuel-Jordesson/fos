// gera um certificado https local (pra câmera/microfone funcionarem pela rede, ex: no celular)
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";

const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === "IPv4").map((i) => i.address);
const want = ["localhost", ...ips].join(",");
mkdirSync("certificates", { recursive: true });
const stamp = "certificates/hosts.txt";
if (existsSync("certificates/cert.pem") && existsSync(stamp) && readFileSync(stamp, "utf8") === want) process.exit(0);

const san = ["DNS:localhost", ...ips.map((ip) => `IP:${ip}`)].join(",");
execSync(`openssl req -x509 -newkey rsa:2048 -nodes -days 825 -keyout certificates/key.pem -out certificates/cert.pem -subj "/CN=forum-local" -addext "subjectAltName=${san}"`, { stdio: "ignore" });
writeFileSync(stamp, want);
console.log("Certificado https gerado para:", want);
