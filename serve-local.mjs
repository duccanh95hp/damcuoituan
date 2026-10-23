import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer((request, response) => {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  let requestedFile;
  try {
    requestedFile = resolve(root, `.${decodeURIComponent(pathname)}`);
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }

  if (requestedFile !== root && !requestedFile.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (!existsSync(requestedFile) || !statSync(requestedFile).isFile()) {
    requestedFile = resolve(root, "index.html");
  }

  response.writeHead(200, { "Content-Type": mimeTypes[extname(requestedFile)] || "application/octet-stream" });
  createReadStream(requestedFile).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Local wedding invitation: http://127.0.0.1:${port}/`);
});
