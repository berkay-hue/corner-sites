// Yerel duman testi için sahte SMTP sunucusu (TLS yok, yalnız 127.0.0.1). AUTH olmadan MAIL kabul etmez.
// Her e-postanın başlıkları ve çözülmüş gövde parçaları bir dosyaya yazılır; stdout'a "Text: <dosya>" basılır
// (dev/smoke-platform.sh MAIL_LOG ile bu satırları okur).
//   node dev/fake-smtp.mjs 2525 /tmp/mails > /tmp/smtp.log
import { createServer } from "node:net";
import { mkdirSync, writeFileSync } from "node:fs";

const port = Number(process.argv[2] || 2525), dir = process.argv[3] || "/tmp/fake-smtp";
mkdirSync(dir, { recursive: true });
let n = 0;

function decode(raw) {
  const [head, ...rest] = raw.split("\r\n\r\n"), body = rest.join("\r\n\r\n");
  const boundary = /boundary="([^"]+)"/.exec(head)?.[1];
  const parts = boundary ? body.split(`--${boundary}`).slice(1, -1) : [body];
  return head + "\r\n\r\n" + parts.map(p => {
    const [h, ...b] = p.replace(/^\r\n/, "").split("\r\n\r\n"), text = b.join("\r\n\r\n");
    return /base64/i.test(h) ? Buffer.from(text.replace(/\s/g, ""), "base64").toString("utf8") : text;
  }).join("\n----\n");
}

createServer(sock => {
  let buf = "", data = null, authed = false;
  const say = s => sock.write(s + "\r\n");
  say("220 fake-smtp");
  sock.on("data", chunk => {
    buf += chunk.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (data !== null) {
        if (line !== ".") { data.push(line.startsWith("..") ? line.slice(1) : line); continue; }
        const file = `${dir}/mail-${process.pid}-${++n}.txt`;
        writeFileSync(file, decode(data.join("\r\n")));
        console.log(`Text: ${file}`);
        data = null;
        say("250 OK");
      } else if (/^EHLO /i.test(line)) { say("250-fake-smtp"); say("250 AUTH PLAIN"); }
      else if (/^AUTH PLAIN /i.test(line)) {
        const [, user, pass] = Buffer.from(line.slice(11), "base64").toString("utf8").split("\0");
        authed = Boolean(user && pass);
        console.log(`auth ${authed ? "ok" : "eksik"} user=${user}`);
        say(authed ? "235 OK" : "535 bad");
      }
      else if (/^MAIL FROM:/i.test(line)) say(authed ? "250 OK" : "530 auth required");
      else if (/^RCPT TO:/i.test(line)) say("250 OK");
      else if (/^DATA$/i.test(line)) { data = []; say("354 go"); }
      else if (/^QUIT$/i.test(line)) { say("221 bye"); sock.end(); }
      else say("502 ?");
    }
  });
  sock.on("error", () => {});
}).listen(port, "127.0.0.1", () => console.log(`fake-smtp ${port} ${dir}`));
