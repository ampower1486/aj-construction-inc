import { defineConfig } from 'vite';
import { resolve, dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const root = __dirname;
const page = (name) => resolve(root, name);

/**
 * Server-side HTML includes.
 *
 *   <!--#include "partials/header.html" -->
 *
 * The header and the Conect-R footer are written once and inlined into every
 * page at build time. That keeps them in one file to maintain while still
 * shipping real, crawlable markup — the nav links exist in the HTML source
 * rather than being injected by JavaScript after load.
 */
function htmlIncludes() {
  const PATTERN = /<!--#include\s+"([^"]+)"\s*-->/g;

  const expand = (html, fromDir, depth = 0) => {
    if (depth > 5) throw new Error('htmlIncludes: include nesting too deep');
    return html.replace(PATTERN, (_match, file) => {
      const target = join(fromDir, file);
      if (!existsSync(target)) {
        throw new Error(`htmlIncludes: missing partial "${file}"`);
      }
      const partial = readFileSync(target, 'utf8');
      return expand(partial, dirname(target), depth + 1);
    });
  };

  return {
    name: 'html-includes',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const dir = ctx?.filename ? dirname(ctx.filename) : root;
        return expand(html, dir);
      },
    },
    // Editing a partial should refresh the browser during `npm run dev`.
    handleHotUpdate({ file, server }) {
      if (file.includes('/partials/')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

/**
 * Hero reel, only if there is a video to play.
 *
 * index.html marks the reel's markup, its replay button and its no-flash head
 * script with <!--#reel-start--> / <!--#reel-end-->. When no video file exists
 * every one of those regions is stripped, so the page ships with no reel, no
 * replay control, no inline script and no request for a file that isn't there.
 * Drop the clip in and it wires itself up on the next load.
 */
function heroReel() {
  // MP4 wins if both exist — it is the one container every browser plays.
  const CANDIDATES = ['assets/video/intro.mp4', 'assets/video/intro.webm'];
  const REGION = /[ \t]*<!--#reel-start-->[\s\S]*?<!--#reel-end-->\n?/g;
  const DEFAULT_SRC = '/assets/video/intro.mp4';

  return {
    name: 'hero-reel',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const found = CANDIDATES.find((rel) => existsSync(resolve(root, 'public', rel)));
        if (!found) return html.replace(REGION, '');
        return html.replaceAll(DEFAULT_SRC, `/${found}`);
      },
    },
    configureServer(server) {
      // Adding or removing the clip changes the markup, so reload on either.
      server.watcher.add(resolve(root, 'public/assets/video'));
      const reload = (file) => {
        if (file.includes('/assets/video/')) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [htmlIncludes(), heroReel()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        home: page('index.html'),
        services: page('services.html'),
        gallery: page('gallery.html'),
        story: page('story.html'),
        quote: page('quote.html'),
        privacy: page('privacy-policy.html'),
        terms: page('terms-conditions.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
