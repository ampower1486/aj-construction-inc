// ---------------------------------------------------------------------------
// TEMPORARY: takes the whole site offline.
//
// Vercel runs this file in front of every request (pages, images, /api/*),
// so visitors only ever see the "back soon" page below. It answers with
// HTTP 503 + Retry-After, which tells search engines the outage is
// temporary, so the site keeps its Google ranking while it's down.
//
// TO BRING THE SITE BACK: delete this file and push to main.
// ---------------------------------------------------------------------------

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AJ Construction Inc</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    html, body { height: 100%; }
    body {
      display: grid;
      place-items: center;
      padding: 24px 16px;
      background: #F7F9FB;
      color: #1A2530;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    main { max-width: 32rem; }
    .name {
      font-family: "Barlow Condensed", "Arial Narrow", sans-serif;
      font-weight: 700;
      font-size: clamp(1.75rem, 6vw, 2.5rem);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #0C4162;
    }
    .rule {
      width: 48px;
      height: 3px;
      margin: 18px auto 22px;
      background: #9C3636;
      border-radius: 2px;
    }
    p { font-size: 1.125rem; }
    .es { margin-top: 14px; font-size: 1rem; color: #5D6D7E; }
  </style>
</head>
<body>
  <main>
    <h1 class="name">AJ Construction Inc</h1>
    <div class="rule" aria-hidden="true"></div>
    <p>Our website is temporarily unavailable.<br>Please check back soon.</p>
    <p class="es" lang="es">Nuestro sitio web no está disponible temporalmente.<br>Vuelva a visitarnos pronto.</p>
  </main>
</body>
</html>`;

export default function middleware() {
  return new Response(page, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '86400',
      'Cache-Control': 'no-store',
    },
  });
}
