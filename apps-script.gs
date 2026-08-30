/**
 * Приём ответов гостей и запись в Google Таблицу.
 * Среда: Google Apps Script, runtime V8.
 *
 * Установка: см. README.md, шаг 4.
 */

const SHEET_ID = 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ';
const SHEET_NAME = 'RSVP';
const HEADERS = ['Убакыт', 'Аты-жөнү', 'Келеби', 'Канча киши', 'Кимдин конугу'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return json({ ok: false, error: 'busy' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'empty_body' });
    }

    const data = JSON.parse(e.postData.contents);

    const name = String(data.name == null ? '' : data.name).trim().slice(0, 80);
    if (!name) {
      return json({ ok: false, error: 'name_required' });
    }

    const attending = data.attending === true;

    let guests = parseInt(data.guests, 10);
    if (!Number.isFinite(guests) || guests < 0) {
      guests = attending ? 1 : 0;
    }
    if (guests > 20) {
      guests = 20;
    }

    const side = String(data.side == null ? '' : data.side).trim().slice(0, 40);

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      name,
      attending ? 'Ооба' : 'Жок',
      attending ? guests : 0,
      attending ? side : ''
    ]);

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, service: 'rsvp' });
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 220);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
