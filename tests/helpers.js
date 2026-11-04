const http = require('node:http');
const app = require('../src/app');

let server;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => resolve());
  });
}

const { disconnect: disconnectRedis } = require('../src/config/redis');
const prisma = require('../src/config/database');

async function stopServer() {
  await new Promise((resolve) => server.close(resolve));
  await disconnectRedis().catch(() => {});
  await prisma.$disconnect().catch(() => {});
}

function getAddress() {
  return server.address();
}

function rawRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const addr = getAddress();
    const { method = 'GET', body, headers = {} } = options;
    const url = new URL(`http://localhost:${addr.port}${path}`);
    const req = http.request(url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
    req.on('error', reject);
  });
}

async function loginAs(email = 'admin@lms.com', password = 'password123') {
  const { body } = await rawRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return body.data.token;
}

async function makeRequest(path, options = {}, providedToken) {
  let token;
  if (options.noAuth) {
    token = null;
  } else if (providedToken) {
    token = providedToken;
  } else {
    token = await loginAs();
  }
  const { noAuth, ...rest } = options;
  return rawRequest(path, {
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    },
  });
}

module.exports = { startServer, stopServer, makeRequest, rawRequest, loginAs };