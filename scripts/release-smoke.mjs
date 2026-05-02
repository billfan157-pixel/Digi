import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import path from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const distDir = path.resolve('dist');

async function getFreePort() {
  const server = createNetServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not allocate a free port for smoke test.');
  }
  const { port } = address;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // Static server is still starting.
    }
    await delay(250);
  }

  throw new Error(`Smoke server did not become ready: ${url}`);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.webmanifest':
      return 'application/manifest+json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function createStaticServer(port) {
  const server = createHttpServer(async (request, response) => {
    const urlPath = request.url === '/' ? '/index.html' : request.url || '/index.html';
    const relativePath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
    const filePath = path.resolve(distDir, relativePath);

    if (!filePath.startsWith(distDir) || !existsSync(filePath)) {
      response.statusCode = 404;
      response.setHeader('Connection', 'close');
      response.end('Not found');
      return;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.statusCode = 404;
      response.setHeader('Connection', 'close');
      response.end('Not found');
      return;
    }

    response.setHeader('Content-Type', getContentType(filePath));
    response.setHeader('Connection', 'close');
    createReadStream(filePath).pipe(response);
  });

  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

async function main() {
  if (!existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/index.html is missing. Run `npm run build` before `npm run smoke`.');
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = await createStaticServer(port);

  try {
    const response = await waitForServer(baseUrl);
    const html = await response.text();

    if (!html.includes('<div id="root"></div>')) {
      throw new Error('Built HTML is missing the root app container.');
    }

    const assetMatch = html.match(/\/assets\/[^"']+\.(?:js|css)/);
    if (!assetMatch) {
      throw new Error('Built HTML is missing compiled frontend assets.');
    }

    const assetResponse = await fetch(new URL(assetMatch[0], baseUrl));
    if (!assetResponse.ok) {
      throw new Error(`Compiled asset request failed: ${assetMatch[0]}`);
    }

    console.log(`Smoke test passed on ${baseUrl}`);
  } finally {
    server.closeAllConnections?.();
    server.close();
    await Promise.race([
      once(server, 'close'),
      delay(2000),
    ]);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
