/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);
  global.whenInSocket = io;

  io.use((socket, nextSocket) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const tokenCookie = cookieHeader.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith('token='));
    if (!tokenCookie) return nextSocket(new Error('Authentication required.'));

    let token;
    try {
      token = decodeURIComponent(tokenCookie.slice('token='.length));
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-change-me');
      if (!payload || typeof payload !== 'object' || typeof payload.userId !== 'string' || !/^[a-f\d]{24}$/i.test(payload.userId)) {
        return nextSocket(new Error('Invalid authentication token.'));
      }
      socket.data.userId = payload.userId;
      return nextSocket();
    } catch {
      return nextSocket(new Error('Invalid authentication token.'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  server.listen(port, hostname, () => {
    console.log(`WHEN IN server ready on http://${hostname}:${port}`);
  });
});
