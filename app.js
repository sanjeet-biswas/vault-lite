(function () {
  'use strict';

  const STORAGE_KEY = 'vault-lite-data';
  const STORAGE_KEY_PERSONAL = 'vault-lite-data-personal';
  const STORAGE_KEY_RECORDS = 'vault-lite-data-personal-records';
  const IDB_RECORDS_DB = 'vault-lite-db';
  const IDB_RECORDS_STORE = 'records';
  const IDB_RECORDS_KEY = 'data';
  const STORAGE_KEY_MODE = 'vault-lite-mode';
  const STORAGE_KEY_PIN = 'vault-lite-pin-hash';
  const STORAGE_KEY_SESSION = 'vault-lite-session-key';
  const STORAGE_KEY_RECORDS_VIEW = 'vault-lite-records-view';
  const STORAGE_KEY_CREDENTIALS_VIEW = 'vault-lite-credentials-view';
  const STORAGE_KEY_BMS_VIEW = 'vault-lite-bms-view';
  const STORAGE_KEY_BMS_JQL_FAVOURITES = 'vault-lite-bms-jql-favourites';
  const STORAGE_KEY_CHATBOT_WELCOME_SHOWN = 'vault-lite-chatbot-welcome-shown';
  const BMS_PROJECT_KEY = 'RKTNBSS';
  const RECORDS_MAX_FILE_SIZE = 25 * 1024 * 1024;
  var RECORDS_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'json', 'xml', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];
  var RECORDS_ALLOWED_MIME_PREFIXES = ['application/pdf', 'application/msword', 'application/vnd.', 'text/', 'image/', 'application/json', 'application/xml'];
  const IDLE_MS = 10 * 60 * 1000;
  const EXPORT_VERSION = 1;

  var revealedUsernames = {};
  var lastActivity = 0;
  var idleTimerId = null;
  var isUnlocked = false;
  var currentMode = 'work';
  var sessionEncryptionKey = null;
  var dataCache = {};
  var bmsLastData = { issues: [], baseUrl: '' };
  var bmsFilteredCache = [];
  var bmsCurrentPage = 0;
  var BMS_PAGE_SIZE = 10;
  var bmsFilterSelected = { assignee: [], status: [], type: [], fixVersion: [], priority: [] };
  var bmsFiltersCache = [];
  var iconEdit = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M11.3 1.3l3.4 3.4-9.2 9.2L2 15l.1-3.5 9.2-9.2zM10 2L2 10l.6 2.4L12 6 10 2z"/></svg>';
  var iconCopy = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M5.5 1A1.5 1.5 0 0 0 4 2.5v9A1.5 1.5 0 0 0 5.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 1h-7zM5 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-9zm2 1.5v1h5V4H7zm0 2v1h5V6H7zm0 2v1h3V8H7z"/><path d="M2.5 5A1.5 1.5 0 0 0 1 6.5V14a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 11 14V6.5A1.5 1.5 0 0 0 9.5 5H8v1h1.5a.5.5 0 0 1 .5.5V14a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V6.5a.5.5 0 0 1 .5-.5H4V5H2.5z"/></svg>';
  var iconTrash = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M5 2L11 2Q12 2 12 3L12 3.5 4 3.5 4 3Q4 2 5 2z M5 3.5L11 3.5 11.5 12.5Q12 13 11 13L5 13Q4 13 4.5 12.5L4.5 3.5z M6.5 5v6h1V5h-1z M9 5v6h1V5H9z"/></svg>';
  var iconUser = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 8c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 1.5c-2.5 0-7 1.2-7 3.5V14h14v-1c0-2.3-4.5-3.5-7-3.5z"/></svg>';
  var iconKey = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" fill-rule="evenodd"><path d="M4 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM6.5 7H11.5v2H6.5V7zm5 0l1.5.25L11.5 7.5 13 7.75 11.5 8 13 8.5 11.5 9v-2z"/></svg>';
  var iconEye = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 4c3.5 0 6 3 7 4-1 1-3.5 4-7 4s-6-3-7-4c1-1 3.5-4 7-4zm0 1.5C5.3 5.5 3.2 7.6 2.5 8c.7.4 2.8 2.5 5.5 2.5s4.8-2.1 5.5-2.5c-.7-.4-2.8-2.5-5.5-2.5zM8 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>';
  var iconEyeOff = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 8c0 0 2-3 6-3s6 3 6 3-2 3-6 3-6-3-6-3zm6 2a2 2 0 100-4 2 2 0 000 4z"/><path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
  var iconDownload = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 10.5l4-4H10V2H6v4.5H4L8 10.5zM2 12v2h12v-2H2z"/></svg>';
  var iconList = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 3h2v2H2V3zm0 4h2v2H2V7zm0 4h2v2H2v-2zm4-8h8v1H6V3zm0 4h8v1H6V7zm0 4h8v1H6v-1z"/></svg>';
  var iconGrid = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z"/></svg>';

  var iconFilePdf = '<svg class="record-file-icon record-file-icon--pdf" viewBox="0 0 32 32" aria-hidden="true"><path fill="#E53935" d="M6 2v28h20V10l-8-8H6zm2 2h6v6h6v16H8V4zm8 2.4L21.6 10H16V6.4z"/><path fill="#C62828" d="M10 14h4v2h-4v-2zm0 4h8v2h-8v-2zm0 4h6v2h-6v-2z"/></svg>';
  var iconFileWord = '<svg class="record-file-icon record-file-icon--word" viewBox="0 0 32 32" aria-hidden="true"><path fill="#2B579A" d="M6 2v28h20V10l-8-8H6zm2 2h6v6h6v16H8V4zm8 2.4L21.6 10H16V6.4z"/><path fill="#fff" d="M11.2 14l1.2 6 1.4-4 1 3.2 1.2-5.2h1.4l-1.8 7h-1.4l-1.2-3.8-1.1 3.8h-1.4L9 14h1.2z"/></svg>';
  var iconFileExcel = '<svg class="record-file-icon record-file-icon--excel" viewBox="0 0 32 32" aria-hidden="true"><path fill="#217346" d="M6 2v28h20V10l-8-8H6zm2 2h6v6h6v16H8V4zm8 2.4L21.6 10H16V6.4z"/><path fill="#fff" d="M11 14h2.5l1.2 2.2 1.2-2.2H18l-2.2 3.2 2.2 3.2h-2.5l-1.2-2.1-1.2 2.1H11l2.2-3.2L11 14zm8 0h1.5v6.4H22V19h-3z"/></svg>';
  var iconFilePpt = '<svg class="record-file-icon record-file-icon--ppt" viewBox="0 0 32 32" aria-hidden="true"><path fill="#D24726" d="M6 2v28h20V10l-8-8H6zm2 2h6v6h6v16H8V4zm8 2.4L21.6 10H16V6.4z"/><path fill="#fff" d="M11 14h4c1.2 0 2 .8 2 2s-.8 2-2 2h-2v2.4h-2V14zm2 1.2v1.6h2c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-2zm6-1.2h4c1.2 0 2 .8 2 2s-.8 2-2 2h-2v2.4h-2V14zm2 1.2v1.6h2c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-2z"/></svg>';
  var iconFileImage = '<svg class="record-file-icon record-file-icon--image" viewBox="0 0 32 32" aria-hidden="true"><path fill="#5C6BC0" d="M6 2v28h20V2H6zm2 2h16v16h-2.4l-3-4-2 2.6-2.6-3.5L8 22V4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>';
  var iconFileText = '<svg class="record-file-icon record-file-icon--text" viewBox="0 0 32 32" aria-hidden="true"><path fill="#78909C" d="M6 2v28h20V10l-8-8H6zm2 2h6v6h6v16H8V4zm8 2.4L21.6 10H16V6.4z"/><path fill="#fff" d="M11 14h10v1.5H11V14zm0 3h10v1.5H11V17zm0 3h7v1.5h-7V20z"/></svg>';
  var iconFileGeneric = '<svg class="record-file-icon record-file-icon--generic" viewBox="0 0 32 32" aria-hidden="true"><path fill="#90A4AE" d="M6 2v28h20V10l-8-8H6zm2 2h6v6h6v16H8V4zm8 2.4L21.6 10H16V6.4z"/></svg>';

  function getRecordFileIcon(record) {
    var mime = (record.mimeType || '').toLowerCase();
    var name = (record.fileName || '').toLowerCase();
    var ext = name.indexOf('.') !== -1 ? name.split('.').pop() : '';
    if (mime.indexOf('pdf') !== -1 || ext === 'pdf') return iconFilePdf;
    if (mime.indexOf('image') !== -1 || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].indexOf(ext) !== -1) return iconFileImage;
    if (mime.indexOf('text') === 0 || ['txt', 'md', 'csv', 'json', 'xml'].indexOf(ext) !== -1) return iconFileText;
    if (mime.indexOf('word') !== -1 || mime.indexOf('document') !== -1 || ['doc', 'docx'].indexOf(ext) !== -1) return iconFileWord;
    if (mime.indexOf('sheet') !== -1 || mime.indexOf('excel') !== -1 || ['xls', 'xlsx'].indexOf(ext) !== -1) return iconFileExcel;
    if (mime.indexOf('presentation') !== -1 || mime.indexOf('powerpoint') !== -1 || ['ppt', 'pptx'].indexOf(ext) !== -1) return iconFilePpt;
    return iconFileGeneric;
  }

  var recordPreviewBlobUrl = null;
  function showRecordPreview(rec) {
    var modal = document.getElementById('recordPreviewModal');
    var titleEl = document.getElementById('recordPreviewTitle');
    var contentEl = document.getElementById('recordPreviewContent');
    if (!modal || !titleEl || !contentEl) return;
    if (recordPreviewBlobUrl) { URL.revokeObjectURL(recordPreviewBlobUrl); recordPreviewBlobUrl = null; }
    titleEl.textContent = rec.description || rec.fileName || 'Preview';
    contentEl.innerHTML = '';
    var mime = (rec.mimeType || '').toLowerCase();
    var name = (rec.fileName || '').toLowerCase();
    var ext = name.indexOf('.') !== -1 ? name.split('.').pop() : '';
    try {
      var binary = atob(rec.contentBase64 || '');
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var blob = new Blob([bytes], { type: rec.mimeType || 'application/octet-stream' });
      recordPreviewBlobUrl = URL.createObjectURL(blob);
      if (mime.indexOf('image/') === 0) {
        var img = document.createElement('img');
        img.src = recordPreviewBlobUrl;
        img.alt = rec.fileName || 'Preview';
        contentEl.appendChild(img);
      } else if (mime === 'application/pdf' || ext === 'pdf') {
        var iframe = document.createElement('iframe');
        iframe.src = recordPreviewBlobUrl;
        iframe.title = rec.fileName || 'PDF';
        contentEl.appendChild(iframe);
      } else if (mime.indexOf('text/') === 0 || ['txt', 'md', 'csv', 'json', 'xml', 'html'].indexOf(ext) !== -1) {
        var reader = new FileReader();
        reader.onload = function () {
          var pre = document.createElement('pre');
          pre.textContent = reader.result;
          contentEl.appendChild(pre);
          if (recordPreviewBlobUrl) { URL.revokeObjectURL(recordPreviewBlobUrl); recordPreviewBlobUrl = null; }
        };
        reader.readAsText(blob);
      } else {
        contentEl.innerHTML = '<p class="preview-unavailable">Preview not available for this file type. Use Download to open the file.</p>';
        URL.revokeObjectURL(recordPreviewBlobUrl);
        recordPreviewBlobUrl = null;
      }
    } catch (e) {
      contentEl.innerHTML = '<p class="preview-unavailable">Unable to load preview.</p>';
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeRecordPreview() {
    var modal = document.getElementById('recordPreviewModal');
    if (recordPreviewBlobUrl) { URL.revokeObjectURL(recordPreviewBlobUrl); recordPreviewBlobUrl = null; }
    if (modal) { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); }
  }

  function getDataKey() { return currentMode === 'work' ? STORAGE_KEY : STORAGE_KEY_PERSONAL; }
  function getStoredMode() { var m = localStorage.getItem(STORAGE_KEY_MODE); return m === 'personal' ? 'personal' : 'work'; }
  function setStoredMode(mode) { localStorage.setItem(STORAGE_KEY_MODE, mode); }
  function getRecordsView() { var v = localStorage.getItem(STORAGE_KEY_RECORDS_VIEW); return v === 'list' ? 'list' : 'card'; }
  function setRecordsView(view) { localStorage.setItem(STORAGE_KEY_RECORDS_VIEW, view); }
  function getCredentialsView() { var v = localStorage.getItem(STORAGE_KEY_CREDENTIALS_VIEW); return v === 'grid' ? 'grid' : 'list'; }
  function setCredentialsView(view) { localStorage.setItem(STORAGE_KEY_CREDENTIALS_VIEW, view); }
  function getBMSView() { var v = localStorage.getItem(STORAGE_KEY_BMS_VIEW); return v === 'list' ? 'list' : 'grid'; }
  function setBMSView(view) { localStorage.setItem(STORAGE_KEY_BMS_VIEW, view); }
  function getBMSJqlFavourites() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_BMS_JQL_FAVOURITES);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function setBMSJqlFavourites(arr) {
    try { localStorage.setItem(STORAGE_KEY_BMS_JQL_FAVOURITES, JSON.stringify(Array.isArray(arr) ? arr : [])); } catch (_) {}
  }
  function getStoredPinHash() { return localStorage.getItem(STORAGE_KEY_PIN); }
  function setStoredPinHash(hash) { localStorage.setItem(STORAGE_KEY_PIN, hash); }

  function saveSessionKey(key) {
    return crypto.subtle.exportKey('raw', key).then(function (buf) {
      var b64 = bytesToBase64(new Uint8Array(buf));
      try { localStorage.setItem(STORAGE_KEY_SESSION, b64); } catch (_) {}
      try { sessionStorage.setItem(STORAGE_KEY_SESSION, b64); } catch (_) {}
    }).catch(function () {});
  }
  function restoreSessionKey() {
    var raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (!raw || typeof raw !== 'string' || raw.length === 0) raw = sessionStorage.getItem(STORAGE_KEY_SESSION);
    } catch (e) { return Promise.resolve(null); }
    if (!raw || typeof raw !== 'string' || raw.length === 0) return Promise.resolve(null);
    try {
      var decoded = atob(raw);
      var arr = new Uint8Array(decoded.length);
      for (var i = 0; i < decoded.length; i++) arr[i] = decoded.charCodeAt(i);
      return crypto.subtle.importKey('raw', arr, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']).then(function (k) { return k; }, function () {
        try { localStorage.removeItem(STORAGE_KEY_SESSION); sessionStorage.removeItem(STORAGE_KEY_SESSION); } catch (_) {}
        return null;
      });
    } catch (e) { return Promise.resolve(null); }
  }

  function hashPin(pin) {
    var str = String(pin);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
      .then(function (buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
  }
  function deriveKeyFromPin(pin) {
    var str = String(pin);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
      .then(function (hashBuffer) {
        return crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      });
  }
  function bytesToBase64(bytes) {
    var chunkSize = 8192;
    var binary = '';
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var chunk = bytes.subarray ? bytes.subarray(i, i + chunkSize) : bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }
  function encryptPlaintext(plaintext, key) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var encoded = new TextEncoder().encode(plaintext);
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, encoded)
      .then(function (ciphertext) {
        var combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);
        return bytesToBase64(combined);
      });
  }
  function decryptToPlaintext(b64, key) {
    try {
      var decoded = atob(b64);
      var combined = new Uint8Array(decoded.length);
      for (var i = 0; i < decoded.length; i++) combined[i] = decoded.charCodeAt(i);
      if (combined.length < 13) return Promise.reject(new Error('too short'));
      var iv = combined.slice(0, 12);
      var ciphertext = combined.slice(12);
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, ciphertext)
        .then(function (decoded) { return new TextDecoder().decode(decoded); });
    } catch (e) { return Promise.reject(e); }
  }

  function openRecordsDB() {
    return new Promise(function (resolve, reject) {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB not supported')); return; }
      var req = indexedDB.open(IDB_RECORDS_DB, 1);
      req.onerror = function () { reject(req.error); };
      req.onsuccess = function () { resolve(req.result); };
      req.onupgradeneeded = function (e) {
        if (!e.target.result.objectStoreNames.contains(IDB_RECORDS_STORE)) {
          e.target.result.createObjectStore(IDB_RECORDS_STORE);
        }
      };
    });
  }
  function parseRecordsRaw(raw) {
    if (!raw || (typeof raw === 'string' && raw.trim() === '')) return [];
    try { var parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; }
  }
  function loadRecordsIntoCache() {
    var key = STORAGE_KEY_RECORDS;
    function setCache(arr) { dataCache[key] = arr; return Promise.resolve(); }
    function decryptAndParse(raw) {
      if (!sessionEncryptionKey) return Promise.resolve(parseRecordsRaw(raw));
      var trimmed = (raw || '').trim();
      if (trimmed.charAt(0) === '[') return Promise.resolve(parseRecordsRaw(raw));
      return decryptToPlaintext(raw, sessionEncryptionKey).then(function (text) { return parseRecordsRaw(text); }).catch(function () { return parseRecordsRaw(raw); });
    }
    return openRecordsDB()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(IDB_RECORDS_STORE, 'readonly');
          var req = tx.objectStore(IDB_RECORDS_STORE).get(IDB_RECORDS_KEY);
          req.onsuccess = function () {
            var raw = req.result;
            if (raw != null && raw !== '') {
              decryptAndParse(raw).then(function (arr) { dataCache[key] = arr; resolve(); });
            } else {
              var localRaw = localStorage.getItem(STORAGE_KEY_RECORDS);
              if (localRaw && localRaw.trim() !== '') {
                decryptAndParse(localRaw).then(function (arr) {
                  dataCache[key] = arr;
                  saveRecords(arr).then(function () { try { localStorage.removeItem(STORAGE_KEY_RECORDS); } catch (_) {} resolve(); }, function () { resolve(); });
                });
              } else { dataCache[key] = []; resolve(); }
            }
          };
          req.onerror = function () { reject(req.error); };
        });
      })
      .catch(function () {
        var raw = localStorage.getItem(STORAGE_KEY_RECORDS);
        return decryptAndParse(raw || '').then(setCache);
      });
  }
  function getRecords() { var list = dataCache[STORAGE_KEY_RECORDS]; return Array.isArray(list) ? list : []; }
  function saveRecords(records) {
    dataCache[STORAGE_KEY_RECORDS] = records;
    var json = JSON.stringify(records, null, 2);
    function setStorage(value) {
      try { localStorage.setItem(STORAGE_KEY_RECORDS, value); } catch (e) { return Promise.reject(e); }
      return Promise.resolve();
    }
    if (!sessionEncryptionKey) return setStorage(json);
    return encryptPlaintext(json, sessionEncryptionKey).then(function (encrypted) {
      return openRecordsDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(IDB_RECORDS_STORE, 'readwrite');
          var req = tx.objectStore(IDB_RECORDS_STORE).put(encrypted, IDB_RECORDS_KEY);
          req.onsuccess = function () { resolve(); };
          req.onerror = function () { reject(req.error); };
        });
      }).catch(function () { return setStorage(encrypted); });
    });
  }
  function addRecord(description, fileName, contentBase64, mimeType) {
    var records = getRecords();
    var desc = (description || '').trim();
    var fname = fileName || 'document';
    var fnameNorm = String(fname).toLowerCase();
    var now = new Date().toISOString();
    var existing = records.find(function (r) { return String(r.fileName || '').toLowerCase() === fnameNorm; });
    if (existing) {
      existing.description = desc;
      existing.contentBase64 = contentBase64 || '';
      existing.mimeType = mimeType || 'application/octet-stream';
      existing.modifiedAt = now;
      return saveRecords(records).then(function () { renderRecordsList(); return { updated: true }; });
    }
    records.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      description: desc,
      fileName: fname,
      contentBase64: contentBase64 || '',
      mimeType: mimeType || 'application/octet-stream',
      createdAt: now,
      modifiedAt: now
    });
    return saveRecords(records).then(function () { renderRecordsList(); return { updated: false }; });
  }
  function removeRecord(id) {
    var records = getRecords().filter(function (r) { return r.id !== id; });
    return saveRecords(records).then(renderRecordsList);
  }
  function formatRecordDate(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function loadData() { var key = getDataKey(); var out = dataCache[key]; if (!out) return { entries: [], informations: [] }; return out; }
  function getDataByKey(key) { var out = dataCache[key]; if (!out) return { entries: [], informations: [] }; return out; }
  function saveData(data) {
    var key = getDataKey();
    dataCache[key] = data;
    var json = JSON.stringify(data, null, 2);
    if (!sessionEncryptionKey) { localStorage.setItem(key, json); return Promise.resolve(); }
    return encryptPlaintext(json, sessionEncryptionKey).then(function (encrypted) { localStorage.setItem(key, encrypted); });
  }
  function saveDataToKey(key, data) {
    dataCache[key] = data;
    var json = JSON.stringify(data, null, 2);
    if (!sessionEncryptionKey) { localStorage.setItem(key, json); return Promise.resolve(); }
    return encryptPlaintext(json, sessionEncryptionKey).then(function (encrypted) { localStorage.setItem(key, encrypted); });
  }

  function loadAllIntoCache() {
    var keys = [STORAGE_KEY, STORAGE_KEY_PERSONAL];
    var defaultData = { entries: [], informations: [] };
    return Promise.all(keys.map(function (key) {
      var raw = localStorage.getItem(key);
      if (!raw || (typeof raw === 'string' && raw.trim() === '')) {
        dataCache[key] = defaultData;
        return Promise.resolve();
      }
      if (!sessionEncryptionKey) {
        try {
          dataCache[key] = JSON.parse(raw);
          if (!dataCache[key].entries) dataCache[key].entries = [];
          if (!dataCache[key].informations) dataCache[key].informations = [];
        } catch (_) { dataCache[key] = defaultData; }
        return Promise.resolve();
      }
      var trimmed = raw.trim();
      if (trimmed.charAt(0) === '{') {
        try {
          dataCache[key] = JSON.parse(raw);
          if (!dataCache[key].entries) dataCache[key].entries = [];
          if (!dataCache[key].informations) dataCache[key].informations = [];
        } catch (_) { dataCache[key] = defaultData; }
        return Promise.resolve();
      }
      return decryptToPlaintext(raw, sessionEncryptionKey)
        .then(function (text) {
          var parsed = JSON.parse(text);
          dataCache[key] = { entries: parsed.entries || [], informations: parsed.informations || [] };
        })
        .catch(function () {
          try {
            dataCache[key] = JSON.parse(raw);
            if (!dataCache[key].entries) dataCache[key].entries = [];
            if (!dataCache[key].informations) dataCache[key].informations = [];
          } catch (_) { dataCache[key] = defaultData; }
        });
    })).then(function () { return loadRecordsIntoCache(); });
  }

  function addEntry(label, username, password) {
    var data = loadData();
    data.entries.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), label: label.trim(), username: username.trim(), password: password, createdAt: new Date().toISOString() });
    saveData(data).then(renderList);
  }
  function removeEntry(id) { var data = loadData(); data.entries = data.entries.filter(function (e) { return e.id !== id; }); saveData(data).then(renderList); }
  function addInformation(type, title, content) {
    var data = loadData();
    if (!data.informations) data.informations = [];
    data.informations.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), type: type, title: title.trim(), content: (content || '').trim(), createdAt: new Date().toISOString() });
    saveData(data).then(renderInfoList);
  }
  function removeInformation(id) { var data = loadData(); data.informations = (data.informations || []).filter(function (e) { return e.id !== id; }); saveData(data).then(renderInfoList); }
  function updateInformation(id, type, title, content) {
    var data = loadData();
    var arr = data.informations || [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) { arr[i].type = type; arr[i].title = (title || '').trim(); arr[i].content = (content || '').trim(); break; }
    }
    saveData(data).then(renderInfoList);
  }

  function copyToClipboard(text, buttonEl) {
    navigator.clipboard.writeText(text).then(function () {
      if (buttonEl && buttonEl.classList) {
        buttonEl.classList.add('copy-success');
        setTimeout(function () { buttonEl.classList.remove('copy-success'); }, 600);
      }
    });
  }
  function maskUsername(s) { if (!s || s.length <= 8) return s; return s.slice(0, 8) + '•'.repeat(Math.min(s.length - 8, 12)); }
  function maskPassword(s) { if (!s) return ''; return '•'.repeat(Math.min(s.length, 12)); }
  function escapeHtml(s) { var div = document.createElement('div'); div.textContent = s; return div.innerHTML; }
  function safeUrlLink(url) {
    var u = (url || '').trim();
    if (!u) return escapeHtml(u);
    var lower = u.toLowerCase();
    if (lower.indexOf('http://') !== 0 && lower.indexOf('https://') !== 0) u = 'https://' + u;
    var escaped = escapeHtml(u);
    return '<a href="' + escaped + '" target="_blank" rel="noopener noreferrer" class="info-link">' + escaped + '</a>';
  }

  var notificationHideTimer = null;
  function hideNotification() {
    var bar = document.getElementById('notificationBar');
    if (!bar) return;
    bar.classList.remove('visible');
    bar.setAttribute('aria-hidden', 'true');
    if (notificationHideTimer) { clearTimeout(notificationHideTimer); notificationHideTimer = null; }
  }
  function showNotification(message, type, duration) {
    var bar = document.getElementById('notificationBar');
    var msgEl = document.getElementById('notificationMessage');
    if (!bar || !msgEl) return;
    if (notificationHideTimer) { clearTimeout(notificationHideTimer); notificationHideTimer = null; }
    bar.classList.remove('success', 'error', 'info');
    bar.classList.add(type === 'success' || type === 'error' ? type : 'info');
    msgEl.textContent = message;
    bar.classList.add('visible');
    bar.setAttribute('aria-hidden', 'false');
    var d = duration === undefined ? 4000 : duration;
    if (d > 0) notificationHideTimer = setTimeout(hideNotification, d);
  }
  if (typeof window !== 'undefined') window.showNotification = showNotification;

  var iconWork = '<svg class="mode-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/></svg>';
  var iconModeArrow = '<svg class="mode-icon mode-icon-arrow" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 12l4-4v3h8v2H8v3l-4-4zm16 0l-4 4v-3H8v-2h8v-3l4 4z"/></svg>';
  var iconPersonal = '<svg class="mode-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/></svg>';

  var jiraConnectivityProbeId = 0;
  function probeJiraConnectivity(callback) {
    var reqId = ++jiraConnectivityProbeId;
    fetch('/api/jira/projects')
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        }).catch(function () {
          return { ok: false, data: null };
        });
      })
      .then(function (result) {
        if (reqId !== jiraConnectivityProbeId) return;
        var d = result.data;
        var usable = !!(result.ok && d && d.configured === true && !d.error);
        callback(usable);
      })
      .catch(function () {
        if (reqId !== jiraConnectivityProbeId) return;
        callback(false);
      });
  }

  function showApp() {
    if (sessionEncryptionKey) saveSessionKey(sessionEncryptionKey).catch(function () {});
    isUnlocked = true;
    currentMode = getStoredMode();
    var pinScreen = document.getElementById('pinScreen');
    var appContent = document.getElementById('appContent');
    var chatbotWrap = document.getElementById('vaultChatbotWrap');
    if (pinScreen) pinScreen.classList.add('hidden');
    if (appContent) { appContent.classList.remove('hidden'); appContent.style.display = ''; }
    if (chatbotWrap) { chatbotWrap.classList.remove('hidden'); chatbotWrap.setAttribute('aria-hidden', 'false'); }
    resetIdleTimer();
    startIdleTimer();
    updateModeToggle();
    renderList();
    renderInfoList();
  }
  function updateModeToggle() {
    var btn = document.getElementById('modeToggle');
    var iconEl = document.getElementById('modeIcon');
    var tabRecords = document.getElementById('tabRecords');
    var panelRecords = document.getElementById('panelRecords');
    var tabBMS = document.getElementById('tabBMS');
    var panelBMS = document.getElementById('panelBMS');
    if (!btn || !iconEl) return;
    btn.classList.add('active');
    iconEl.innerHTML = '<span class="mode-icon-wrap mode-icon-work' + (currentMode === 'work' ? ' active' : '') + '">' + iconWork + '</span>' +
      '<span class="mode-icon-wrap mode-icon-arrow">' + iconModeArrow + '</span>' +
      '<span class="mode-icon-wrap mode-icon-personal' + (currentMode === 'personal' ? ' active' : '') + '">' + iconPersonal + '</span>';
    if (currentMode === 'work') {
      btn.title = 'Switch to Personal';
      if (tabRecords) tabRecords.style.display = 'none';
      if (tabBMS) tabBMS.style.display = 'none';
      if (tabRecords && tabRecords.classList.contains('active')) {
        tabRecords.classList.remove('active');
        if (panelRecords) panelRecords.classList.remove('active');
      }
      setActiveTab('tabCredentials', 'panelCredentials');
      probeJiraConnectivity(function (available) {
        if (currentMode !== 'work') return;
        if (available) {
          if (tabBMS) tabBMS.style.display = '';
          setActiveTab('tabBMS', 'panelBMS');
          loadBMSFilters();
          renderBMSList();
        } else {
          if (tabBMS) tabBMS.style.display = 'none';
          if (tabBMS && tabBMS.classList.contains('active')) {
            tabBMS.classList.remove('active');
            if (panelBMS) panelBMS.classList.remove('active');
            setActiveTab('tabCredentials', 'panelCredentials');
          }
        }
      });
    } else {
      btn.title = 'Switch to Work';
      if (tabRecords) tabRecords.style.display = '';
      if (tabBMS) tabBMS.style.display = 'none';
      if (tabBMS && tabBMS.classList.contains('active')) {
        var tabCred = document.getElementById('tabCredentials');
        var panelCred = document.getElementById('panelCredentials');
        if (tabCred) { tabCred.classList.add('active'); panelCred.classList.add('active'); }
        tabBMS.classList.remove('active');
        if (panelBMS) panelBMS.classList.remove('active');
      }
      renderRecordsList();
    }
  }
  function showPinScreen() {
    isUnlocked = false;
    sessionEncryptionKey = null;
    dataCache = {};
    try { localStorage.removeItem(STORAGE_KEY_SESSION); sessionStorage.removeItem(STORAGE_KEY_SESSION); } catch (_) {}
    if (idleTimerId) { clearInterval(idleTimerId); idleTimerId = null; }
    var pinScreen = document.getElementById('pinScreen');
    var appContent = document.getElementById('appContent');
    var chatbotWrap = document.getElementById('vaultChatbotWrap');
    var chatbotPanel = document.getElementById('vaultChatbotPanel');
    if (pinScreen) pinScreen.classList.remove('hidden');
    if (appContent) { appContent.classList.add('hidden'); appContent.style.display = 'none'; }
    if (chatbotWrap) { chatbotWrap.classList.add('hidden'); chatbotWrap.setAttribute('aria-hidden', 'true'); }
    if (chatbotPanel) { chatbotPanel.classList.add('hidden'); chatbotPanel.setAttribute('aria-hidden', 'true'); }
    if (getStoredPinHash()) {
      var pinCreate = document.getElementById('pinCreate');
      var pinEnter = document.getElementById('pinEnter');
      if (pinCreate) pinCreate.style.display = 'none';
      if (pinEnter) pinEnter.style.display = 'block';
      var pinInput = document.getElementById('pinInput');
      if (pinInput) { pinInput.value = ''; pinInput.classList.remove('invalid', 'shake', 'valid'); pinInput.focus(); }
    } else {
      var pinCreate = document.getElementById('pinCreate');
      var pinEnter = document.getElementById('pinEnter');
      if (pinCreate) pinCreate.style.display = 'block';
      if (pinEnter) pinEnter.style.display = 'none';
      var newPin = document.getElementById('newPin');
      var confirmPin = document.getElementById('confirmPin');
      if (newPin) newPin.value = '';
      if (confirmPin) confirmPin.value = '';
      if (newPin) newPin.focus();
    }
  }
  function resetIdleTimer() { if (!isUnlocked) return; lastActivity = Date.now(); }
  function lock() { showPinScreen(); }
  function startIdleTimer() {
    lastActivity = Date.now();
    if (idleTimerId) clearInterval(idleTimerId);
    idleTimerId = setInterval(function () { if (Date.now() - lastActivity >= IDLE_MS) lock(); }, 30000);
  }

  function updateCredentialsViewToggle() {
    var view = getCredentialsView();
    var btn = document.getElementById('credentialsViewToggle');
    if (!btn) return;
    if (view === 'list') {
      btn.innerHTML = iconGrid;
      btn.title = 'Switch to grid view';
      btn.setAttribute('aria-label', 'Switch to grid view');
    } else {
      btn.innerHTML = iconList;
      btn.title = 'Switch to list view';
      btn.setAttribute('aria-label', 'Switch to list view');
    }
  }
  function renderList() {
    var data = loadData();
    var listEl = document.getElementById('list');
    var searchEl = document.getElementById('search');
    var query = (searchEl && searchEl.value || '').trim().toLowerCase();
    var entries = data.entries;
    if (query) entries = entries.filter(function (e) { return (e.label || '').toLowerCase().indexOf(query) !== -1 || (e.username || '').toLowerCase().indexOf(query) !== -1; });
    if (!data.entries.length) { listEl.className = ''; listEl.innerHTML = '<p class="empty">No entries yet. Add one above.</p>'; updateCredentialsViewToggle(); return; }
    if (!entries.length) { listEl.className = ''; listEl.innerHTML = '<p class="empty">No entries match your search.</p>'; updateCredentialsViewToggle(); return; }
    var view = getCredentialsView();
    if (view === 'grid') {
      listEl.className = 'credentials-cards-grid';
      listEl.innerHTML = entries.map(function (e) {
        var isRevealed = revealedUsernames[e.id];
        var displayUser = isRevealed ? e.username : maskUsername(e.username);
        var displayPass = maskPassword(e.password);
        return '<div class="cred-card" data-id="' + e.id + '">' +
          '<div class="cred-card-header">' +
            '<div class="cred-card-label">' + escapeHtml(e.label) + '</div>' +
            '<button type="button" class="btn-ghost cred-card-delete delete" title="Delete">' + iconTrash + '</button>' +
          '</div>' +
          '<div class="cred-card-row">' +
            '<span class="cred-icon" aria-hidden="true">' + iconUser + '</span>' +
            '<span class="cred-value">' + escapeHtml(displayUser) + '</span>' +
            '<button type="button" class="btn-ghost toggle-username" title="' + (isRevealed ? 'Hide username' : 'Show full username') + '">' + (isRevealed ? iconEyeOff : iconEye) + '</button>' +
            '<button type="button" class="btn-ghost copy-user" title="Copy username">' + iconCopy + '</button>' +
          '</div>' +
          '<div class="cred-card-row">' +
            '<span class="cred-icon" aria-hidden="true">' + iconKey + '</span>' +
            '<span class="cred-value">' + escapeHtml(displayPass) + '</span>' +
            '<button type="button" class="btn-ghost copy-pass" title="Copy password">' + iconCopy + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
      listEl.querySelectorAll('.cred-card').forEach(function (cardEl) {
        var id = cardEl.dataset.id;
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;
        cardEl.querySelector('.copy-user').addEventListener('click', function () { copyToClipboard(entry.username, this); });
        cardEl.querySelector('.toggle-username').addEventListener('click', function () { revealedUsernames[id] = !revealedUsernames[id]; renderList(); });
        cardEl.querySelector('.copy-pass').addEventListener('click', function () { copyToClipboard(entry.password, this); });
        cardEl.querySelector('.delete').addEventListener('click', function () { if (confirm('Delete this entry?')) { removeEntry(id); renderList(); } });
      });
    } else {
      listEl.className = '';
      listEl.innerHTML = entries.map(function (e) {
        var isRevealed = revealedUsernames[e.id];
        var displayUser = isRevealed ? e.username : maskUsername(e.username);
        var displayPass = maskPassword(e.password);
        return '<div class="entry entry-cred" data-id="' + e.id + '">' +
          '<div class="entry-desc">' + escapeHtml(e.label) + '</div>' +
          '<span class="entry-icon entry-icon-user" aria-hidden="true">' + iconUser + '</span>' +
          '<span class="entry-user-text">' + escapeHtml(displayUser) + '</span>' +
          '<button type="button" class="btn-ghost copy-user" title="Copy username">' + iconCopy + '</button>' +
          '<span class="entry-icon entry-icon-pass" aria-hidden="true">' + iconKey + '</span>' +
          '<span class="entry-pass-text">' + escapeHtml(displayPass) + '</span>' +
          '<button type="button" class="btn-ghost copy-pass" title="Copy password">' + iconCopy + '</button>' +
          '<div class="entry-actions">' +
            '<button type="button" class="btn-ghost toggle-username" title="' + (isRevealed ? 'Hide username' : 'Show full username') + '">' + (isRevealed ? iconEyeOff : iconEye) + '</button>' +
            '<button type="button" class="btn-danger delete" title="Delete">' + iconTrash + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
      listEl.querySelectorAll('.entry').forEach(function (entryEl) {
        var id = entryEl.dataset.id;
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;
        entryEl.querySelector('.copy-user').addEventListener('click', function () { copyToClipboard(entry.username, this); });
        entryEl.querySelector('.toggle-username').addEventListener('click', function () { revealedUsernames[id] = !revealedUsernames[id]; renderList(); });
        entryEl.querySelector('.copy-pass').addEventListener('click', function () { copyToClipboard(entry.password, this); });
        entryEl.querySelector('.delete').addEventListener('click', function () { if (confirm('Delete this entry?')) { removeEntry(id); renderList(); } });
      });
    }
    updateCredentialsViewToggle();
  }

  var TYPE_LABELS = { command: 'Command', regex: 'Regex', url: 'URL', query: 'Query', note: 'Note' };

  function detectInfoTypeFromContent(text) {
    if (!text) return '';
    var t = text.trim();
    if (!t) return '';
    var lower = t.toLowerCase();
    // URL: starts with scheme://
    if (/^[a-z][a-z0-9+.-]*:\/\/\S+/i.test(t)) return 'url';
    // Regex: /pattern/flags
    if (t[0] === '/' && t.lastIndexOf('/') > 0 && t.lastIndexOf('/') === t.length - 1) return 'regex';
    // SQL query: look for common patterns
    if (/\bselect\s+.+\s+from\b/i.test(t) ||
        /\b(update|insert|delete)\b\s+.+\b(from|into)\b/i.test(t) ||
        /\b(create|alter|drop)\s+table\b/i.test(t)) {
      return 'query';
    }
    // Shell / command: pipes, &&, ||, or common commands
    if (/(\|\||&&|;|\||\bgrep\b|\bls\b|\bcat\b|\bcd\b|\bchmod\b|\bchown\b|\bssh\b|\bscp\b)/i.test(t)) {
      return 'command';
    }
    return 'note';
  }
  function renderInfoList() {
    var data = loadData();
    var listEl = document.getElementById('infoList');
    if (!listEl) return;
    var searchEl = document.getElementById('searchInfo');
    var query = (searchEl && searchEl.value || '').trim().toLowerCase();
    var items = data.informations || [];
    if (query) items = items.filter(function (e) { return (e.title || '').toLowerCase().indexOf(query) !== -1 || (e.content || '').toLowerCase().indexOf(query) !== -1; });
    if (!(data.informations || []).length) { listEl.innerHTML = '<p class="empty">No informations yet. Add one above.</p>'; return; }
    if (!items.length) { listEl.innerHTML = '<p class="empty">No items match your search.</p>'; return; }
    listEl.innerHTML = items.map(function (e) {
      var typeLabel = TYPE_LABELS[e.type] || e.type;
      var content = e.content || '';
      var preview = content.slice(0, 80);
      if (content.length > 80) preview += '…';
      var metaHtml = e.type === 'url' ? safeUrlLink(content) : escapeHtml(preview);
      return '<div class="entry info-item" data-id="' + e.id + '"><div class="entry-info"><div class="info-type-badge">' + escapeHtml(typeLabel) + '</div><div class="entry-title">' + escapeHtml(e.title) + '</div><div class="entry-meta">' + metaHtml + '</div></div><div class="entry-actions"><button type="button" class="btn-ghost edit-info" title="Edit">' + iconEdit + '</button><button type="button" class="btn-ghost copy-content" title="Copy content">' + iconCopy + '</button><button type="button" class="btn-danger delete-info" title="Delete">' + iconTrash + '</button></div></div>';
    }).join('');
    listEl.querySelectorAll('.entry').forEach(function (entryEl) {
      var id = entryEl.dataset.id;
      var item = items.find(function (e) { return e.id === id; });
      if (!item) return;
      entryEl.querySelector('.edit-info').addEventListener('click', function () { showInfoEditForm(entryEl, item); });
      entryEl.querySelector('.copy-content').addEventListener('click', function () { copyToClipboard(item.content || '', this); });
      entryEl.querySelector('.delete-info').addEventListener('click', function () { if (confirm('Delete this item?')) { removeInformation(id); renderInfoList(); } });
    });
  }
  function showInfoEditForm(entryEl, item) {
    var id = item.id;
    var typeOpts = [
      { v: 'command', l: 'Unix command' },
      { v: 'regex', l: 'Regex' },
      { v: 'url', l: 'URL' },
      { v: 'query', l: 'Query' },
      { v: 'note', l: 'Note' }
    ];
    var selectHtml = typeOpts.map(function (o) { var sel = o.v === (item.type || 'note') ? ' selected' : ''; return '<option value="' + escapeHtml(o.v) + '"' + sel + '>' + escapeHtml(o.l) + '</option>'; }).join('');
    var formHtml = '<div class="info-edit-form card"><div class="form-row"><select class="info-type edit-type">' + selectHtml + '</select><input type="text" class="edit-title" placeholder="Title" value="' + escapeHtml(item.title || '') + '" style="flex:1"></div><div class="form-row"><textarea class="edit-content" placeholder="Content" rows="4">' + escapeHtml(item.content || '') + '</textarea></div><div class="form-row"><button type="button" class="btn-primary save-edit">Save</button><button type="button" class="btn-ghost cancel-edit">Cancel</button></div></div>';
    entryEl.innerHTML = formHtml;
    entryEl.querySelector('.save-edit').addEventListener('click', function () {
      var type = entryEl.querySelector('.edit-type').value;
      var title = entryEl.querySelector('.edit-title').value;
      var content = entryEl.querySelector('.edit-content').value;
      if (!title.trim()) { alert('Title is required.'); return; }
      updateInformation(id, type, title, content);
      renderInfoList();
    });
    entryEl.querySelector('.cancel-edit').addEventListener('click', function () { renderInfoList(); });
  }

  function updateRecordsViewToggle() {
    var view = getRecordsView();
    var btn = document.getElementById('recordsViewToggle');
    if (!btn) return;
    if (view === 'list') {
      btn.innerHTML = iconGrid;
      btn.title = 'Switch to grid view';
      btn.setAttribute('aria-label', 'Switch to grid view');
    } else {
      btn.innerHTML = iconList;
      btn.title = 'Switch to list view';
      btn.setAttribute('aria-label', 'Switch to list view');
    }
  }
  function setRecordsLoaderVisible(visible) {
    var el = document.getElementById('recordsLoaderOverlay');
    if (!el) return;
    if (visible) { el.classList.remove('hidden'); el.setAttribute('aria-hidden', 'false'); }
    else { el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }
  }
  function renderRecordsList() {
    var listEl = document.getElementById('recordsList');
    var searchEl = document.getElementById('searchRecords');
    if (!listEl) return;
    var query = (searchEl && searchEl.value || '').trim().toLowerCase();
    var records = getRecords();
    if (query) records = records.filter(function (r) { return (r.description || '').toLowerCase().indexOf(query) !== -1 || (r.fileName || '').toLowerCase().indexOf(query) !== -1; });
    if (!getRecords().length) { listEl.className = ''; listEl.innerHTML = '<p class="empty">No documents yet. Upload one above.</p>'; updateRecordsViewToggle(); return; }
    if (!records.length) { listEl.className = ''; listEl.innerHTML = '<p class="empty">No documents match your search.</p>'; updateRecordsViewToggle(); return; }
    var view = getRecordsView();
    if (view === 'list') {
      listEl.className = 'records-list';
      listEl.innerHTML = records.map(function (r) {
        return '<div class="record-list-item" data-id="' + r.id + '"><div class="record-item-info"><div class="record-item-title">' + escapeHtml(r.description || 'No description') + '</div><div class="record-item-meta-row"><span class="record-item-meta">' + escapeHtml(r.fileName) + '</span><span class="record-item-date">' + escapeHtml(formatRecordDate(r.modifiedAt || r.createdAt)) + '</span></div></div><div class="record-item-actions"><button type="button" class="btn-ghost record-preview" title="Preview">' + iconEye + '</button><button type="button" class="btn-ghost record-download" title="Download">' + iconDownload + '</button><button type="button" class="btn-danger record-delete" title="Delete">' + iconTrash + '</button></div></div>';
      }).join('');
      listEl.querySelectorAll('.record-list-item').forEach(function (rowEl) {
        var id = rowEl.dataset.id;
        var rec = records.find(function (r) { return r.id === id; });
        if (!rec) return;
        rowEl.addEventListener('dblclick', function (e) { if (e.target.closest('button')) return; showRecordPreview(rec); });
        rowEl.querySelector('.record-preview').addEventListener('click', function (e) { e.stopPropagation(); showRecordPreview(rec); });
        rowEl.querySelector('.record-download').addEventListener('click', function (e) {
          e.stopPropagation();
          try {
            var binary = atob(rec.contentBase64 || '');
            var bytes = new Uint8Array(binary.length);
            for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            var blob = new Blob([bytes], { type: rec.mimeType || 'application/octet-stream' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = rec.fileName || 'document';
            a.click();
            URL.revokeObjectURL(a.href);
          } catch (err) { alert('Download failed.'); }
        });
        rowEl.querySelector('.record-delete').addEventListener('click', function (e) { e.stopPropagation(); if (confirm('Delete this document?')) removeRecord(id); });
      });
    } else {
      listEl.className = 'records-cards-grid';
      listEl.innerHTML = records.map(function (r) {
        return '<div class="record-card" data-id="' + r.id + '"><div class="record-card-title">' + escapeHtml(r.description || 'No description') + '</div><div class="record-card-meta-row"><span class="record-card-meta">' + escapeHtml(r.fileName) + '</span><span class="record-card-date">' + escapeHtml(formatRecordDate(r.modifiedAt || r.createdAt)) + '</span></div><div class="record-card-actions"><button type="button" class="btn-ghost record-preview" title="Preview">' + iconEye + '</button><button type="button" class="btn-ghost record-download" title="Download">' + iconDownload + '</button><button type="button" class="btn-danger record-delete" title="Delete">' + iconTrash + '</button></div></div>';
      }).join('');
      listEl.querySelectorAll('.record-card').forEach(function (cardEl) {
        var id = cardEl.dataset.id;
        var rec = records.find(function (r) { return r.id === id; });
        if (!rec) return;
        cardEl.addEventListener('dblclick', function (e) { if (e.target.closest('button')) return; showRecordPreview(rec); });
        cardEl.querySelector('.record-preview').addEventListener('click', function () { showRecordPreview(rec); });
        cardEl.querySelector('.record-download').addEventListener('click', function () {
          try {
            var binary = atob(rec.contentBase64 || '');
            var bytes = new Uint8Array(binary.length);
            for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            var blob = new Blob([bytes], { type: rec.mimeType || 'application/octet-stream' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = rec.fileName || 'document';
            a.click();
            URL.revokeObjectURL(a.href);
          } catch (e) { alert('Download failed.'); }
        });
        cardEl.querySelector('.record-delete').addEventListener('click', function () { if (confirm('Delete this document?')) removeRecord(id); });
      });
    }
    updateRecordsViewToggle();
  }

  function bmsIssueAssignee(issue) {
    var a = issue.fields && issue.fields.assignee;
    return (a && (a.displayName || a.name)) || '';
  }
  function bmsIssueStatus(issue) {
    var s = issue.fields && issue.fields.status;
    return (s && s.name) || '';
  }
  function bmsIssueType(issue) {
    var t = issue.fields && issue.fields.issuetype;
    return (t && t.name) || '';
  }
  function bmsIssueTypeIconUrl(issue, baseUrl) {
    var t = issue.fields && issue.fields.issuetype;
    if (!t || !t.iconUrl) return '';
    var url = (t.iconUrl || '').trim();
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    baseUrl = (baseUrl || '').replace(/\/$/, '');
    return baseUrl ? baseUrl + (url.indexOf('/') === 0 ? url : '/' + url) : url;
  }
  function bmsIssuePriority(issue) {
    var p = issue.fields && issue.fields.priority;
    return (p && p.name) || '';
  }
  function bmsIssueEffort(issue) {
    var f = issue.fields || {};
    var sec = f.timeoriginalestimate;
    if (sec != null && sec > 0) return Math.round(sec / 3600) + 'h';
    var tt = f.timetracking;
    if (tt && tt.originalEstimate) return tt.originalEstimate;
    return '';
  }
  function bmsIssueUpdated(issue) {
    var u = issue.fields && issue.fields.updated;
    return u ? new Date(u).toLocaleDateString(undefined, { dateStyle: 'short' }) : '';
  }
  function bmsIssueCreated(issue) {
    var c = issue.fields && issue.fields.created;
    return c || '';
  }
  function bmsIssueDueDate(issue) {
    var d = issue.fields && issue.fields.duedate;
    return d || '';
  }
  function bmsIssueDueDateFormatted(issue) {
    var d = bmsIssueDueDate(issue);
    return d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '';
  }
  function bmsIssueCreatedFormatted(issue) {
    var c = bmsIssueCreated(issue);
    return c ? new Date(c).toLocaleDateString(undefined, { dateStyle: 'short' }) : '';
  }
  function bmsIssueCreatedToday(issue) {
    var c = bmsIssueCreated(issue);
    if (!c) return false;
    var d = new Date(c);
    if (isNaN(d.getTime())) return false;
    var today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }
  function bmsIssueFixVersions(issue) {
    var v = issue.fields && issue.fields.fixVersions;
    if (!Array.isArray(v) || !v.length) return '';
    return v.map(function (x) { return x.name || ''; }).filter(Boolean).join(', ');
  }
  function bmsIssueFixVersionNames(issue) {
    var v = issue.fields && issue.fields.fixVersions;
    if (!Array.isArray(v) || !v.length) return [];
    return v.map(function (x) { return x && x.name ? x.name : ''; }).filter(Boolean);
  }
  function bmsIssueAffectVersions(issue) {
    var v = issue.fields && issue.fields.versions;
    if (!Array.isArray(v) || !v.length) return '';
    return v.map(function (x) { return x.name || ''; }).filter(Boolean).join(', ');
  }
  function bmsIssueSortKey(issue, sortBy) {
    if (sortBy === 'created') return bmsIssueCreated(issue);
    if (sortBy === 'duedate') return bmsIssueDueDate(issue);
    return (issue.fields && issue.fields.updated) || '';
  }
  function bmsPriorityDotClass(priority) {
    if (!priority) return '';
    var p = (priority + '').toLowerCase();
    if (p === 'blocker' || p === 'highest') return 'bms-priority-dot bms-priority-dot-blocker';
    if (p === 'critical' || p === 'high') return 'bms-priority-dot bms-priority-dot-critical';
    if (p === 'major' || p === 'medium') return 'bms-priority-dot bms-priority-dot-major';
    if (p === 'minor' || p === 'low' || p === 'lowest') return 'bms-priority-dot bms-priority-dot-minor';
    return 'bms-priority-dot bms-priority-dot-medium';
  }

  var JQL_SUGGESTIONS = [
    { insert: 'assignee = currentUser() ', label: 'assignee = currentUser()', cat: 'Snippet' },
    { insert: 'status NOT IN (Closed, Resolved) ', label: 'status NOT IN (Closed, Resolved)', cat: 'Snippet' },
    { insert: 'assignee = currentUser() AND status NOT IN (Closed, Resolved) ORDER BY updated DESC', label: 'My open tickets (default)', cat: 'Snippet' },
    { insert: 'ORDER BY updated DESC ', label: 'ORDER BY updated DESC', cat: 'Snippet' },
    { insert: 'ORDER BY created DESC ', label: 'ORDER BY created DESC', cat: 'Snippet' },
    { insert: 'ORDER BY priority DESC ', label: 'ORDER BY priority DESC', cat: 'Snippet' },
    { insert: 'assignee ', label: 'assignee', cat: 'Field' },
    { insert: 'status ', label: 'status', cat: 'Field' },
    { insert: 'project ', label: 'project', cat: 'Field' },
    { insert: 'issuetype ', label: 'issuetype', cat: 'Field' },
    { insert: 'priority ', label: 'priority', cat: 'Field' },
    { insert: 'resolution ', label: 'resolution', cat: 'Field' },
    { insert: 'created ', label: 'created', cat: 'Field' },
    { insert: 'updated ', label: 'updated', cat: 'Field' },
    { insert: 'summary ', label: 'summary', cat: 'Field' },
    { insert: 'reporter ', label: 'reporter', cat: 'Field' },
    { insert: 'labels ', label: 'labels', cat: 'Field' },
    { insert: '= ', label: '=', cat: 'Operator' },
    { insert: '!= ', label: '!=', cat: 'Operator' },
    { insert: 'IN ', label: 'IN', cat: 'Operator' },
    { insert: 'NOT IN ', label: 'NOT IN', cat: 'Operator' },
    { insert: '~ ', label: '~', cat: 'Operator' },
    { insert: 'AND ', label: 'AND', cat: 'Keyword' },
    { insert: 'OR ', label: 'OR', cat: 'Keyword' },
    { insert: 'ORDER BY ', label: 'ORDER BY', cat: 'Keyword' },
    { insert: 'ASC ', label: 'ASC', cat: 'Keyword' },
    { insert: 'DESC ', label: 'DESC', cat: 'Keyword' },
    { insert: 'currentUser() ', label: 'currentUser()', cat: 'Value' },
    { insert: '"In Progress" ', label: '"In Progress"', cat: 'Value' },
    { insert: '"To Do" ', label: '"To Do"', cat: 'Value' },
    { insert: 'Open ', label: 'Open', cat: 'Value' },
    { insert: 'Done ', label: 'Done', cat: 'Value' },
    { insert: 'Closed ', label: 'Closed', cat: 'Value' },
    { insert: 'Resolved ', label: 'Resolved', cat: 'Value' },
    { insert: 'Bug ', label: 'Bug', cat: 'Value' },
    { insert: 'Task ', label: 'Task', cat: 'Value' },
    { insert: 'Story ', label: 'Story', cat: 'Value' }
  ];
  var bmsJqlHighlightIndex = -1;
  var bmsJqlSuggestionsEl = null;

  function getJqlCursorWord(input) {
    if (!input) return { word: '', startIndex: 0 };
    var val = input.value || '';
    var cursor = input.selectionStart || 0;
    var start = val.lastIndexOf(' ', cursor - 1) + 1;
    return { word: val.slice(start, cursor), startIndex: start };
  }

  function showJqlSuggestions(input) {
    var wrap = document.getElementById('bmsJqlWrap');
    var listEl = document.getElementById('bmsJqlSuggestions');
    if (!wrap || !listEl || !input) return;
    var word = getJqlCursorWord(input).word;
    var q = word.toLowerCase();
    var matches = JQL_SUGGESTIONS.filter(function (s) {
      var lab = s.label.toLowerCase();
      var ins = s.insert.toLowerCase().trim();
      return !q || lab.indexOf(q) === 0 || ins.indexOf(q) === 0 || lab.indexOf(q) !== -1;
    }).slice(0, 14);
    bmsJqlHighlightIndex = matches.length ? 0 : -1;
    listEl.innerHTML = '';
    listEl.classList.remove('hidden');
    wrap.querySelector('input').setAttribute('aria-expanded', 'true');
    matches.forEach(function (s, i) {
      var div = document.createElement('div');
      div.className = 'bms-jql-suggestion' + (i === 0 ? ' highlighted' : '');
      div.setAttribute('role', 'option');
      div.innerHTML = '<div class="bms-jql-suggestion-cat">' + escapeHtml(s.cat) + '</div>' + escapeHtml(s.label);
      div.dataset.insert = s.insert;
      div.addEventListener('click', function () {
        applyJqlSuggestion(input, s.insert);
        listEl.classList.add('hidden');
        input.setAttribute('aria-expanded', 'false');
        input.focus();
      });
      listEl.appendChild(div);
    });
    if (!matches.length) listEl.classList.add('hidden');
  }

  function hideJqlSuggestions() {
    var listEl = document.getElementById('bmsJqlSuggestions');
    var input = document.getElementById('bmsJql');
    if (listEl) listEl.classList.add('hidden');
    if (input) input.setAttribute('aria-expanded', 'false');
    bmsJqlHighlightIndex = -1;
  }

  function applyJqlSuggestion(input, insert) {
    if (!input) return;
    var val = input.value || '';
    var cursor = input.selectionStart || 0;
    var start = val.lastIndexOf(' ', cursor - 1) + 1;
    var before = val.slice(0, start);
    var after = val.slice(cursor);
    var newVal = before + insert + after;
    input.value = newVal;
    input.selectionStart = input.selectionEnd = before.length + insert.length;
    input.focus();
  }

  function initJqlAutocomplete() {
    var input = document.getElementById('bmsJql');
    var listEl = document.getElementById('bmsJqlSuggestions');
    if (!input || !listEl) return;
    bmsJqlSuggestionsEl = listEl;
    input.addEventListener('input', function () { showJqlSuggestions(input); });
    input.addEventListener('focus', function () { showJqlSuggestions(input); });
    input.addEventListener('blur', function () {
      setTimeout(function () {
        var listEl = document.getElementById('bmsJqlSuggestions');
        if (listEl && !listEl.contains(document.activeElement)) hideJqlSuggestions();
      }, 180);
    });
    input.addEventListener('keydown', function (e) {
      var listEl = document.getElementById('bmsJqlSuggestions');
      var isHidden = !listEl || listEl.classList.contains('hidden');
      var opts = listEl ? listEl.querySelectorAll('.bms-jql-suggestion') : [];
      if (e.key === 'ArrowDown' && !isHidden && opts.length) {
        e.preventDefault();
        bmsJqlHighlightIndex = (bmsJqlHighlightIndex + 1) % opts.length;
        opts.forEach(function (el, i) { el.classList.toggle('highlighted', i === bmsJqlHighlightIndex); });
        opts[bmsJqlHighlightIndex].scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'ArrowUp' && !isHidden && opts.length) {
        e.preventDefault();
        bmsJqlHighlightIndex = bmsJqlHighlightIndex <= 0 ? opts.length - 1 : bmsJqlHighlightIndex - 1;
        opts.forEach(function (el, i) { el.classList.toggle('highlighted', i === bmsJqlHighlightIndex); });
        opts[bmsJqlHighlightIndex].scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'Enter' && !isHidden && opts.length) {
        e.preventDefault();
        var sel = opts[bmsJqlHighlightIndex];
        if (sel && sel.dataset.insert) {
          applyJqlSuggestion(input, sel.dataset.insert);
          hideJqlSuggestions();
        }
        return;
      }
      if (e.key === 'Escape') {
        hideJqlSuggestions();
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && isHidden) {
        renderBMSList();
        e.preventDefault();
      }
    });
  }

  function buildBMSMultiselect(wrapId, filterKey, options, triggerLabel, optionKeys) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    var selected = bmsFilterSelected[filterKey] || [];
    var opts = Array.isArray(optionKeys) ? optionKeys.slice() : Object.keys(options).sort();
    var triggerId = 'bms-multi-trigger-' + filterKey;
    var dropdownId = 'bms-multi-dropdown-' + filterKey;
    wrap.innerHTML = '<button type="button" id="' + triggerId + '" class="bms-filter-multiselect-trigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="bms-filter-trigger-text">' + (selected.length ? selected.length + ' selected' : 'All') + '</span>' +
      '<span class="bms-filter-trigger-count">' + (selected.length ? selected.length : '') + '</span>' +
      '<span class="bms-filter-trigger-arrow" aria-hidden="true">▼</span></button>' +
      '<div id="' + dropdownId + '" class="bms-filter-multiselect-dropdown hidden" role="listbox">' +
      opts.map(function (k) {
        var checked = selected.indexOf(k) !== -1;
        return '<label class="bms-filter-multiselect-option"><input type="checkbox" value="' + escapeHtml(k) + '"' + (checked ? ' checked' : '') + '><span>' + escapeHtml(k) + '</span></label>';
      }).join('') + '</div>';
    var trigger = document.getElementById(triggerId);
    var dropdown = document.getElementById(dropdownId);
    function updateTriggerText() {
      var sel = bmsFilterSelected[filterKey] || [];
      var textEl = trigger && trigger.querySelector('.bms-filter-trigger-text');
      var countEl = trigger && trigger.querySelector('.bms-filter-trigger-count');
      if (textEl) textEl.textContent = sel.length ? sel.length + ' selected' : 'All';
      if (countEl) countEl.textContent = sel.length ? sel.length : '';
    }
    function syncSelectedFromCheckboxes() {
      var checkboxes = dropdown ? dropdown.querySelectorAll('input[type="checkbox"]:checked') : [];
      bmsFilterSelected[filterKey] = Array.prototype.map.call(checkboxes, function (cb) { return cb.value; });
      updateTriggerText();
      applyBMSFilters();
    }
    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = dropdown && !dropdown.classList.contains('hidden');
        document.querySelectorAll('.bms-filter-multiselect-dropdown').forEach(function (d) { d.classList.add('hidden'); });
        document.querySelectorAll('.bms-filter-multiselect-trigger').forEach(function (t) { t.classList.remove('open'); });
        if (!isOpen && dropdown) {
          dropdown.classList.remove('hidden');
          trigger.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        } else if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }
    if (dropdown) {
      dropdown.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        cb.addEventListener('change', syncSelectedFromCheckboxes);
      });
    }
  }

  function closeAllBMSMultiselects() {
    document.querySelectorAll('.bms-filter-multiselect-dropdown').forEach(function (d) { d.classList.add('hidden'); });
    document.querySelectorAll('.bms-filter-multiselect-trigger').forEach(function (t) { t.classList.remove('open'); t.setAttribute('aria-expanded', 'false'); });
  }

  function populateBMSFilters(issues) {
    var assignees = {}, statuses = {}, types = {}, fixVersions = {};
    issues.forEach(function (issue) {
      var a = bmsIssueAssignee(issue); if (a) assignees[a] = true;
      var s = bmsIssueStatus(issue); if (s) statuses[s] = true;
      var t = bmsIssueType(issue); if (t) types[t] = true;
      bmsIssueFixVersionNames(issue).forEach(function (fv) { fixVersions[fv] = true; });
    });
    var fixVersionKeys = Object.keys(fixVersions).sort(function (a, b) {
      return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
    }).slice(0, 6);
    var fixVersionOptions = {};
    fixVersionKeys.forEach(function (k) { fixVersionOptions[k] = true; });
    buildBMSMultiselect('bmsFilterAssigneeWrap', 'assignee', assignees, 'Assignee');
    buildBMSMultiselect('bmsFilterStatusWrap', 'status', statuses, 'Status');
    buildBMSMultiselect('bmsFilterTypeWrap', 'type', types, 'Type');
    buildBMSMultiselect('bmsFilterFixVersionWrap', 'fixVersion', fixVersionOptions, 'Fix Version', fixVersionKeys);
  }

  function applyBMSFilters() {
    if (!bmsLastData.issues.length) return;
    var assignees = bmsFilterSelected.assignee || [];
    var statuses = bmsFilterSelected.status || [];
    var types = bmsFilterSelected.type || [];
    var fixVersions = bmsFilterSelected.fixVersion || [];
    var searchEl = document.getElementById('bmsSearch');
    var searchQ = (searchEl && searchEl.value || '').trim().toLowerCase();
    var filtered = bmsLastData.issues.filter(function (issue) {
      if (assignees.length && assignees.indexOf(bmsIssueAssignee(issue)) === -1) return false;
      if (statuses.length && statuses.indexOf(bmsIssueStatus(issue)) === -1) return false;
      if (types.length && types.indexOf(bmsIssueType(issue)) === -1) return false;
      if (fixVersions.length) {
        var issueFixVersions = bmsIssueFixVersionNames(issue);
        var matchFixVersion = fixVersions.some(function (fv) { return issueFixVersions.indexOf(fv) !== -1; });
        if (!matchFixVersion) return false;
      }
      if (searchQ) {
        var key = (issue.key || '').toLowerCase();
        var summary = ((issue.fields && issue.fields.summary) || '').toLowerCase();
        var isNumeric = /^\d+$/.test(searchQ.replace(/\s/g, ''));
        if (isNumeric) {
          if (key.indexOf(searchQ) === -1) return false;
        } else {
          var terms = searchQ.split(/\s+/).filter(Boolean);
          for (var t = 0; t < terms.length; t++) {
            if (summary.indexOf(terms[t]) === -1) return false;
          }
        }
      }
      return true;
    });
    var sortBy = (document.getElementById('bmsSortBy') && document.getElementById('bmsSortBy').value) || 'updated';
    var sortOrder = (document.getElementById('bmsSortOrder') && document.getElementById('bmsSortOrder').value) || 'desc';
    var desc = sortOrder === 'desc';
    filtered.sort(function (a, b) {
      var ka = bmsIssueSortKey(a, sortBy);
      var kb = bmsIssueSortKey(b, sortBy);
      var emptyLast = desc;
      if (!ka && !kb) return 0;
      if (!ka) return emptyLast ? 1 : -1;
      if (!kb) return emptyLast ? -1 : 1;
      var cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
      return desc ? -cmp : cmp;
    });
    bmsFilteredCache = filtered;
    bmsCurrentPage = 0;
    renderBMSCards();
  }

  function bmsTicketHtml(issue, baseUrl) {
    var key = issue.key || '';
    var summary = (issue.fields && issue.fields.summary) || '(No summary)';
    var status = bmsIssueStatus(issue);
    var type = bmsIssueType(issue);
    var assignee = bmsIssueAssignee(issue);
    var effort = bmsIssueEffort(issue);
    var priority = bmsIssuePriority(issue);
    var createdStr = bmsIssueCreatedFormatted(issue);
    var updatedStr = bmsIssueUpdated(issue);
    var dueStr = bmsIssueDueDateFormatted(issue);
    var fvStr = bmsIssueFixVersions(issue);
    var avStr = bmsIssueAffectVersions(issue);
    var href = baseUrl ? baseUrl + '/browse/' + key : '#';
    var statusLabelClass = 'bms-ticket-status-label' + (status ? ' ' + status.replace(/\s+/g, '_') : '');
    var dotClass = bmsPriorityDotClass(priority);
    var dotHtml = dotClass ? '<span class="' + dotClass + '" title="' + escapeHtml(priority || '') + '" aria-hidden="true"></span>' : '';
    var typeIconUrl = bmsIssueTypeIconUrl(issue, baseUrl);
    var typeHtml = type ? (typeIconUrl ? '<img class="bms-ticket-type-icon" src="' + escapeHtml(typeIconUrl) + '" alt="' + escapeHtml(type) + '" title="' + escapeHtml(type) + '" loading="lazy">' : '<span class="bms-ticket-type">' + escapeHtml(type) + '</span>') : '';
    var headerLabels = typeHtml + (status ? '<span class="' + statusLabelClass + '">' + escapeHtml(status) + '</span>' : '');
    var metaParts = [];
    if (assignee) metaParts.push('<span class="bms-ticket-meta-item">Assignee: ' + escapeHtml(assignee) + '</span>');
    if (createdStr) metaParts.push('<span class="bms-ticket-meta-item">Created: ' + escapeHtml(createdStr) + '</span>');
    if (updatedStr) metaParts.push('<span class="bms-ticket-meta-item">Updated: ' + escapeHtml(updatedStr) + '</span>');
    if (dueStr) metaParts.push('<span class="bms-ticket-meta-item">Due: ' + escapeHtml(dueStr) + '</span>');
    if (fvStr) metaParts.push('<span class="bms-ticket-meta-item">fv: ' + escapeHtml(fvStr) + '</span>');
    if (avStr) metaParts.push('<span class="bms-ticket-meta-item">av: ' + escapeHtml(avStr) + '</span>');
    if (effort) metaParts.push('<span class="bms-ticket-meta-item bms-ticket-effort">' + escapeHtml(effort) + '</span>');
    var newTag = bmsIssueCreatedToday(issue) ? '<span class="bms-ticket-new">new</span>' : '';
    return '<a class="bms-ticket" href="' + (baseUrl ? escapeHtml(href) : '#') + '" target="_blank" rel="noopener" data-key="' + escapeHtml(key) + '">' +
      newTag +
      '<div class="bms-ticket-header">' +
        '<span class="bms-ticket-key-wrap">' + dotHtml + '<span class="bms-ticket-key">' + escapeHtml(key) + '</span></span>' +
        (headerLabels ? '<span class="bms-ticket-header-labels">' + headerLabels + '</span>' : '') +
      '</div>' +
      '<div class="bms-ticket-summary">' + escapeHtml(summary) + '</div>' +
      '<div class="bms-ticket-meta">' + metaParts.join('') + '</div>' +
    '</a>';
  }

  function changeBMSPage(delta) {
    var total = bmsFilteredCache.length;
    if (!total) return;
    var totalPages = Math.ceil(total / BMS_PAGE_SIZE);
    bmsCurrentPage = Math.max(0, Math.min(totalPages - 1, bmsCurrentPage + delta));
    renderBMSCards();
  }

  function updateBMSViewToggle() {
    var view = getBMSView();
    var btn = document.getElementById('bmsViewToggle');
    if (!btn) return;
    if (view === 'list') {
      btn.innerHTML = iconGrid;
      btn.title = 'Switch to grid view';
      btn.setAttribute('aria-label', 'Switch to grid view');
    } else {
      btn.innerHTML = iconList;
      btn.title = 'Switch to list view';
      btn.setAttribute('aria-label', 'Switch to list view');
    }
  }

  function renderBMSCards() {
    var issues = bmsFilteredCache;
    var listEl = document.getElementById('bmsList');
    var pagEl = document.getElementById('bmsPagination');
    var countEl = document.getElementById('bmsCount');
    var baseUrl = (bmsLastData.baseUrl || '').replace(/\/$/, '');
    if (!listEl) return;
    if (pagEl) {
      pagEl.innerHTML = '';
      pagEl.onclick = null;
    }
    var isListView = getBMSView() === 'list';
    listEl.className = 'bms-list ' + (isListView ? 'bms-list-view' : 'bms-cards-grid');
    var total = issues.length;
    if (!total) {
      if (countEl) countEl.textContent = '';
      listEl.innerHTML = '<p class="empty">No tickets match the current filters.</p>';
      updateBMSViewToggle();
      return;
    }
    var totalPages = Math.ceil(total / BMS_PAGE_SIZE);
    if (bmsCurrentPage >= totalPages) bmsCurrentPage = Math.max(0, totalPages - 1);
    if (bmsCurrentPage < 0) bmsCurrentPage = 0;
    var start = bmsCurrentPage * BMS_PAGE_SIZE;
    var pageIssues = issues.slice(start, Math.min(start + BMS_PAGE_SIZE, total));
    var from = start + 1;
    var to = start + pageIssues.length;
    if (countEl) {
      var countParts = [String(from) + '–' + String(to) + ' of ' + total + ' ticket' + (total !== 1 ? 's' : '')];
      if (totalPages > 1) countParts.push('Page ' + String(bmsCurrentPage + 1) + ' of ' + String(totalPages));
      countEl.textContent = countParts.join(' · ');
    }
    var listHeader = isListView ? '<div class="bms-list-header"><span class="bms-list-header-key">Key</span><span class="bms-list-header-summary">Summary</span><span class="bms-list-header-meta">Details</span></div>' : '';
    listEl.innerHTML = listHeader + pageIssues.map(function (issue) {
      return bmsTicketHtml(issue, baseUrl);
    }).join('');
    if (pagEl && totalPages > 1) {
      pagEl.innerHTML = '<div class="bms-pagination-inner">' +
        '<button type="button" class="btn-ghost bms-page-prev"' + (bmsCurrentPage <= 0 ? ' disabled' : '') + '>Previous</button>' +
        '<span class="bms-page-info muted">Page ' + (bmsCurrentPage + 1) + ' of ' + totalPages + '</span>' +
        '<button type="button" class="btn-ghost bms-page-next"' + (bmsCurrentPage >= totalPages - 1 ? ' disabled' : '') + '>Next</button>' +
        '</div>';
      pagEl.onclick = function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (btn.classList.contains('bms-page-prev')) changeBMSPage(-1);
        if (btn.classList.contains('bms-page-next')) changeBMSPage(1);
      };
    }
    updateBMSViewToggle();
  }

  function buildEffectiveJql() {
    var jqlEl = document.getElementById('bmsJql');
    var userJql = (jqlEl && jqlEl.value || '').trim();
    var projectClause = 'project = "' + BMS_PROJECT_KEY.replace(/"/g, '') + '"';
    if (!userJql) return projectClause;
    var orderBy = '';
    var condition = userJql;
    var orderIdx = userJql.toUpperCase().indexOf(' ORDER BY ');
    if (orderIdx !== -1) {
      condition = userJql.slice(0, orderIdx).trim();
      orderBy = userJql.slice(orderIdx).trim();
    }
    var jql = projectClause + ' AND (' + condition + ')';
    if (orderBy) jql += ' ' + orderBy;
    return jql;
  }

  function renderBMSJqlFavourites() {
    var listEl = document.getElementById('bmsJqlFavouritesList');
    if (!listEl) return;
    var favs = getBMSJqlFavourites();
    var html = favs.map(function (f, i) {
      var name = (f.name || 'JQL').trim() || 'JQL';
      var jql = (f.jql || '').trim();
      return '<span class="bms-favourite-chip" data-index="' + i + '" data-jql="' + escapeHtml(jql) + '">' +
        '<span class="bms-favourite-chip-name">' + escapeHtml(name) + '</span>' +
        '<span class="bms-favourite-chip-remove" title="Remove from favourites" aria-label="Remove">×</span></span>';
    }).join('');
    listEl.innerHTML = html;
    var allChips = listEl.querySelectorAll('.bms-favourite-chip');
    allChips.forEach(function (chip) {
      var idx = parseInt(chip.dataset.index, 10);
      var jql = chip.dataset.jql || '';
      chip.addEventListener('click', function (e) {
        if (e.target.classList.contains('bms-favourite-chip-remove')) {
          e.preventDefault();
          e.stopPropagation();
          var arr = getBMSJqlFavourites();
          arr.splice(idx, 1);
          setBMSJqlFavourites(arr);
          renderBMSJqlFavourites();
          return;
        }
        var input = document.getElementById('bmsJql');
        if (input) { input.value = jql; renderBMSList(); }
      });
    });
  }

  function loadBMSFilters() {
    var sel = document.getElementById('bmsSavedFilter');
    if (!sel) return;
    sel.innerHTML = '<option value="">Loading…</option>';
    fetch('/api/jira/filters').then(function (res) { return res.json(); }).then(function (data) {
      bmsFiltersCache = (data.filters || []).slice();
      if (!bmsFiltersCache.length) {
        sel.innerHTML = '<option value="">No filters</option>';
        if (data.error && (document.getElementById('bmsConfigHint'))) {
          document.getElementById('bmsConfigHint').textContent = data.error;
        }
        return;
      }
      sel.innerHTML = bmsFiltersCache.map(function (f) {
        return '<option value="' + escapeHtml(String(f.id)) + '">' + escapeHtml(f.name || 'Filter ' + f.id) + '</option>';
      }).join('');
      var hint = document.getElementById('bmsConfigHint');
      if (hint) hint.textContent = '';
      var first = bmsFiltersCache[0];
      if (first && first.jql) {
        sel.selectedIndex = 0;
        var jqlInput = document.getElementById('bmsJql');
        if (jqlInput) { jqlInput.value = first.jql; renderBMSList(); }
      }
    }).catch(function (err) {
      sel.innerHTML = '<option value="">Failed to load</option>';
      bmsFiltersCache = [];
      var hint = document.getElementById('bmsConfigHint');
      if (hint) hint.textContent = 'Filters: ' + (err.message || 'Network error');
    });
  }

  function showBMSContent() {
    var loader = document.getElementById('bmsInitialLoader');
    var content = document.getElementById('bmsContent');
    if (loader) loader.classList.add('hidden');
    if (content) content.classList.remove('hidden');
  }

  var BMS_FETCH_TIMEOUT_MS = 15000;

  function renderBMSList() {
    var listEl = document.getElementById('bmsList');
    var hintEl = document.getElementById('bmsConfigHint');
    var pagEl = document.getElementById('bmsPagination');
    if (!listEl) return;
    if (pagEl) { pagEl.innerHTML = ''; pagEl.onclick = null; }
    bmsFilteredCache = [];
    bmsCurrentPage = 0;
    listEl.innerHTML = '<div class="bms-loading" role="status" aria-live="polite"><div class="bms-loading-spinner" aria-hidden="true"></div><span class="bms-loading-text">Loading…</span></div>';
    if (hintEl) hintEl.textContent = '';
    var countEl = document.getElementById('bmsCount'); if (countEl) countEl.textContent = '';
    var jql = buildEffectiveJql();
    var url = '/api/jira/tickets' + (jql ? '?jql=' + encodeURIComponent(jql) : '');
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, BMS_FETCH_TIMEOUT_MS);
    fetch(url, { signal: controller.signal }).then(function (res) { return res.json(); }).then(function (data) {
      clearTimeout(timeoutId);
      showBMSContent();
      if (data.hint && hintEl) hintEl.textContent = data.hint;
      if (data.error) {
        listEl.innerHTML = '<p class="empty">' + escapeHtml(data.error) + '</p>';
        if (pagEl) { pagEl.innerHTML = ''; pagEl.onclick = null; }
        return;
      }
      var issues = (data.issues || []).filter(function (issue) {
        var s = (issue.fields && issue.fields.status && issue.fields.status.name) || '';
        return s !== 'Closed' && s !== 'Resolved';
      });
      var baseUrl = (data.baseUrl || '').replace(/\/$/, '');
      bmsLastData = { issues: issues, baseUrl: baseUrl };
      if (!issues.length) {
        listEl.innerHTML = '<p class="empty">No Jira tickets found. Try a different JQL or configure the server.</p>';
        if (pagEl) { pagEl.innerHTML = ''; pagEl.onclick = null; }
        return;
      }
      populateBMSFilters(issues);
      applyBMSFilters();
    }).catch(function (err) {
      clearTimeout(timeoutId);
      showBMSContent();
      var msg = err.name === 'AbortError' ? 'Request timed out. Check Jira configuration or try again.' : (err.message || 'Network error');
      listEl.innerHTML = '<p class="empty">Failed to load Jira tickets: ' + escapeHtml(msg) + '</p>';
      if (pagEl) { pagEl.innerHTML = ''; pagEl.onclick = null; }
    });
  }

  function runVaultSearch(query) {
    var q = (query || '').trim().toLowerCase();
    var result = { credentials: [], informations: [], records: [], bms: [] };
    if (!q) return Promise.resolve(result);
    var data = loadData();
    result.credentials = (data.entries || []).filter(function (e) {
      return (e.label || '').toLowerCase().indexOf(q) !== -1 || (e.username || '').toLowerCase().indexOf(q) !== -1;
    });
    result.informations = (data.informations || []).filter(function (e) {
      return (e.title || '').toLowerCase().indexOf(q) !== -1 || (e.content || '').toLowerCase().indexOf(q) !== -1;
    });
    var records = getRecords();
    result.records = records.filter(function (r) {
      return (r.description || '').toLowerCase().indexOf(q) !== -1 || (r.fileName || '').toLowerCase().indexOf(q) !== -1;
    });
    function searchBmsInMemory() {
      var issues = bmsLastData.issues || [];
      var terms = q.split(/\s+/).filter(Boolean);
      return issues.filter(function (issue) {
        var key = (issue.key || '').toLowerCase();
        var summary = ((issue.fields && issue.fields.summary) || '').toLowerCase();
        var isNumeric = /^\d+$/.test(q.replace(/\s/g, ''));
        if (isNumeric) return key.indexOf(q) !== -1;
        for (var t = 0; t < terms.length; t++) { if (summary.indexOf(terms[t]) === -1) return false; }
        return true;
      });
    }
    if (currentMode === 'work' && bmsLastData.issues && bmsLastData.issues.length > 0) {
      result.bms = searchBmsInMemory();
      return Promise.resolve(result);
    }
    if (currentMode === 'work') {
      var jqlEsc = q.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var jql = 'project = "' + BMS_PROJECT_KEY.replace(/"/g, '') + '" AND (summary ~ "' + jqlEsc + '" OR key ~ "' + jqlEsc + '") ORDER BY updated DESC';
      return fetch('/api/jira/tickets?jql=' + encodeURIComponent(jql)).then(function (res) { return res.json(); }).then(function (data) {
        result.bms = (data.issues || []).slice(0, 15);
        result.bmsBaseUrl = (data.baseUrl || '').replace(/\/$/, '');
        return result;
      }).catch(function () { return result; });
    }
    return Promise.resolve(result);
  }

  function renderChatbotResult(result) {
    var parts = [];
    if (result.credentials.length) {
      parts.push('<div class="chatbot-section"><div class="chatbot-section-title">Credentials</div>');
      result.credentials.slice(0, 8).forEach(function (e, i) {
        parts.push('<div class="chatbot-item chatbot-cred-item" data-cred-index="' + i + '"><div class="chatbot-item-main"><div class="chatbot-item-header">' + escapeHtml(e.label || 'Credential') + '</div><div class="chatbot-item-desc">Username: ' + escapeHtml(maskUsername(e.username || '')) + '</div></div><div><button type="button" class="chatbot-copy-btn copy-user" title="Copy username">' + iconCopy + '</button><button type="button" class="chatbot-copy-btn copy-pass" title="Copy password">' + iconCopy + '</button></div></div>');
      });
      if (result.credentials.length > 8) parts.push('<div class="chatbot-empty">+' + (result.credentials.length - 8) + ' more</div>');
      parts.push('</div>');
    }
    if (result.informations.length) {
      parts.push('<div class="chatbot-section"><div class="chatbot-section-title">Information</div>');
      result.informations.slice(0, 8).forEach(function (e, i) {
        var title = escapeHtml(e.title || '');
        var content = (e.content || '').slice(0, 80); if (e.content && e.content.length > 80) content += '…';
        parts.push('<div class="chatbot-item chatbot-info-item" data-info-index="' + i + '"><div class="chatbot-item-main"><div class="chatbot-item-header">' + title + '</div><div class="chatbot-item-desc">' + escapeHtml(content) + '</div></div><button type="button" class="chatbot-copy-btn copy-content" title="Copy content">' + iconCopy + '</button></div>');
      });
      if (result.informations.length > 8) parts.push('<div class="chatbot-empty">+' + (result.informations.length - 8) + ' more</div>');
      parts.push('</div>');
    }
    if (result.records.length) {
      parts.push('<div class="chatbot-section"><div class="chatbot-section-title">Documents</div>');
      result.records.slice(0, 6).forEach(function (r, i) {
        var title = r.description || 'Document';
        var description = r.fileName || '';
        parts.push('<div class="chatbot-item chatbot-record-item" data-record-index="' + i + '"><div class="chatbot-item-main"><div class="chatbot-item-header">' + escapeHtml(title) + '</div><div class="chatbot-item-desc">' + escapeHtml(description) + '</div></div><button type="button" class="chatbot-copy-btn copy-content" title="Copy">' + iconCopy + '</button></div>');
      });
      if (result.records.length > 6) parts.push('<div class="chatbot-empty">+' + (result.records.length - 6) + ' more</div>');
      parts.push('</div>');
    }
    if (currentMode === 'work' && result.bms.length) {
      var baseUrl = (result.bmsBaseUrl || bmsLastData.baseUrl || '').replace(/\/$/, '');
      parts.push('<div class="chatbot-section"><div class="chatbot-section-title">BMS (Jira)</div>');
      result.bms.slice(0, 6).forEach(function (issue, i) {
        var key = issue.key || '';
        var summary = (issue.fields && issue.fields.summary) || '';
        var href = baseUrl ? baseUrl + '/browse/' + key : '#';
        parts.push('<div class="chatbot-item chatbot-bms-item" data-bms-index="' + i + '"><div class="chatbot-item-main"><div class="chatbot-item-header"><a href="' + escapeHtml(href) + '" target="_blank" rel="noopener" style="color:var(--accent)">' + escapeHtml(key) + '</a></div><div class="chatbot-item-desc">' + escapeHtml(summary) + '</div></div><button type="button" class="chatbot-copy-btn copy-link" title="Copy link">' + iconCopy + '</button></div>');
      });
      if (result.bms.length > 6) parts.push('<div class="chatbot-empty">+' + (result.bms.length - 6) + ' more</div>');
      parts.push('</div>');
    }
    if (!parts.length) parts.push('<div class="chatbot-empty">No results found.</div>');
    return parts.join('');
  }

  function attachChatbotCopyHandlers(botEl, result) {
    if (!botEl || !result) return;
    botEl.querySelectorAll('.chatbot-cred-item').forEach(function (el) {
      var i = parseInt(el.getAttribute('data-cred-index'), 10);
      var e = result.credentials[i];
      if (!e) return;
      var copyUser = el.querySelector('.copy-user');
      var copyPass = el.querySelector('.copy-pass');
      if (copyUser) copyUser.addEventListener('click', function () { copyToClipboard(e.username || '', this); });
      if (copyPass) copyPass.addEventListener('click', function () { copyToClipboard(e.password || '', this); });
    });
    botEl.querySelectorAll('.chatbot-info-item').forEach(function (el) {
      var i = parseInt(el.getAttribute('data-info-index'), 10);
      var e = result.informations[i];
      if (!e) return;
      var btn = el.querySelector('.copy-content');
      if (btn) btn.addEventListener('click', function () { copyToClipboard(e.content || '', this); });
    });
    botEl.querySelectorAll('.chatbot-record-item').forEach(function (el) {
      var i = parseInt(el.getAttribute('data-record-index'), 10);
      var r = result.records[i];
      if (!r) return;
      var text = (r.description || r.fileName || '').trim();
      var btn = el.querySelector('.copy-content');
      if (btn) btn.addEventListener('click', function () { copyToClipboard(text, this); });
    });
    var baseUrl = (result.bmsBaseUrl || bmsLastData.baseUrl || '').replace(/\/$/, '');
    botEl.querySelectorAll('.chatbot-bms-item').forEach(function (el) {
      var i = parseInt(el.getAttribute('data-bms-index'), 10);
      var issue = result.bms[i];
      if (!issue) return;
      var link = baseUrl ? baseUrl + '/browse/' + (issue.key || '') : '';
      var btn = el.querySelector('.copy-link');
      if (btn) btn.addEventListener('click', function () { copyToClipboard(link, this); });
    });
  }

  function initVaultChatbot() {
    var wrap = document.getElementById('vaultChatbotWrap');
    var btn = document.getElementById('vaultChatbotBtn');
    var panel = document.getElementById('vaultChatbotPanel');
    var messagesEl = document.getElementById('vaultChatbotMessages');
    var inputEl = document.getElementById('vaultChatbotInput');
    var closeBtn = document.getElementById('vaultChatbotClose');
    if (!wrap || !btn || !panel || !messagesEl || !inputEl) return;
    function appendBotMessage(html) {
      var div = document.createElement('div');
      div.className = 'vault-chatbot-msg bot';
      div.innerHTML = html;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    function showWelcomeIfNeeded() {
      var seen = false;
      try { seen = localStorage.getItem(STORAGE_KEY_CHATBOT_WELCOME_SHOWN) === '1'; } catch (_) {}
      if (seen) return;
      appendBotMessage('<div class="chatbot-empty">Welcome to Vault Bot! Type any keyword to search your credentials, informations, documents, and BMS issues.</div>');
      try { localStorage.setItem(STORAGE_KEY_CHATBOT_WELCOME_SHOWN, '1'); } catch (_) {}
    }
    function openPanel() {
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden', 'false');
      showWelcomeIfNeeded();
      inputEl.focus();
    }
    function closePanel() { panel.classList.add('hidden'); panel.setAttribute('aria-hidden', 'true'); }
    function appendUserMessage(text) {
      var div = document.createElement('div');
      div.className = 'vault-chatbot-msg user';
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    function doSearch() {
      var query = (inputEl.value || '').trim();
      if (!query) return;
      inputEl.value = '';
      appendUserMessage(query);
      var botDiv = document.createElement('div');
      botDiv.className = 'vault-chatbot-msg bot';
      botDiv.innerHTML = '<span class="chatbot-empty">Searching…</span>';
      messagesEl.appendChild(botDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      runVaultSearch(query).then(function (result) {
        botDiv.innerHTML = renderChatbotResult(result);
        attachChatbotCopyHandlers(botDiv, result);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }).catch(function () {
        botDiv.innerHTML = '<div class="chatbot-empty">Search failed.</div>';
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }
    btn.addEventListener('click', function () {
      if (panel.classList.contains('hidden')) openPanel(); else closePanel();
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (inputEl) inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
  }

  function initAuth() {
    restoreSessionKey().then(function (key) {
      if (key) {
        sessionEncryptionKey = key;
        return loadAllIntoCache().then(function () { showApp(); return true; });
      }
      return null;
    }).then(function (restored) {
      if (restored) return;
      runPinScreenSetup();
    }).catch(function () {
      try { localStorage.removeItem(STORAGE_KEY_SESSION); sessionStorage.removeItem(STORAGE_KEY_SESSION); } catch (_) {}
      runPinScreenSetup();
    });
  }
  function runPinScreenSetup() {
      var hash = getStoredPinHash();
      var pinScreen = document.getElementById('pinScreen');
      var appContent = document.getElementById('appContent');
      var pinCreate = document.getElementById('pinCreate');
      var pinEnter = document.getElementById('pinEnter');
      if (pinScreen) { pinScreen.classList.remove('hidden'); pinScreen.style.display = ''; }
      if (appContent) { appContent.classList.add('hidden'); appContent.style.display = 'none'; }
      if (hash) {
        if (pinCreate) pinCreate.style.display = 'none';
        if (pinEnter) pinEnter.style.display = 'block';
        var pinInput = document.getElementById('pinInput');
        if (pinInput) { pinInput.value = ''; pinInput.classList.remove('invalid', 'shake', 'valid'); pinInput.focus(); }
      } else {
        if (pinCreate) pinCreate.style.display = 'block';
        if (pinEnter) pinEnter.style.display = 'none';
        var newPin = document.getElementById('newPin');
        var confirmPin = document.getElementById('confirmPin');
        if (newPin) newPin.value = '';
        if (confirmPin) confirmPin.value = '';
        if (newPin) newPin.focus();
      }
      currentMode = getStoredMode();
      updateModeToggle();
      document.getElementById('createPinForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var newPin = document.getElementById('newPin').value;
      var confirmPin = document.getElementById('confirmPin').value;
      if (newPin.length < 4 || newPin.length > 12) { alert('PIN must be 4–12 digits.'); return; }
      if (newPin !== confirmPin) { alert('PINs do not match.'); return; }
      hashPin(newPin).then(function (hash) {
        setStoredPinHash(hash);
        document.getElementById('newPin').value = '';
        document.getElementById('confirmPin').value = '';
        deriveKeyFromPin(newPin).then(function (key) {
          sessionEncryptionKey = key;
          return saveSessionKey(key).then(function () { return loadAllIntoCache(); });
        }).then(showApp).catch(function (err) {
          sessionEncryptionKey = null;
          dataCache[STORAGE_KEY] = { entries: [], informations: [] };
          dataCache[STORAGE_KEY_PERSONAL] = { entries: [], informations: [] };
          showApp();
        });
      });
    });
    document.getElementById('enterPinForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var pinInput = document.getElementById('pinInput');
      var pin = pinInput.value;
      hashPin(pin).then(function (hash) {
        if (hash === getStoredPinHash()) {
          pinInput.classList.remove('invalid', 'shake');
          pinInput.classList.add('valid');
          pinInput.value = '';
          setTimeout(function () {
            deriveKeyFromPin(pin).then(function (key) {
              sessionEncryptionKey = key;
              return saveSessionKey(key).then(function () { return loadAllIntoCache(); });
            }).then(showApp).catch(function (err) {
              sessionEncryptionKey = null;
              dataCache[STORAGE_KEY] = { entries: [], informations: [] };
              dataCache[STORAGE_KEY_PERSONAL] = { entries: [], informations: [] };
              showApp();
            });
          }, 600);
        } else {
          pinInput.classList.add('invalid', 'shake');
          pinInput.value = '';
          pinInput.focus();
          pinInput.addEventListener('animationend', function onEnd() { pinInput.classList.remove('shake'); pinInput.removeEventListener('animationend', onEnd); }, { once: true });
        }
      });
    });
  }

  document.getElementById('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var label = document.getElementById('label').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    addEntry(label, username, password);
    document.getElementById('label').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('label').focus();
    renderList();
  });
  document.getElementById('addInfoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var type = document.getElementById('infoType').value;
    var title = document.getElementById('infoTitle').value;
    var content = document.getElementById('infoContent').value;
    addInformation(type, title, content);
    document.getElementById('infoTitle').value = '';
    document.getElementById('infoContent').value = '';
    document.getElementById('infoTitle').focus();
    renderInfoList();
  });

  // Auto-detect information type from content and preselect dropdown
  var infoTypeEl = document.getElementById('infoType');
  var infoContentEl = document.getElementById('infoContent');
  var infoTypeManuallySet = false;
  if (infoTypeEl) {
    infoTypeEl.addEventListener('change', function () { infoTypeManuallySet = true; });
  }
  function autoSelectInfoType() {
    if (!infoContentEl || !infoTypeEl) return;
    if (infoTypeManuallySet) return;
    var detected = detectInfoTypeFromContent(infoContentEl.value || '');
    if (detected && infoTypeEl.value !== detected) {
      infoTypeEl.value = detected;
    }
  }
  if (infoContentEl) {
    infoContentEl.addEventListener('input', autoSelectInfoType);
    infoContentEl.addEventListener('blur', autoSelectInfoType);
  }

  var addRecordFormEl = document.getElementById('addRecordForm');
  var recordFileEl = document.getElementById('recordFile');
  var recordFileNameDisplayEl = document.getElementById('recordFileNameDisplay');
  var recordFileLabelEl = document.getElementById('recordFileLabel');
  function updateRecordFileDisplay() {
    var file = recordFileEl && recordFileEl.files && recordFileEl.files[0];
    var name = file ? file.name : '';
    if (recordFileNameDisplayEl) recordFileNameDisplayEl.textContent = name;
    if (recordFileLabelEl) { recordFileLabelEl.textContent = name || 'Choose file'; recordFileLabelEl.classList.toggle('has-file', !!file); }
  }
  if (recordFileEl) { recordFileEl.addEventListener('change', updateRecordFileDisplay); }
  if (addRecordFormEl) addRecordFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var descEl = document.getElementById('recordDescription');
    var fileEl = document.getElementById('recordFile');
    var btn = document.getElementById('recordUploadBtn');
    var feedbackEl = document.getElementById('recordUploadFeedback');
    var description = (descEl && descEl.value || '').trim();
    var file = fileEl && fileEl.files && fileEl.files[0];
    if (!description) { alert('description is required.'); return; }
    if (!file) { alert('Please select a file.'); return; }
    function showFeedback(msg, isError) { if (!feedbackEl) return; feedbackEl.textContent = msg; feedbackEl.className = 'record-upload-feedback' + (isError ? ' error' : ' success'); }
    function setLoading(loading) { if (!btn) return; btn.disabled = loading; btn.classList.toggle('loading', loading); btn.innerHTML = loading ? '<span class="spinner" aria-hidden="true"></span>Uploading...' : 'Upload'; }
    var ext = (file.name || '').toLowerCase().split('.').pop();
    var mime = (file.type || '').toLowerCase();
    var extOk = ext && RECORDS_ALLOWED_EXTENSIONS.indexOf(ext) !== -1;
    var mimeOk = RECORDS_ALLOWED_MIME_PREFIXES.some(function (p) { return mime.indexOf(p) === 0; });
    if (!extOk && !mimeOk) { showFeedback('File type not supported.', true); return; }
    if (file.size > RECORDS_MAX_FILE_SIZE) { showFeedback('File size exceeds the limit (max 25 MB).', true); return; }
    setLoading(true);
    setRecordsLoaderVisible(true);
    showFeedback('');
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var base64 = dataUrl.indexOf('base64,') !== -1 ? dataUrl.split('base64,')[1] : dataUrl;
      addRecord(description, file.name, base64, file.type || 'application/octet-stream')
        .then(function (result) { setLoading(false); setRecordsLoaderVisible(false); showFeedback(result.updated ? 'Updated: ' + (file.name || 'document') : 'Added: ' + (file.name || 'document')); if (descEl) descEl.value = ''; if (fileEl) fileEl.value = ''; var nameEl = document.getElementById('recordFileNameDisplay'); if (nameEl) nameEl.textContent = ''; var labelEl = document.getElementById('recordFileLabel'); if (labelEl) { labelEl.textContent = 'Choose file'; labelEl.classList.remove('has-file'); } setTimeout(function () { showFeedback(''); }, 3000); })
        .catch(function (err) { setLoading(false); setRecordsLoaderVisible(false); var msg = (err && err.name === 'QuotaExceededError') ? 'File size exceeds the limit. Try a smaller file or remove some documents.' : 'Upload failed.'; showFeedback(msg, true); });
    };
    reader.onerror = function () { setLoading(false); setRecordsLoaderVisible(false); showFeedback('Failed to read file.', true); };
    reader.readAsDataURL(file);
  });

  (function initRecordsDragDrop() {
    var dropZone = document.getElementById('recordsDropZone');
    var feedbackEl = document.getElementById('recordUploadFeedback');
    var btn = document.getElementById('recordUploadBtn');
    if (!dropZone) return;
    function showFeedback(msg, isError) { if (!feedbackEl) return; feedbackEl.textContent = msg; feedbackEl.className = 'record-upload-feedback' + (isError ? ' error' : ' success'); }
    function setLoading(loading) { if (!btn) return; btn.disabled = loading; btn.classList.toggle('loading', loading); btn.innerHTML = loading ? '<span class="spinner" aria-hidden="true"></span>Uploading...' : 'Upload'; }
    function isFileAllowed(file) {
      var ext = (file.name || '').toLowerCase().split('.').pop();
      var mime = (file.type || '').toLowerCase();
      var extOk = ext && RECORDS_ALLOWED_EXTENSIONS.indexOf(ext) !== -1;
      var mimeOk = RECORDS_ALLOWED_MIME_PREFIXES.some(function (p) { return mime.indexOf(p) === 0; });
      if (!extOk && !mimeOk) return false;
      if (file.size > RECORDS_MAX_FILE_SIZE) return false;
      return true;
    }
    function processDroppedFile(file) {
      return new Promise(function (resolve, reject) {
        var description = (file.name || '').replace(/\.[^.]+$/, '') || 'Document';
        var reader = new FileReader();
        reader.onload = function () {
          var dataUrl = reader.result;
          var base64 = dataUrl.indexOf('base64,') !== -1 ? dataUrl.split('base64,')[1] : dataUrl;
          addRecord(description, file.name, base64, file.type || 'application/octet-stream').then(resolve, reject);
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsDataURL(file);
      });
    }
    dropZone.addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.types.indexOf('Files') !== -1) e.dataTransfer.dropEffect = 'copy'; dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function (e) { e.preventDefault(); e.stopPropagation(); if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      var files = e.dataTransfer.files;
      if (!files || !files.length) return;
      var allowed = [];
      var skipped = 0;
      for (var i = 0; i < files.length; i++) {
        if (isFileAllowed(files[i])) allowed.push(files[i]);
        else skipped++;
      }
      if (!allowed.length) { showFeedback(skipped ? 'File type not supported or file too large.' : 'No valid files dropped.', true); return; }
      if (skipped) showFeedback('Skipped ' + skipped + ' file(s). Uploading ' + allowed.length + '...', false);
      setLoading(true);
      setRecordsLoaderVisible(true);
      var done = 0;
      var failed = 0;
      var addedNames = [];
      var updatedNames = [];
      function next() {
        if (done + failed >= allowed.length) {
          setLoading(false);
          setRecordsLoaderVisible(false);
          var parts = [];
          if (addedNames.length) parts.push('Added: ' + addedNames.join(', '));
          if (updatedNames.length) parts.push('Updated: ' + updatedNames.join(', '));
          if (failed) parts.push(failed + ' failed');
          showFeedback(parts.length ? parts.join('. ') + '.' : 'No files uploaded.', !!failed);
          setTimeout(function () { showFeedback(''); }, 3000);
          renderRecordsList();
          return;
        }
        var file = allowed[done + failed];
        processDroppedFile(file).then(function (result) {
          done++;
          if (result && result.updated) updatedNames.push(file.name || 'document');
          else addedNames.push(file.name || 'document');
          next();
        }, function () { failed++; next(); });
      }
      next();
    });
  })();

  document.addEventListener('paste', function (e) {
    var appContent = document.getElementById('appContent');
    if (!appContent || appContent.classList.contains('hidden')) return;
    // Do not intercept paste when user is typing in an input/textarea — let Ctrl+V paste text
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var data = e.clipboardData;
    if (!data || !data.files || !data.files.length) return;
    e.preventDefault();
    var feedbackEl = document.getElementById('recordUploadFeedback');
    var btn = document.getElementById('recordUploadBtn');
    function showFeedback(msg, isError) { if (!feedbackEl) return; feedbackEl.textContent = msg; feedbackEl.className = 'record-upload-feedback' + (isError ? ' error' : ' success'); }
    function setLoading(loading) { if (!btn) return; btn.disabled = loading; btn.classList.toggle('loading', loading); btn.innerHTML = loading ? '<span class="spinner" aria-hidden="true"></span>Uploading...' : 'Upload'; }
    function isFileAllowed(file) {
      var ext = (file.name || '').toLowerCase().split('.').pop();
      var mime = (file.type || '').toLowerCase();
      var extOk = ext && RECORDS_ALLOWED_EXTENSIONS.indexOf(ext) !== -1;
      var mimeOk = RECORDS_ALLOWED_MIME_PREFIXES.some(function (p) { return mime.indexOf(p) === 0; });
      if (!extOk && !mimeOk) return false;
      if (file.size > RECORDS_MAX_FILE_SIZE) return false;
      return true;
    }
    var files = Array.prototype.slice.call(data.files);
    var allowed = files.filter(isFileAllowed);
    if (!allowed.length) { showFeedback('Pasted file type not supported or too large (max 25 MB).', true); setTimeout(function () { showFeedback(''); }, 3000); return; }
    setLoading(true);
    setRecordsLoaderVisible(true);
    showFeedback('Adding pasted file(s)...', false);
    var done = 0, failed = 0, addedNames = [], updatedNames = [];
    function processNext(index) {
      if (index >= allowed.length) {
        setLoading(false);
        setRecordsLoaderVisible(false);
        var parts = [];
        if (addedNames.length) parts.push('Added: ' + addedNames.join(', '));
        if (updatedNames.length) parts.push('Updated: ' + updatedNames.join(', '));
        if (failed) parts.push(failed + ' failed');
        showFeedback(parts.length ? parts.join('. ') + '.' : 'No files added.', !!failed);
        setTimeout(function () { showFeedback(''); }, 3000);
        renderRecordsList();
        return;
      }
      var file = allowed[index];
      var description = (file.name || '').replace(/\.[^.]+$/, '') || 'Document';
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        var base64 = dataUrl.indexOf('base64,') !== -1 ? dataUrl.split('base64,')[1] : dataUrl;
        addRecord(description, file.name, base64, file.type || 'application/octet-stream')
          .then(function (result) {
            done++;
            if (result && result.updated) updatedNames.push(file.name || 'document');
            else addedNames.push(file.name || 'document');
            processNext(index + 1);
          })
          .catch(function () { failed++; processNext(index + 1); });
      };
      reader.onerror = function () { failed++; processNext(index + 1); };
      reader.readAsDataURL(file);
    }
    processNext(0);
  });

  function setActiveTab(activeTabId, activePanelId) {
    ['tabCredentials', 'tabInformations', 'tabBMS', 'tabRecords', 'tabBot'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === activeTabId);
    });
    ['panelCredentials', 'panelInformations', 'panelBMS', 'panelRecords', 'panelBot'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === activePanelId);
    });
  }
  document.getElementById('tabCredentials').addEventListener('click', function () { setActiveTab('tabCredentials', 'panelCredentials'); });
  document.getElementById('tabInformations').addEventListener('click', function () { setActiveTab('tabInformations', 'panelInformations'); });
  document.getElementById('tabBMS').addEventListener('click', function () {
    setActiveTab('tabBMS', 'panelBMS');
    loadBMSFilters();
    renderBMSJqlFavourites();
    updateBMSViewToggle();
    renderBMSList();
  });
  document.getElementById('tabRecords').addEventListener('click', function () {
    setActiveTab('tabRecords', 'panelRecords');
    renderRecordsList();
  });
  document.getElementById('tabBot').addEventListener('click', function () { setActiveTab('tabBot', 'panelBot'); });

  function encryptVaultForBot(plaintextJson, secret) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
      .then(function (hashBuffer) {
        return crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt']);
      })
      .then(function (key) {
        var iv = crypto.getRandomValues(new Uint8Array(12));
        var encoded = new TextEncoder().encode(plaintextJson);
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, key, encoded)
          .then(function (ciphertext) {
            var combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(ciphertext), iv.length);
            return btoa(String.fromCharCode.apply(null, combined));
          });
      });
  }
  document.getElementById('botSyncBtn').addEventListener('click', function () {
    var phoneEl = document.getElementById('botPhone');
    var secretEl = document.getElementById('botSecret');
    var statusEl = document.getElementById('botSyncStatus');
    var phone = (phoneEl && phoneEl.value || '').trim().replace(/\D/g, '');
    var secret = (secretEl && secretEl.value || '').trim();
    if (!phone || phone.length < 10) {
      if (statusEl) { statusEl.textContent = 'Enter a valid phone number with country code.'; statusEl.style.color = 'var(--danger)'; }
      return;
    }
    if (!secret) {
      if (statusEl) { statusEl.textContent = 'Enter a bot secret.'; statusEl.style.color = 'var(--danger)'; }
      return;
    }
    var work = getDataByKey(STORAGE_KEY);
    var personal = getDataByKey(STORAGE_KEY_PERSONAL);
    var vault = {
      entries: (work.entries || []).concat(personal.entries || []),
      informations: (work.informations || []).concat(personal.informations || [])
    };
    if (statusEl) { statusEl.textContent = 'Syncing…'; statusEl.style.color = 'var(--muted)'; }
    encryptVaultForBot(JSON.stringify(vault), secret).then(function (dataBase64) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/bot/sync');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function () {
        try {
          var res = JSON.parse(xhr.responseText || '{}');
          if (res.ok && statusEl) {
            statusEl.textContent = 'Synced. On WhatsApp send: <your_secret> help';
            statusEl.style.color = 'var(--success)';
          } else if (statusEl) {
            statusEl.textContent = res.error || 'Sync failed';
            statusEl.style.color = 'var(--danger)';
          }
        } catch (_) {
          if (statusEl) { statusEl.textContent = 'Sync failed'; statusEl.style.color = 'var(--danger)'; }
        }
      };
      xhr.onerror = function () {
        if (statusEl) { statusEl.textContent = 'Network error'; statusEl.style.color = 'var(--danger)'; }
      };
      xhr.send(JSON.stringify({ phone: phone, data: dataBase64 }));
    }).catch(function () {
      if (statusEl) { statusEl.textContent = 'Encryption failed'; statusEl.style.color = 'var(--danger)'; }
    });
  });

  document.getElementById('modeToggle').addEventListener('click', function () {
    var targetMode = currentMode === 'work' ? 'personal' : 'work';
    var modal = document.getElementById('modeSwitchPinModal');
    var titleEl = document.getElementById('modeSwitchPinTitle');
    var inputEl = document.getElementById('modeSwitchPinInput');
    if (!modal || !titleEl || !inputEl) return;
    titleEl.textContent = 'Enter PIN to switch to ' + (targetMode === 'work' ? 'Work' : 'Personal');
    inputEl.value = '';
    inputEl.classList.remove('invalid', 'shake');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    inputEl.focus();
    function closeModal() { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); inputEl.value = ''; inputEl.classList.remove('invalid', 'shake'); }
    function doSwitch() { currentMode = targetMode; setStoredMode(currentMode); revealedUsernames = {}; closeModal(); updateModeToggle(); renderList(); renderInfoList(); }
    var verifyBtn = document.getElementById('modeSwitchPinVerify');
    var cancelBtn = document.getElementById('modeSwitchPinCancel');
    function onVerify() {
      var pin = inputEl.value;
      hashPin(pin).then(function (hash) {
        if (hash === getStoredPinHash()) doSwitch();
        else { inputEl.classList.add('invalid', 'shake'); inputEl.value = ''; inputEl.focus(); inputEl.addEventListener('animationend', function onEnd() { inputEl.classList.remove('shake'); inputEl.removeEventListener('animationend', onEnd); }, { once: true }); }
      });
    }
    verifyBtn.onclick = onVerify;
    cancelBtn.onclick = function () { closeModal(); };
    inputEl.onkeydown = function (e) { if (e.key === 'Enter') onVerify(); if (e.key === 'Escape') closeModal(); };
  });

  document.getElementById('logoutBtn').addEventListener('click', function () { lock(); });
  var recordPreviewCloseBtn = document.getElementById('recordPreviewClose');
  if (recordPreviewCloseBtn) recordPreviewCloseBtn.addEventListener('click', closeRecordPreview);
  var recordPreviewModal = document.getElementById('recordPreviewModal');
  if (recordPreviewModal) recordPreviewModal.addEventListener('click', function (e) { if (e.target === recordPreviewModal) closeRecordPreview(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var previewModal = document.getElementById('recordPreviewModal'); if (previewModal && !previewModal.classList.contains('hidden')) closeRecordPreview(); } });
  var notificationClose = document.getElementById('notificationClose');
  if (notificationClose) notificationClose.addEventListener('click', hideNotification);

  var searchInfoEl = document.getElementById('searchInfo');
  if (searchInfoEl) searchInfoEl.addEventListener('input', renderInfoList);
  var searchRecordsEl = document.getElementById('searchRecords');
  if (searchRecordsEl) searchRecordsEl.addEventListener('input', renderRecordsList);
  var bmsRefreshBtn = document.getElementById('bmsRefresh');
  if (bmsRefreshBtn) bmsRefreshBtn.addEventListener('click', renderBMSList);
  var bmsSavedFilterEl = document.getElementById('bmsSavedFilter');
  if (bmsSavedFilterEl) bmsSavedFilterEl.addEventListener('change', function () {
    var id = (bmsSavedFilterEl.value || '').trim();
    if (!id) return;
    var filter = bmsFiltersCache.filter(function (f) { return String(f.id) === id; })[0];
    if (filter && filter.jql != null) {
      var jqlInput = document.getElementById('bmsJql');
      if (jqlInput) {
        jqlInput.value = filter.jql;
        renderBMSList();
      }
    }
  });
  var bmsAddFavouriteBtn = document.getElementById('bmsAddFavourite');
  var addFavouriteModal = document.getElementById('addFavouriteModal');
  var addFavouriteNameInput = document.getElementById('addFavouriteNameInput');
  var addFavouriteSaveBtn = document.getElementById('addFavouriteSave');
  var addFavouriteCancelBtn = document.getElementById('addFavouriteCancel');
  var addFavouritePendingJql = null;
  function closeAddFavouriteModal() {
    if (addFavouriteModal) {
      addFavouriteModal.classList.add('hidden');
      addFavouriteModal.setAttribute('aria-hidden', 'true');
    }
    addFavouritePendingJql = null;
    if (addFavouriteNameInput) addFavouriteNameInput.value = '';
  }
  function openAddFavouriteModal(jql) {
    addFavouritePendingJql = jql;
    if (addFavouriteNameInput) {
      addFavouriteNameInput.value = '';
      addFavouriteNameInput.focus();
    }
    if (addFavouriteModal) {
      addFavouriteModal.classList.remove('hidden');
      addFavouriteModal.setAttribute('aria-hidden', 'false');
    }
  }
  if (bmsAddFavouriteBtn) bmsAddFavouriteBtn.addEventListener('click', function () {
    var jqlEl = document.getElementById('bmsJql');
    var jql = (jqlEl && jqlEl.value || '').trim();
    if (!jql) { alert('Enter a JQL query first, then add to favourites.'); return; }
    openAddFavouriteModal(jql);
  });
  if (addFavouriteSaveBtn) addFavouriteSaveBtn.addEventListener('click', function () {
    var name = (addFavouriteNameInput && addFavouriteNameInput.value || '').trim() || 'JQL';
    if (!addFavouritePendingJql) { closeAddFavouriteModal(); return; }
    var favs = getBMSJqlFavourites();
    favs.push({ name: name, jql: addFavouritePendingJql });
    setBMSJqlFavourites(favs);
    renderBMSJqlFavourites();
    closeAddFavouriteModal();
  });
  if (addFavouriteCancelBtn) addFavouriteCancelBtn.addEventListener('click', closeAddFavouriteModal);
  if (addFavouriteNameInput) {
    addFavouriteNameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addFavouriteSaveBtn && addFavouriteSaveBtn.click();
      if (e.key === 'Escape') closeAddFavouriteModal();
    });
  }
  if (addFavouriteModal) {
    addFavouriteModal.addEventListener('click', function (e) {
      if (e.target === addFavouriteModal) closeAddFavouriteModal();
    });
  }
  initJqlAutocomplete();
  ['bmsSortBy', 'bmsSortOrder'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', applyBMSFilters);
  });
  var bmsClearFiltersBtn = document.getElementById('bmsClearFilters');
  if (bmsClearFiltersBtn) bmsClearFiltersBtn.addEventListener('click', function () {
    bmsFilterSelected = { assignee: [], status: [], type: [], fixVersion: [], priority: [] };
    ['bmsFilterAssigneeWrap', 'bmsFilterStatusWrap', 'bmsFilterTypeWrap', 'bmsFilterFixVersionWrap'].forEach(function (wrapId) {
      var wrap = document.getElementById(wrapId);
      if (wrap) {
        wrap.querySelectorAll('input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
        var trigger = wrap.querySelector('.bms-filter-multiselect-trigger');
        if (trigger) {
          var textEl = trigger.querySelector('.bms-filter-trigger-text');
          var countEl = trigger.querySelector('.bms-filter-trigger-count');
          if (textEl) textEl.textContent = 'All';
          if (countEl) countEl.textContent = '';
        }
      }
    });
    var bmsSearchEl = document.getElementById('bmsSearch');
    if (bmsSearchEl) bmsSearchEl.value = '';
    applyBMSFilters();
  });
  var bmsSearchEl = document.getElementById('bmsSearch');
  if (bmsSearchEl) bmsSearchEl.addEventListener('input', applyBMSFilters);
  var bmsViewToggleBtn = document.getElementById('bmsViewToggle');
  if (bmsViewToggleBtn) bmsViewToggleBtn.addEventListener('click', function () {
    setBMSView(getBMSView() === 'list' ? 'grid' : 'list');
    applyBMSFilters();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.bms-filter-multiselect-wrap')) closeAllBMSMultiselects();
  });
  var recordsViewToggleBtn = document.getElementById('recordsViewToggle');
  if (recordsViewToggleBtn) recordsViewToggleBtn.addEventListener('click', function () {
    setRecordsView(getRecordsView() === 'list' ? 'card' : 'list');
    renderRecordsList();
  });
  var credentialsViewToggleBtn = document.getElementById('credentialsViewToggle');
  if (credentialsViewToggleBtn) credentialsViewToggleBtn.addEventListener('click', function () {
    setCredentialsView(getCredentialsView() === 'list' ? 'grid' : 'list');
    renderList();
  });

  document.getElementById('backupBtn').addEventListener('click', function () {
    if (!sessionEncryptionKey) { alert('Unlock with PIN first to backup (export).'); return; }
    var workData = getDataByKey(STORAGE_KEY);
    var personalData = getDataByKey(STORAGE_KEY_PERSONAL);
    function encryptEntries(entries) {
      return Promise.all(entries.map(function (e) {
        return encryptPlaintext(e.password || '', sessionEncryptionKey).then(function (enc) {
          return { id: e.id, label: e.label, username: e.username, passwordEncrypted: enc, createdAt: e.createdAt };
        });
      }));
    }
    loadRecordsIntoCache().then(function () {
      var records = getRecords();
      if (!records.length) {
        var raw = localStorage.getItem(STORAGE_KEY_RECORDS);
        if (raw && raw.trim()) {
          try {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) records = parsed;
          } catch (_) {}
        }
      }
      return Promise.all([encryptEntries(workData.entries || []), encryptEntries(personalData.entries || [])]).then(function (results) {
        var exportData = {
          version: EXPORT_VERSION,
          exportedAt: new Date().toISOString(),
          work: { entries: results[0], informations: workData.informations || [] },
          personal: { entries: results[1], informations: personalData.informations || [] },
          records: Array.isArray(records) ? records : []
        };
        var body = JSON.stringify(exportData, null, 2);
        function downloadBackup() {
          var ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
          var filename = 'vault-lite-export-v' + EXPORT_VERSION + '-' + ts + '.json';
          var blob = new Blob([body], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.click();
          URL.revokeObjectURL(a.href);
        }
        return fetch(window.location.origin + '/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
          .then(function (res) {
            return res.text().then(function (text) {
              var data;
              try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
              if (res.ok && !data.error) {
                showNotification('Backup saved to ' + (data.folder || 'vault folder') + '.', 'success');
                return;
              }
              downloadBackup();
              showNotification('Backup downloaded. Run the app with node server.js to save to your vault folder automatically.', 'info', 6000);
            });
          })
          .catch(function (err) {
            downloadBackup();
            showNotification('Backup downloaded. Run the app with node server.js to save to your vault folder automatically.', 'info', 6000);
          });
      });
    }).catch(function (err) { showNotification('Backup failed: ' + (err.message || 'error'), 'error', 5000); });
  });

  document.getElementById('restoreBtn').addEventListener('click', function () { document.getElementById('restoreFile').click(); });
  document.getElementById('restoreFile').addEventListener('change', function () {
    var file = this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data) data = {};
        var workData = data.work || (data.entries ? { entries: data.entries, informations: data.informations || [] } : { entries: [], informations: [] });
        var personalData = data.personal || { entries: [], informations: [] };
        if (!Array.isArray(workData.entries)) workData.entries = [];
        if (!Array.isArray(workData.informations)) workData.informations = [];
        if (!Array.isArray(personalData.entries)) personalData.entries = [];
        if (!Array.isArray(personalData.informations)) personalData.informations = [];
        var hasEncrypted = workData.entries.some(function (e) { return e.passwordEncrypted; }) || personalData.entries.some(function (e) { return e.passwordEncrypted; });
        if (hasEncrypted && !sessionEncryptionKey) { alert('Unlock with PIN first to restore a file that contains encrypted passwords.'); return; }
        function decryptEntries(entries) {
          return Promise.all(entries.map(function (e) {
            if (e.passwordEncrypted && sessionEncryptionKey) {
              return decryptToPlaintext(e.passwordEncrypted, sessionEncryptionKey).then(function (pwd) { e.password = pwd; delete e.passwordEncrypted; }).catch(function () { e.password = ''; delete e.passwordEncrypted; });
            }
            return Promise.resolve();
          }));
        }
        Promise.all([decryptEntries(workData.entries), decryptEntries(personalData.entries)]).then(function () {
          return Promise.all([saveDataToKey(STORAGE_KEY, workData), saveDataToKey(STORAGE_KEY_PERSONAL, personalData)]);
        }).then(function () {
          var list = Array.isArray(data.records) ? data.records : [];
          if (list.length) {
            var valid = list.filter(function (r) { return r && (r.description != null || r.fileName != null) && r.contentBase64 != null; });
            var existing = getRecords();
            var merged = existing.slice();
            valid.forEach(function (r) {
              var id = r.id && !merged.some(function (x) { return x.id === r.id; }) ? r.id : (Date.now().toString(36) + Math.random().toString(36).slice(2));
              var created = r.createdAt || new Date().toISOString();
              merged.push({ id: id, description: (r.description || '').trim(), fileName: r.fileName || 'document', contentBase64: r.contentBase64 || '', mimeType: r.mimeType || 'application/octet-stream', createdAt: created, modifiedAt: r.modifiedAt || created });
            });
            return saveRecords(merged);
          }
        }).then(function () {
          renderList();
          renderInfoList();
          renderRecordsList();
          showNotification('Restore (import) complete.', 'success');
        }).catch(function (err) { showNotification('Restore failed: ' + (err.message || 'error'), 'error', 5000); });
      } catch (err) { showNotification('Invalid backup file: ' + err.message, 'error', 5000); }
    };
    reader.readAsText(file);
  });

  var searchEl = document.getElementById('search');
  if (searchEl) searchEl.addEventListener('input', renderList);
  ['mousedown', 'keydown', 'scroll', 'touchstart', 'input'].forEach(function (ev) { document.addEventListener(ev, resetIdleTimer); });
  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('pin-input')) {
      e.target.classList.remove('invalid');
      e.target.value = e.target.value.replace(/\D/g, '');
    }
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAuth(); initVaultChatbot(); });
  } else {
    initAuth();
    initVaultChatbot();
  }
})();
