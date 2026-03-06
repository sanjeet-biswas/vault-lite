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

  var iconEdit = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M11.3 1.3l3.4 3.4-9.2 9.2L2 15l.1-3.5 9.2-9.2zM10 2L2 10l.6 2.4L12 6 10 2z"/></svg>';
  var iconCopy = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M5 1H3.5C2.67 1 2 1.67 2 2.5v9c0 .83.67 1.5 1.5 1.5H5v1.5c0 .83.67 1.5 1.5 1.5h7c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5H5V1zm0 1.5V5h7v9H5V2.5H3.5v9H5v-9z"/></svg>';
  var iconTrash = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M5 2h6v1H5V2zm7 2v9.5c0 .83-.67 1.5-1.5 1.5h-7C2.67 15 2 14.33 2 13.5V4h12zM6 6.5v5h1v-5H6zm3 0v5h1v-5H9zM4 4v9.5c0 .28.22.5.5.5h7c.28 0 .5-.22.5-.5V4H4z"/></svg>';
  var iconUser = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 8c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 1.5c-2.5 0-7 1.2-7 3.5V14h14v-1c0-2.3-4.5-3.5-7-3.5z"/></svg>';
  var iconKey = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12.5 4a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 1a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM8 5L4 9v5h3v-2h2v-2h3V9L8 5zm-.5 5.5H6v1.5h1.5v-1.5zm0-2H6V10h1.5V8.5z"/></svg>';
  var iconEye = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 4c3.5 0 6 3 7 4-1 1-3.5 4-7 4s-6-3-7-4c1-1 3.5-4 7-4zm0 1.5C5.3 5.5 3.2 7.6 2.5 8c.7.4 2.8 2.5 5.5 2.5s4.8-2.1 5.5-2.5c-.7-.4-2.8-2.5-5.5-2.5zM8 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>';
  var iconEyeOff = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 8c0 0 2-3 6-3s6 3 6 3-2 3-6 3-6-3-6-3zm6 2a2 2 0 100-4 2 2 0 000 4z"/><path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
  var iconDownload = '<svg class="btn-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 10.5l4-4H10V2H6v4.5H4L8 10.5zM2 12v2h12v-2H2z"/></svg>';

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
  function getStoredPinHash() { return localStorage.getItem(STORAGE_KEY_PIN); }
  function setStoredPinHash(hash) { localStorage.setItem(STORAGE_KEY_PIN, hash); }

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
    records.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      description: (description || '').trim(),
      fileName: fileName || 'document',
      contentBase64: contentBase64 || '',
      mimeType: mimeType || 'application/octet-stream',
      createdAt: new Date().toISOString()
    });
    return saveRecords(records).then(renderRecordsList);
  }
  function removeRecord(id) {
    var records = getRecords().filter(function (r) { return r.id !== id; });
    return saveRecords(records).then(renderRecordsList);
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
      var span = document.createElement('span');
      span.className = 'copy-feedback';
      span.textContent = 'Copied';
      buttonEl.parentElement.appendChild(span);
      setTimeout(function () { span.remove(); }, 1500);
    });
  }
  function maskUsername(s) { if (!s || s.length <= 8) return s; return s.slice(0, 8) + '•'.repeat(Math.min(s.length - 8, 12)); }
  function escapeHtml(s) { var div = document.createElement('div'); div.textContent = s; return div.innerHTML; }
  function safeUrlLink(url) {
    var u = (url || '').trim();
    if (!u) return escapeHtml(u);
    var lower = u.toLowerCase();
    if (lower.indexOf('http://') !== 0 && lower.indexOf('https://') !== 0) u = 'https://' + u;
    var escaped = escapeHtml(u);
    return '<a href="' + escaped + '" target="_blank" rel="noopener noreferrer" class="info-link">' + escaped + '</a>';
  }

  var iconWork = '<svg class="mode-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/></svg>';
  var iconPersonal = '<svg class="mode-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/></svg>';

  function showApp() {
    isUnlocked = true;
    currentMode = getStoredMode();
    var pinScreen = document.getElementById('pinScreen');
    var appContent = document.getElementById('appContent');
    if (pinScreen) pinScreen.classList.add('hidden');
    if (appContent) { appContent.classList.remove('hidden'); appContent.style.display = ''; }
    resetIdleTimer();
    startIdleTimer();
    updateModeToggle();
    renderList();
    renderInfoList();
  }
  function updateModeToggle() {
    var btn = document.getElementById('modeToggle');
    var iconEl = document.getElementById('modeIcon');
    var labelEl = document.getElementById('modeLabel');
    var tabRecords = document.getElementById('tabRecords');
    var panelRecords = document.getElementById('panelRecords');
    if (!btn || !iconEl || !labelEl) return;
    btn.classList.add('active');
    if (currentMode === 'work') {
      iconEl.innerHTML = iconWork;
      labelEl.textContent = 'Work';
      btn.title = 'Switch to Personal';
      if (tabRecords) tabRecords.style.display = 'none';
      var tabCred = document.getElementById('tabCredentials');
      var panelCred = document.getElementById('panelCredentials');
      if (tabRecords && tabRecords.classList.contains('active')) {
        if (tabCred) { tabCred.classList.add('active'); panelCred.classList.add('active'); }
        tabRecords.classList.remove('active');
        if (panelRecords) panelRecords.classList.remove('active');
      }
    } else {
      iconEl.innerHTML = iconPersonal;
      labelEl.textContent = 'Personal';
      btn.title = 'Switch to Work';
      if (tabRecords) tabRecords.style.display = '';
      renderRecordsList();
    }
  }
  function showPinScreen() {
    isUnlocked = false;
    sessionEncryptionKey = null;
    dataCache = {};
    if (idleTimerId) { clearInterval(idleTimerId); idleTimerId = null; }
    var pinScreen = document.getElementById('pinScreen');
    var appContent = document.getElementById('appContent');
    if (pinScreen) pinScreen.classList.remove('hidden');
    if (appContent) { appContent.classList.add('hidden'); appContent.style.display = 'none'; }
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

  function renderList() {
    var data = loadData();
    var listEl = document.getElementById('list');
    var searchEl = document.getElementById('search');
    var query = (searchEl && searchEl.value || '').trim().toLowerCase();
    var entries = data.entries;
    if (query) entries = entries.filter(function (e) { return (e.label || '').toLowerCase().indexOf(query) !== -1 || (e.username || '').toLowerCase().indexOf(query) !== -1; });
    if (!data.entries.length) { listEl.innerHTML = '<p class="empty">No entries yet. Add one above.</p>'; return; }
    if (!entries.length) { listEl.innerHTML = '<p class="empty">No entries match your search.</p>'; return; }
    listEl.innerHTML = entries.map(function (e) {
      var isRevealed = revealedUsernames[e.id];
      var displayUser = isRevealed ? e.username : maskUsername(e.username);
      return '<div class="entry" data-id="' + e.id + '"><div class="entry-info"><div class="entry-title">' + escapeHtml(e.label) + '</div><div class="entry-meta">' + escapeHtml(displayUser) + '</div></div><div class="entry-actions"><button type="button" class="btn-ghost toggle-username" title="' + (isRevealed ? 'Hide username' : 'Show full username') + '">' + (isRevealed ? iconEyeOff : iconEye) + '</button><button type="button" class="btn-ghost copy-user" title="Copy username">' + iconUser + '</button><button type="button" class="btn-ghost copy-pass" title="Copy password">' + iconKey + '</button><button type="button" class="btn-danger delete" title="Delete">' + iconTrash + '</button></div></div>';
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

  var TYPE_LABELS = { command: 'Command', regex: 'Regex', url: 'URL', note: 'Note' };
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
    var typeOpts = [{ v: 'command', l: 'Unix command' }, { v: 'regex', l: 'Regex' }, { v: 'url', l: 'URL' }, { v: 'note', l: 'Note' }];
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

  function renderRecordsList() {
    var listEl = document.getElementById('recordsList');
    var searchEl = document.getElementById('searchRecords');
    if (!listEl) return;
    var query = (searchEl && searchEl.value || '').trim().toLowerCase();
    var records = getRecords();
    if (query) records = records.filter(function (r) { return (r.description || '').toLowerCase().indexOf(query) !== -1 || (r.fileName || '').toLowerCase().indexOf(query) !== -1; });
    if (!getRecords().length) { listEl.className = ''; listEl.innerHTML = '<p class="empty">No documents yet. Upload one above.</p>'; return; }
    if (!records.length) { listEl.className = ''; listEl.innerHTML = '<p class="empty">No documents match your search.</p>'; return; }
    listEl.className = 'records-cards-grid';
    var maxThumbSize = 180000;
    listEl.innerHTML = records.map(function (r) {
      var fileIcon = getRecordFileIcon(r);
      var mime = (r.mimeType || '').toLowerCase();
      var base64 = r.contentBase64 || '';
      var isImage = mime.indexOf('image/') === 0;
      var showThumb = isImage && base64.length > 0 && base64.length < maxThumbSize;
      var previewHtml = showThumb ? '<img class="record-card-thumb" src="data:' + escapeHtml(mime || 'image/png') + ';base64,' + base64 + '" alt="">' : '<span class="record-file-icon-wrap" aria-hidden="true">' + fileIcon + '</span>';
      return '<div class="record-card" data-id="' + r.id + '"><div class="record-card-preview">' + previewHtml + '</div><div class="record-card-title">' + escapeHtml(r.description || 'No description') + '</div><div class="record-card-meta">' + escapeHtml(r.fileName) + '</div><div class="record-card-actions"><button type="button" class="btn-ghost record-preview" title="Preview">' + iconEye + '</button><button type="button" class="btn-ghost record-download" title="Download">' + iconDownload + '</button><button type="button" class="btn-danger record-delete" title="Delete">' + iconTrash + '</button></div></div>';
    }).join('');
    listEl.querySelectorAll('.record-card').forEach(function (cardEl) {
      var id = cardEl.dataset.id;
      var rec = records.find(function (r) { return r.id === id; });
      if (!rec) return;
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

  function initAuth() {
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
          return loadAllIntoCache();
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
              return loadAllIntoCache();
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

  var addRecordFormEl = document.getElementById('addRecordForm');
  if (addRecordFormEl) addRecordFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var descEl = document.getElementById('recordDescription');
    var fileEl = document.getElementById('recordFile');
    var btn = document.getElementById('recordUploadBtn');
    var feedbackEl = document.getElementById('recordUploadFeedback');
    var description = (descEl && descEl.value || '').trim();
    var file = fileEl && fileEl.files && fileEl.files[0];
    if (!description) { alert('Description is required.'); return; }
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
    showFeedback('');
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var base64 = dataUrl.indexOf('base64,') !== -1 ? dataUrl.split('base64,')[1] : dataUrl;
      addRecord(description, file.name, base64, file.type || 'application/octet-stream')
        .then(function () { setLoading(false); showFeedback('Uploaded successfully.'); if (descEl) descEl.value = ''; if (fileEl) fileEl.value = ''; setTimeout(function () { showFeedback(''); }, 3000); })
        .catch(function (err) { setLoading(false); var msg = (err && err.name === 'QuotaExceededError') ? 'File size exceeds the limit. Try a smaller file or remove some documents.' : 'Upload failed.'; showFeedback(msg, true); });
    };
    reader.onerror = function () { setLoading(false); showFeedback('Failed to read file.', true); };
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
      var done = 0;
      var failed = 0;
      function next() {
        if (done + failed >= allowed.length) { setLoading(false); if (failed) showFeedback('Uploaded ' + done + '. ' + failed + ' failed.', true); else showFeedback('Uploaded ' + done + ' file(s).', false); setTimeout(function () { showFeedback(''); }, 3000); renderRecordsList(); return; }
        var file = allowed[done + failed];
        processDroppedFile(file).then(function () { done++; next(); }, function () { failed++; next(); });
      }
      next();
    });
  })();

  document.getElementById('tabCredentials').addEventListener('click', function () {
    document.getElementById('tabCredentials').classList.add('active');
    document.getElementById('tabInformations').classList.remove('active');
    document.getElementById('tabRecords').classList.remove('active');
    document.getElementById('panelCredentials').classList.add('active');
    document.getElementById('panelInformations').classList.remove('active');
    document.getElementById('panelRecords').classList.remove('active');
  });
  document.getElementById('tabInformations').addEventListener('click', function () {
    document.getElementById('tabInformations').classList.add('active');
    document.getElementById('tabCredentials').classList.remove('active');
    document.getElementById('tabRecords').classList.remove('active');
    document.getElementById('panelInformations').classList.add('active');
    document.getElementById('panelCredentials').classList.remove('active');
    document.getElementById('panelRecords').classList.remove('active');
  });
  document.getElementById('tabRecords').addEventListener('click', function () {
    document.getElementById('tabRecords').classList.add('active');
    document.getElementById('tabCredentials').classList.remove('active');
    document.getElementById('tabInformations').classList.remove('active');
    document.getElementById('panelRecords').classList.add('active');
    document.getElementById('panelCredentials').classList.remove('active');
    document.getElementById('panelInformations').classList.remove('active');
    renderRecordsList();
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

  var searchInfoEl = document.getElementById('searchInfo');
  if (searchInfoEl) searchInfoEl.addEventListener('input', renderInfoList);
  var searchRecordsEl = document.getElementById('searchRecords');
  if (searchRecordsEl) searchRecordsEl.addEventListener('input', renderRecordsList);

  document.getElementById('exportBtn').addEventListener('click', function () {
    if (!sessionEncryptionKey) { alert('Unlock with PIN first to export (passwords will be encrypted in the file).'); return; }
    var workData = getDataByKey(STORAGE_KEY);
    var personalData = getDataByKey(STORAGE_KEY_PERSONAL);
    function encryptEntries(entries) {
      return Promise.all(entries.map(function (e) {
        return encryptPlaintext(e.password || '', sessionEncryptionKey).then(function (enc) {
          return { id: e.id, label: e.label, username: e.username, passwordEncrypted: enc, createdAt: e.createdAt };
        });
      }));
    }
    Promise.all([encryptEntries(workData.entries || []), encryptEntries(personalData.entries || [])]).then(function (results) {
      var exportData = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), work: { entries: results[0], informations: workData.informations || [] }, personal: { entries: results[1], informations: personalData.informations || [] } };
      var ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
      var filename = 'vault-lite-export-v' + EXPORT_VERSION + '-' + ts + '.json';
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }).catch(function (err) { alert('Export failed: ' + (err.message || 'encryption error')); });
  });
  document.getElementById('importBtn').addEventListener('click', function () { document.getElementById('importFile').click(); });
  document.getElementById('importFile').addEventListener('change', function () {
    var file = this.files[0];
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
        if (hasEncrypted && !sessionEncryptionKey) { alert('Unlock with PIN first to import a file that contains encrypted passwords.'); document.getElementById('importFile').value = ''; return; }
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
          var totalEntries = workData.entries.length + personalData.entries.length;
          var totalInfos = workData.informations.length + personalData.informations.length;
          var msg = 'Imported ' + totalEntries + ' credentials (Work: ' + workData.entries.length + ', Personal: ' + personalData.entries.length + ')';
          if (totalInfos) msg += ', ' + totalInfos + ' informations';
          alert(msg + '.');
        }).catch(function (err) { alert('Import failed: ' + (err.message || 'decryption error')); });
      } catch (err) { alert('Invalid JSON: ' + err.message); }
      document.getElementById('importFile').value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('recordsExportBtn').addEventListener('click', function () {
    var records = getRecords();
    var exportData = { version: 1, exportedAt: new Date().toISOString(), records: records };
    var ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
    var filename = 'vault-lite-records-' + ts + '.json';
    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('recordsImportBtn').addEventListener('click', function () { document.getElementById('recordsImportFile').click(); });
  document.getElementById('recordsImportFile').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var list = Array.isArray(data) ? data : (data.records && Array.isArray(data.records) ? data.records : []);
        if (!list.length) { alert('No records found in file.'); document.getElementById('recordsImportFile').value = ''; return; }
        var valid = list.filter(function (r) { return r && (r.description != null || r.fileName != null) && r.contentBase64 != null; });
        if (valid.length !== list.length) alert('Skipped ' + (list.length - valid.length) + ' invalid record(s). Imported ' + valid.length + '.');
        var existing = getRecords();
        var merged = existing.slice();
        valid.forEach(function (r) {
          var id = r.id && !merged.some(function (x) { return x.id === r.id; }) ? r.id : (Date.now().toString(36) + Math.random().toString(36).slice(2));
          merged.push({ id: id, description: (r.description || '').trim(), fileName: r.fileName || 'document', contentBase64: r.contentBase64 || '', mimeType: r.mimeType || 'application/octet-stream', createdAt: r.createdAt || new Date().toISOString() });
        });
        saveRecords(merged).then(function () { renderRecordsList(); alert('Imported ' + valid.length + ' document(s). Total: ' + merged.length + '.'); }).catch(function (err) { alert('Import failed: ' + (err.message || 'storage error')); });
      } catch (err) { alert('Invalid JSON: ' + err.message); }
      document.getElementById('recordsImportFile').value = '';
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
  initAuth();
})();
