// Cloudflare Pages benzeri yerel sunucu: /x -> x.html, /x/ -> x/index.html, yoksa 404.html.
// Kullanım: node tools/serve.mjs <siteDir> [port] [<siteDir2> <port2> ...]  (birden çok site tek süreçte)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
const args = process.argv.slice(2);
if (args.length === 1) args.push("8787");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4" };
const isFile = p => stat(p).then(s => s.isFile(), () => false);
for (let i = 0; i < args.length; i += 2) serve(args[i], args[i + 1]);
function serve(dir, port) {
createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const cands = [join(dir, path), join(dir, path.replace(/\/$/, "") + ".html"), join(dir, path, "index.html")];
  for (const c of cands) if (await isFile(c)) {
    res.writeHead(200, { "content-type": TYPES[extname(c).toLowerCase()] || "application/octet-stream" });
    return res.end(await readFile(c));
  }
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(await readFile(join(dir, "404.html")).catch(() => "404"));
}).listen(+port, () => console.log(`http://localhost:${port}`));
}
