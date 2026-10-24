/**
 * Wayfarer - Google Apps Script backend.
 *
 * SETUP (also in README.md):
 *  1. Create a Google Sheet (any name).
 *  2. Extensions > Apps Script. Delete the sample code, paste this file.
 *  3. Select the function "setup" and press Run. Approve the permissions.
 *     (Safe to run again: it also upgrades older sheets to the current columns.)
 *  4. Deploy > New deployment > type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Copy the Web app URL (ends with /exec) into src/config.js.
 *  5. To change this script later: Deploy > Manage deployments > Edit > New version.
 *     The URL stays the same.
 */

var SCHEMA = {
  Travel: ['Id', 'Person', 'Mode', 'Source', 'DepartDate', 'DepartTime', 'Destination', 'ArrivalDate', 'ArrivalTime'],
  Stay: ['Person', 'Date', 'Type', 'City']
};
// columns kept as plain text so Sheets never turns "2026-10-24" or "09:30" into a date/serial
var TEXT_COLS = {
  Travel: ['DepartDate', 'DepartTime', 'ArrivalDate', 'ArrivalTime'],
  Stay: ['Date']
};
var TIME_COLS = ['DepartTime', 'ArrivalTime'];
var CACHE_KEY = 'all_v3';

function setup() {
  Object.keys(SCHEMA).forEach(function (name) { sheet_(name); });
}

function pad2_(n) { return ('0' + n).slice(-2); }

function normTime_(v) {
  var m = String(v).match(/(\d{1,2}):(\d{2})/);
  return m ? pad2_(m[1]) + ':' + m[2] : v;
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  var cols = SCHEMA[name];
  if (!sh) {
    sh = ss.insertSheet(name);
    writeHeader_(sh, name);
    return sh;
  }
  // upgrade an older layout (e.g. with CreatedAt / DurationMins) in place
  var head = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
  while (head.length && head[head.length - 1] === '') head.pop();
  if (head.join('|') !== cols.join('|')) migrate_(sh, name, head);
  return sh;
}

function writeHeader_(sh, name) {
  var cols = SCHEMA[name];
  sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
  sh.setFrozenRows(1);
  TEXT_COLS[name].forEach(function (c) {
    sh.getRange(2, cols.indexOf(c) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
  });
}

function migrate_(sh, name, oldHead) {
  var cols = SCHEMA[name];
  var last = sh.getLastRow();
  var rows = [];
  if (last >= 2 && oldHead.length) {
    var data = sh.getRange(2, 1, last - 1, oldHead.length).getDisplayValues();
    data.forEach(function (r) {
      if (!r.join('')) return;
      var o = {};
      oldHead.forEach(function (h, i) { o[h] = r[i]; });
      var out = cols.map(function (c) { return o[c] === undefined ? '' : o[c]; });
      TIME_COLS.forEach(function (c) {
        var i = cols.indexOf(c);
        if (i >= 0) out[i] = normTime_(out[i]);
      });
      rows.push(out);
    });
  }
  if (name === 'Travel') {
    // keep valid numeric Ids, give everything else the next number (1, 2, 3...)
    var mx = 0;
    rows.forEach(function (r) { var n = Number(r[0]); if (n > mx) mx = n; });
    rows.forEach(function (r) { if (!(Number(r[0]) > 0)) r[0] = ++mx; });
  }
  sh.clear();
  writeHeader_(sh, name);
  if (rows.length) {
    TEXT_COLS[name].forEach(function (c) {
      sh.getRange(2, cols.indexOf(c) + 1, rows.length, 1).setNumberFormat('@');
    });
    sh.getRange(2, 1, rows.length, cols.length).setValues(rows);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readAll_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var cols = SCHEMA[name];
  var values = sh.getRange(2, 1, last - 1, cols.length).getDisplayValues();
  var out = [];
  values.forEach(function (r) {
    if (!r[0]) return;
    var o = {};
    cols.forEach(function (c, i) { o[c] = r[i]; });
    out.push(o);
  });
  return out;
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var cache = CacheService.getScriptCache();
    if (!p.fresh) {
      var hit = cache.get(CACHE_KEY);
      if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    }
    var body = JSON.stringify({ travel: readAll_('Travel'), stay: readAll_('Stay') });
    if (body.length < 90000) cache.put(CACHE_KEY, body, 30);
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function toRow_(name, row) {
  return SCHEMA[name].map(function (c) { return row[c] === undefined ? '' : row[c]; });
}

function findRow_(sh, colName, name, value) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var idx = SCHEMA[name].indexOf(colName) + 1;
  var vals = sh.getRange(2, idx, last - 1, 1).getDisplayValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(value)) return i + 2;
  }
  return -1;
}

// row number whose key columns all match (Stay is unique per Person + Date)
function findRowMulti_(sh, name, keys, vals) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var cols = SCHEMA[name];
  var data = sh.getRange(2, 1, last - 1, cols.length).getDisplayValues();
  for (var i = 0; i < data.length; i++) {
    var ok = true;
    for (var k = 0; k < keys.length; k++) {
      if (String(data[i][cols.indexOf(keys[k])]) !== String(vals[k])) { ok = false; break; }
    }
    if (ok) return i + 2;
  }
  return -1;
}

// Force the date/time columns to plain text BEFORE writing, so "09:30" stays "09:30".
function writeRow_(sh, name, rowNum, values) {
  var cols = SCHEMA[name];
  TEXT_COLS[name].forEach(function (c) {
    sh.getRange(rowNum, cols.indexOf(c) + 1).setNumberFormat('@');
  });
  sh.getRange(rowNum, 1, 1, values.length).setValues([values]);
}

// next sequential Id: highest existing number + 1
function nextId_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return 1;
  var vals = sh.getRange(2, 1, last - 1, 1).getValues();
  var max = 0;
  vals.forEach(function (r) { var n = Number(r[0]); if (n > max) max = n; });
  return max + 1;
}

// The app sends a one-off client id (cid) with every new trip so a retried request is not
// added twice. We remember recent ones here instead of using a sheet column.
function seen_(cid) {
  var raw = PropertiesService.getScriptProperties().getProperty('seen');
  return raw ? JSON.parse(raw).indexOf(cid) >= 0 : false;
}
function remember_(cid) {
  var props = PropertiesService.getScriptProperties();
  var list = JSON.parse(props.getProperty('seen') || '[]');
  list.push(cid);
  if (list.length > 300) list = list.slice(-300);
  props.setProperty('seen', JSON.stringify(list));
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ error: 'Server busy, try again.', retryable: true });
  try {
    var body = JSON.parse(e.postData.contents);
    var name = body.sheet;
    if (!name || !SCHEMA[name]) return json_({ error: 'Unknown sheet: ' + name });
    var sh = sheet_(name);

    if (body.action === 'delete') {
      var dKey = body.key_column || 'Id';
      var r = findRow_(sh, dKey, name, body.id);
      if (r > 0) sh.deleteRow(r);
    } else if (body.action === 'upsert') {
      var keys = body.key_columns || [body.key_column];
      var at = findRowMulti_(sh, name, keys, keys.map(function (k) { return body.row[k]; }));
      writeRow_(sh, name, at > 0 ? at : sh.getLastRow() + 1, toRow_(name, body.row));
    } else if (!(body.cid && seen_(body.cid))) {
      // append (a retried request with the same cid is ignored)
      if (name === 'Travel') body.row.Id = nextId_(sh);
      writeRow_(sh, name, sh.getLastRow() + 1, toRow_(name, body.row));
      if (body.cid) remember_(body.cid);
    }

    SpreadsheetApp.flush();
    CacheService.getScriptCache().remove(CACHE_KEY);
    return json_({ ok: true });
  } catch (err) {
    return json_({ error: String(err), retryable: true });
  } finally {
    lock.releaseLock();
  }
}
