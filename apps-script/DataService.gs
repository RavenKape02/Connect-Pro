/**
 * DataService - generic read/write helpers for all sheets.
 * Keeps the rest of the code clean of sheet/row boilerplate.
 */

const SHEETS = {
  CLIENTS: 'Clients',
  VAS: 'VAs',
  SKILLS: 'Skills',
  VA_SKILLS: 'VA_Skills',
  CLIENT_NEEDS: 'Client_Needs',
  ASSIGNMENTS: 'Assignments',
  HOURS_LOG: 'Hours_Log'
};

function _ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _sheet(name) {
  const s = _ss().getSheetByName(name);
  if (!s) {
    throw new Error('Sheet "' + name + '" not found. Import the CSVs first (File > Import > Upload).');
  }
  return s;
}

/** Read a whole sheet as an array of objects keyed by header. */
function getAll(sheetName) {
  const data = _sheet(sheetName).getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h));
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let v = row[i];
      // Dates from getValues() come as JS Date objects. Apps Script
      // serializes them as Java Object[] toString (e.g. "[Ljava.lang.Object;@xxx")
      // when sent over google.script.run, so convert to ISO strings here.
      if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      else if (v !== null && v !== undefined) v = String(v);
      obj[h] = v;
    });
    return obj;
  });
}

/** Append a single row (array). */
function append(sheetName, row) {
  _sheet(sheetName).appendRow(row);
}

/** Convenience: append a client with validation. */
function appendClient(p) {
  if (!p || !p.ClientName) throw new Error('Client name is required.');
  const id = nextId(SHEETS.CLIENTS, 'ClientID');
  append(SHEETS.CLIENTS, [
    id,
    p.ClientName,
    p.Industry || '',
    p.ContactEmail || '',
    todayISO()
  ]);
  return id;
}

/** Convenience: append a VA with validation. */
function appendVA(p) {
  if (!p || !p.VAName) throw new Error('VA name is required.');
  const id = nextId(SHEETS.VAS, 'VAID');
  append(SHEETS.VAS, [
    id,
    p.VAName,
    p.Email || '',
    p.Phone || '',
    'Active',
    todayISO()
  ]);
  return id;
}

/** Return the next integer ID for a sheet's ID column. */
function nextId(sheetName, idColumn) {
  const rows = getAll(sheetName);
  if (rows.length === 0) return 1;
  return Math.max.apply(null, rows.map(r => Number(r[idColumn]) || 0)) + 1;
}

/** Normalize anything date-ish to a Date, or null. */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function todayISO() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
