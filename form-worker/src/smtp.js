// Herhangi bir adrese e-posta: Google Workspace hesabıyla Gmail SMTP (smtp.gmail.com:465, baştan TLS), ek ücret yok.
// Ayarlar: SMTP_USER (wrangler.toml), SMTP_PASS (secret: hesabın uygulama şifresi), isteğe bağlı SMTP_FROM (varsayılan SMTP_USER;
// Gmail başka adresi yalnızca hesapta "farklı adresten gönder" tanımlıysa kabul eder). Yerel test: SMTP_HOST, SMTP_PORT, SMTP_TLS=off.
import { connect } from "cloudflare:sockets";

const enc = new TextEncoder(), dec = new TextDecoder();
const TIMEOUT_MS = 15000;

const b64 = s => {
  let bin = "";
  for (const b of enc.encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
};
const word = s => `=?UTF-8?B?${b64(s)}?=`;
const wrap = s => b64(s).replace(/.{76}/g, "$&\r\n");

export const smtpReady = env => Boolean(env.SMTP_USER && env.SMTP_PASS);
export const smtpFrom = env => env.SMTP_FROM || env.SMTP_USER;

// m: { to, from: { email, name }, subject, text, html }
function mime(m) {
  const boundary = "b" + crypto.randomUUID().replace(/-/g, "");
  return [
    `From: ${word(m.from.name)} <${m.from.email}>`,
    `To: <${m.to}>`,
    `Subject: ${word(m.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${m.from.email.split("@")[1]}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(m.text),
    `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(m.html),
    `--${boundary}--`, "",
  ].join("\r\n");
}

export async function smtpSend(env, m) {
  if (/[\r\n<>]/.test(m.to + m.from.email)) throw new Error("smtp: geçersiz adres");
  const socket = connect(
    { hostname: env.SMTP_HOST || "smtp.gmail.com", port: Number(env.SMTP_PORT || 465) },
    { secureTransport: env.SMTP_TLS === "off" ? "off" : "on" },
  );
  const w = socket.writable.getWriter(), r = socket.readable.getReader();
  let buf = "";
  // Sunucunun bir yanıtı: çok satırlıysa ("250-...") son satıra ("250 ...") kadar okunur
  async function reply() {
    for (;;) {
      const lines = buf.split("\r\n"), done = lines.slice(0, -1).findIndex(l => /^\d{3}(?: |$)/.test(l));
      if (done >= 0) {
        buf = lines.slice(done + 1).join("\r\n");
        return lines.slice(0, done + 1).join("\n");
      }
      const { value, done: closed } = await r.read();
      if (closed) throw new Error("smtp: bağlantı kapandı");
      buf += dec.decode(value, { stream: true });
    }
  }
  // label hata mesajında komutun yerine geçer: AUTH satırı kimlik bilgisi taşır, loglara yazılmaz
  async function step(label, line, want) {
    if (line !== null) await w.write(enc.encode(line + "\r\n"));
    const res = await reply();
    if (!want.some(c => res.startsWith(c))) throw new Error(`smtp ${label}: ${res.slice(0, 200)}`);
  }
  async function talk() {
    const from = m.from.email;
    await step("bağlantı", null, ["220"]);
    await step("EHLO", `EHLO ${from.split("@")[1]}`, ["250"]);
    await step("AUTH", `AUTH PLAIN ${b64(`\0${env.SMTP_USER}\0${env.SMTP_PASS}`)}`, ["235"]);
    await step("MAIL", `MAIL FROM:<${from}>`, ["250"]);
    await step("RCPT", `RCPT TO:<${m.to}>`, ["250", "251"]);
    await step("DATA", "DATA", ["354"]);
    // Nokta ile başlayan satır iki nokta olur (RFC 5321 4.5.2); base64 gövdede zaten olmaz
    await step("gönderim", mime(m).replace(/^\./gm, "..") + "\r\n.", ["250"]);
    await step("QUIT", "QUIT", ["221"]).catch(() => {});
  }
  let timer;
  try {
    await Promise.race([
      talk(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("smtp: zaman aşımı")), TIMEOUT_MS); }),
    ]);
  } finally {
    clearTimeout(timer);
    socket.close().catch(() => {});
  }
}
