const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

loadEnvFile(path.join(__dirname, ".env"));

const metaPixelId = process.env.META_PIXEL_ID || "1981376712481038";
const metaAccessToken = process.env.META_ACCESS_TOKEN || "";
const metaApiVersion = process.env.META_API_VERSION || "v23.0";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".ttf": "font/ttf",
};

const gzipTypes = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".webmanifest",
]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function clientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "";
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const body = JSON.stringify(payload);

    const request = https.request(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let responseBody = "";

        response.on("data", (chunk) => {
          responseBody += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            body: responseBody,
          });
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function handleMetaCapi(req, res) {
  if (!metaAccessToken) {
    console.error("[Meta CAPI] META_ACCESS_TOKEN ausente");
    sendJson(res, 500, { ok: false, error: "META_ACCESS_TOKEN not configured" });
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const eventName = body.event_name || "Lead";
    const eventId = body.event_id;

    if (eventName !== "Lead" || !eventId) {
      sendJson(res, 400, { ok: false, error: "Invalid Lead event" });
      return;
    }

    const userData = {
      client_ip_address: clientIp(req),
      client_user_agent: req.headers["user-agent"] || body.user_agent || "",
    };

    if (body.fbp) userData.fbp = body.fbp;
    if (body.fbc) userData.fbc = body.fbc;

    const event = {
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: body.event_source_url || "",
      user_data: userData,
      custom_data: {
        content_name: "Pin-Up Casino roulette landing",
        lead_type: "registration_intent",
        fbclid: body.fbclid || "",
        referrer: body.referrer || req.headers.referer || "",
      },
    };

    const payload = { data: [event] };
    if (process.env.META_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_TEST_EVENT_CODE;
    }

    const url = `https://graph.facebook.com/${metaApiVersion}/${metaPixelId}/events?access_token=${encodeURIComponent(metaAccessToken)}`;
    const metaResponse = await postJson(url, payload);

    if (!metaResponse.statusCode || metaResponse.statusCode >= 400) {
      console.error("[Meta CAPI] erro ao enviar CAPI", metaResponse.statusCode, metaResponse.body);
      sendJson(res, 502, { ok: false, error: "Meta CAPI rejected event" });
      return;
    }

    console.log("[Meta CAPI] Lead enviado", eventId);
    sendJson(res, 200, { ok: true, event_id: eventId });
  } catch (error) {
    console.error("[Meta CAPI] erro ao enviar CAPI", error);
    sendJson(res, 500, { ok: false, error: "CAPI send failed" });
  }
}

function resolveFile(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const candidate = path.join(publicDir, safePath);

  if (!candidate.startsWith(publicDir)) {
    return null;
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  if (path.extname(candidate)) {
    return null;
  }

  return path.join(publicDir, "index.html");
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && (req.url || "").split("?")[0] === "/api/meta-capi") {
    handleMetaCapi(req, res);
    return;
  }

  const filePath = resolveFile(req.url || "/");

  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const isHtml = ext === ".html";
  const shouldGzip = gzipTypes.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  const headers = {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
  };

  if (shouldGzip) {
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
  }

  res.writeHead(200, {
    ...headers,
  });

  const stream = fs.createReadStream(filePath);
  if (shouldGzip) {
    stream.pipe(zlib.createGzip({ level: 6 })).pipe(res);
    return;
  }

  stream.pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Site rodando em http://127.0.0.1:${port}`);
});
