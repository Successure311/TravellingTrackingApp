/**
 * Wayfarer - Google Apps Script backend.
 *
 * SETUP (also in README.md):
 *  1. Create a Google Sheet (any name).
 *  2. Extensions > Apps Script. Delete the sample code, paste this file.
 *  3. Select the function "setup" and press Run. Approve the permissions.
 *  4. Deploy > New deployment > type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Copy the Web app URL (ends with /exec) into src/config.js.
 *  5. To change this script later: Deploy > Manage deployments > Edit > New version.
 *     The URL stays the same.
 */

var SCHEMA = {
  Travel: ['Id', 'CreatedAt', 'Mode', 'Source', 'DepartDate', 'DepartTime', 'Destination', 'ArrivalDate', 'ArrivalTime', 'DurationMins'],
  Stay: ['Date', 'Type', 'City', 'UpdatedAt']
};
// columns that must stay plain text (so Sheets never turns "2026-10-24" or "09:30" into a date/serial)
var TEXT_COLS = {
  Travel: ['DepartDate', 'DepartTime', 'ArrivalDate', 'ArrivalTime'],
  Stay: ['Date']
};
var CACHE_KEY = 'all_v1';

function setup() {
  Object.keys(SCHEMA).forEach(function (name) { sheet_(name); });
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  var cols = SCHEMA[name];
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
    TEXT_COLS[name].forEach(function (c) {
      sh.getRange(2, cols.indexOf(c) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  }
  return sh;
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

// Force the date/time columns to plain text BEFORE writing, so "09:30" stays "09:30".
function writeRow_(sh, name, rowNum, values) {
  var cols = SCHEMA[name];
  TEXT_COLS[name].forEach(function (c) {
    sh.getRange(rowNum, cols.indexOf(c) + 1).setNumberFormat('@');
  });
  sh.getRange(rowNum, 1, 1, values.length).setValues([values]);
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
      var key = body.key_column;
      var at = findRow_(sh, key, name, body.row[key]);
      writeRow_(sh, name, at > 0 ? at : sh.getLastRow() + 1, toRow_(name, body.row));
    } else {
      // append, ignoring a retried duplicate (same Id)
      if (findRow_(sh, 'Id', name, body.row.Id) < 0) writeRow_(sh, name, sh.getLastRow() + 1, toRow_(name, body.row));
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
