const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const PORT = 3080;
const JIRA_DOMAIN = (process.env.JIRA_DOMAIN || 'tms.netcracker.com').trim();
const JIRA_API_TOKEN = (process.env.JIRA_API_TOKEN || '').trim();
const JIRA_CONFIGURED = !!(JIRA_DOMAIN && JIRA_API_TOKEN);
const LOG_JIRA = /^(1|true|yes)$/i.test((process.env.LOG_JIRA || '').trim());
const VAULT_DIR = path.join(os.homedir(), 'vault');
process.env.VAULT_DIR = VAULT_DIR;

const vaultBot = require('./vault-bot.js');
const MIMES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function ensureVaultDir() {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }
}

const server = http.createServer((req, res) => {
  const reqPath = (req.url.split('?')[0] || '/').replace(/\/$/, '') || '/';

  if (reqPath === '/api/jira/projects' && req.method === 'GET') {
    if (!JIRA_CONFIGURED) {
      sendJson(res, 200, { configured: false, projects: [] });
      return;
    }
    if (LOG_JIRA) {
      console.log('[Jira] GET https://' + JIRA_DOMAIN + '/rest/api/2/project');
    }
    const opts = {
      hostname: JIRA_DOMAIN,
      path: '/rest/api/2/project',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + JIRA_API_TOKEN
      }
    };
    const jiraReq = https.request(opts, function (jiraRes) {
      const chunks = [];
      jiraRes.on('data', function (chunk) { chunks.push(chunk); });
      jiraRes.on('end', function () {
        const body = Buffer.concat(chunks).toString('utf8');
        if (LOG_JIRA) {
          console.log('[Jira] GET /rest/api/2/project -> ' + jiraRes.statusCode + (body.length < 250 ? ' body: ' + body : ' body length: ' + body.length));
        }
        if (jiraRes.statusCode !== 200) {
          try {
            const errBody = JSON.parse(body);
            sendJson(res, jiraRes.statusCode, { configured: true, projects: [], error: errBody.errorMessages ? errBody.errorMessages.join(' ') : body });
          } catch (_) {
            sendJson(res, jiraRes.statusCode, { configured: true, projects: [], error: body || 'Request failed' });
          }
          return;
        }
        try {
          const data = JSON.parse(body);
          const projects = Array.isArray(data) ? data.map(function (p) { return { key: p.key, name: p.name || p.key }; }) : [];
          sendJson(res, 200, { configured: true, projects: projects });
        } catch (e) {
          sendJson(res, 500, { configured: true, projects: [], error: 'Invalid response' });
        }
      });
    });
    jiraReq.on('error', function (err) {
      console.error('Jira projects error:', err.message);
      sendJson(res, 502, { configured: true, projects: [], error: err.message });
    });
    jiraReq.setTimeout(10000, function () {
      jiraReq.destroy();
      sendJson(res, 504, { configured: true, projects: [], error: 'Timeout' });
    });
    jiraReq.end();
    return;
  }

  if (reqPath === '/api/jira/filters' && req.method === 'GET') {
    if (!JIRA_CONFIGURED) {
      sendJson(res, 200, { configured: false, filters: [] });
      return;
    }
    function mapFilter(f) {
      return { id: f.id, name: f.name || ('Filter ' + f.id), jql: f.jql || '' };
    }
    function parseFilterList(data) {
      if (!data) return [];
      if (Array.isArray(data)) return data.map(mapFilter);
      var list = data.values || data.results;
      return Array.isArray(list) ? list.map(mapFilter) : [];
    }
    function tryFilters(path, parseBody) {
      return new Promise(function (resolve, reject) {
        const opts = {
          hostname: JIRA_DOMAIN,
          path: path,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + JIRA_API_TOKEN
          }
        };
        if (LOG_JIRA) {
          console.log('[Jira] GET https://' + JIRA_DOMAIN + path);
        }
        const jiraReq = https.request(opts, function (jiraRes) {
          const chunks = [];
          jiraRes.on('data', function (chunk) { chunks.push(chunk); });
          jiraRes.on('end', function () {
            const body = Buffer.concat(chunks).toString('utf8');
            if (LOG_JIRA) {
              console.log('[Jira] GET ' + path + ' -> ' + jiraRes.statusCode + ' body: ' + (body.length > 200 ? body.slice(0, 200) + '...' : body));
            }
            if (jiraRes.statusCode !== 200) {
              var errMsg = jiraRes.statusCode + ' ' + (body.slice(0, 200) || 'Request failed');
              console.error('Jira filters ' + path + ': ' + errMsg);
              reject(new Error(errMsg));
              return;
            }
            var trimmed = (body || '').trim();
            if (!trimmed || trimmed.charAt(0) !== '{' && trimmed.charAt(0) !== '[') {
              var notJsonMsg = 'Response was not JSON: ' + (trimmed.slice(0, 80) || 'empty');
              console.error('Jira filters ' + path + ': ' + notJsonMsg);
              reject(new Error(notJsonMsg));
              return;
            }
            try {
              const data = JSON.parse(body);
              resolve(parseBody(data));
            } catch (e) {
              console.error('Jira filters parse error:', e.message);
              reject(new Error('Invalid JSON: ' + (trimmed.slice(0, 60) || 'empty')));
            }
          });
        });
        jiraReq.on('error', function (err) {
          console.error('Jira filters request error:', err.message);
          reject(err);
        });
        jiraReq.setTimeout(10000, function () {
          jiraReq.destroy();
          reject(new Error('Timeout'));
        });
        jiraReq.end();
      });
    }
    function sendFilters(filters, errMsg) {
      sendJson(res, 200, { configured: true, filters: filters || [], error: errMsg || null });
    }
    var searchPath = '/rest/api/2/filter/search?maxResults=100&expand=jql';
    tryFilters(searchPath, parseFilterList)
      .then(function (filters) {
        if (filters.length > 0) {
          sendFilters(filters);
          return;
        }
        return tryFilters('/rest/api/2/filter/favourite', parseFilterList).then(function (fav) {
          if (fav.length > 0) {
            sendFilters(fav);
            return;
          }
          return tryFilters('/rest/api/2/filter/my', parseFilterList).then(function (my) {
            sendFilters(my || []);
          });
        });
      })
      .catch(function (e) {
        tryFilters('/rest/api/2/filter/favourite', parseFilterList)
          .then(function (fav) {
            if (fav.length > 0) {
              sendFilters(fav);
              return;
            }
            return tryFilters('/rest/api/2/filter/my', parseFilterList).then(function (my) {
              sendFilters(my || [], my && my.length === 0 ? e.message : null);
            });
          })
          .catch(function () {
            tryFilters('/rest/api/2/filter?maxResults=100', parseFilterList)
              .then(function (list) {
                sendFilters(list.length > 0 ? list : [], list.length === 0 ? e.message : null);
              })
              .catch(function (e2) {
                console.error('Jira filters error:', e.message, '| fallback:', e2.message);
                sendFilters([], e.message || e2.message || 'Failed to load filters');
              });
          });
      });
    return;
  }

  if (reqPath === '/api/jira/tickets' && req.method === 'GET') {
    const parsed = url.parse(req.url, true);
    const defaultJql = 'assignee=currentUser() AND status NOT IN (Closed, Resolved) ORDER BY updated DESC';
    const jql = (parsed.query && parsed.query.jql) || defaultJql;
    if (!JIRA_CONFIGURED) {
      sendJson(res, 200, { configured: false, issues: [], hint: 'Set JIRA_API_TOKEN (and optionally JIRA_DOMAIN, default: tms.netcracker.com) to enable.' });
      return;
    }
    const fields = 'summary,status,updated,created,duedate,issuetype,assignee,timeoriginalestimate,timetracking,priority,fixVersions,versions';
    const jiraPath = '/rest/api/2/search?maxResults=100&fields=' + encodeURIComponent(fields) + '&jql=' + encodeURIComponent(jql);
    if (LOG_JIRA) {
      console.log('[Jira] GET https://' + JIRA_DOMAIN + '/rest/api/2/search (jql length: ' + jql.length + ')');
    }
    const opts = {
      hostname: JIRA_DOMAIN,
      path: jiraPath,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + JIRA_API_TOKEN
      }
    };
    const jiraReq = https.request(opts, function (jiraRes) {
      const chunks = [];
      jiraRes.on('data', function (chunk) { chunks.push(chunk); });
      jiraRes.on('end', function () {
        const body = Buffer.concat(chunks).toString('utf8');
        if (LOG_JIRA) {
          console.log('[Jira] GET /rest/api/2/search -> ' + jiraRes.statusCode + ' body length: ' + body.length + (body.length < 300 ? ' ' + body : ''));
        }
        if (jiraRes.statusCode !== 200) {
          try {
            const errBody = JSON.parse(body);
            sendJson(res, jiraRes.statusCode, { configured: true, error: errBody.errorMessages ? errBody.errorMessages.join(' ') : body, issues: [] });
          } catch (_) {
            sendJson(res, jiraRes.statusCode, { configured: true, error: body || 'Jira request failed', issues: [] });
          }
          return;
        }
        try {
          const data = JSON.parse(body);
          sendJson(res, 200, { configured: true, baseUrl: 'https://' + JIRA_DOMAIN, issues: data.issues || [] });
        } catch (e) {
          sendJson(res, 500, { configured: true, error: 'Invalid Jira response', issues: [] });
        }
      });
    });
    jiraReq.on('error', function (err) {
      console.error('Jira request error:', err.message);
      sendJson(res, 502, { configured: true, error: err.message, issues: [] });
    });
    jiraReq.setTimeout(15000, function () {
      jiraReq.destroy();
      sendJson(res, 504, { configured: true, error: 'Jira request timeout', issues: [] });
    });
    jiraReq.end();
    return;
  }

  if (reqPath === '/api/bot/sync' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        const data = JSON.parse(body || '{}');
        vaultBot.handleSync(data.phone, data.data, res, sendJson);
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
    });
    req.on('error', () => sendJson(res, 500, { ok: false, error: 'Request error' }));
    return;
  }

  if (reqPath === '/webhook/whatsapp' && req.method === 'GET') {
    const parsed = url.parse(req.url, true);
    const mode = parsed.query && parsed.query['hub.mode'];
    const token = parsed.query && parsed.query['hub.verify_token'];
    const challenge = parsed.query && parsed.query['hub.challenge'];
    const result = vaultBot.verifyWebhook(mode, token, challenge);
    if (result != null) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(result);
    } else {
      res.writeHead(403);
      res.end('Forbidden');
    }
    return;
  }

  if (reqPath === '/webhook/whatsapp' && req.method === 'POST') {
    if (!vaultBot.BOT_ENABLED) {
      sendJson(res, 200, {}); return;
    }
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const parsed = vaultBot.parseIncomingWebhook(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({}));
      if (parsed) {
        vaultBot.handleWhatsAppMessage(parsed.from, parsed.text, function () {});
      }
    });
    req.on('error', () => { res.writeHead(200); res.end('{}'); });
    return;
  }

  if (reqPath === '/backup' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        const data = JSON.parse(body || '{}');
        ensureVaultDir();
        const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
        const filename = 'vault-lite-export-' + ts + '.json';
        const outPath = path.join(VAULT_DIR, filename);
        fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
        sendJson(res, 200, { ok: true, path: outPath, folder: VAULT_DIR });
      } catch (err) {
        console.error('Backup error:', err.message);
        sendJson(res, 500, { error: err.message });
      }
    });
    req.on('error', (err) => {
      console.error('Backup request error:', err.message);
      sendJson(res, 500, { error: err.message });
    });
    return;
  }

  const file = reqPath === '/' ? 'index.html' : reqPath.replace(/^\//, '');
  const filePath = path.join(__dirname, file);
  const ext = path.extname(filePath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.setHeader('Content-Type', MIMES[ext] || 'application/octet-stream');
  // Always serve latest app assets to avoid stale UI after relaunch.
  if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json' || ext === '.svg' || ext === '.png' || ext === '.ico') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  res.end(fs.readFileSync(filePath));
});

const LOCAL_ALIAS = 'vault.lite.app';

server.listen(PORT, () => {
  console.log('Vault Lite running at http://localhost:' + PORT);
  console.log('If you added the hosts alias: http://' + LOCAL_ALIAS + ':' + PORT);
  console.log('Backup folder: ' + VAULT_DIR);
  console.log('Logs: this terminal (stdout/stderr). Jira request/response: set LOG_JIRA=1 to enable.');
  if (vaultBot.BOT_ENABLED) console.log('WhatsApp vault-bot: webhook /webhook/whatsapp enabled');
  else console.log('WhatsApp bot: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_ID to enable');
});
