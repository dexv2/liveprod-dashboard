import { google } from 'googleapis';
import { getMonth, getMonthAndDay } from './helpers';
import { category } from './constants';

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
  const privateKey = (process.env.GOOGLE_SHEET_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.error("Missing Google Sheet credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEET_PRIVATE_KEY)");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function findIndexFrom<T>(
  arr: T[],
  predicate: (value: T, index: number, array: T[]) => boolean,
  startIndex: number = 0
): number {
  for (let i = startIndex; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) {
      return i;
    }
  }
  return -1;
}

/**
 * Column in google sheets is represented by letters (A, B, C, ..., Z, AA, AB, etc.)
 * This function converts a 0-based column index to its corresponding letter(s).
 * For example:
 * 0 → A
 * 1 → B
 * ...
 * 25 → Z
 * 26 → AA
 * 27 → AB
 * and so on.
 * 
 * @param index 0-based column index
 * @returns Corresponding column letter(s)
 */
function columnIndexToLetter(index: number) {
  let letter = '';
  let temp = index + 1; // 0-based → 1-based
  while (temp > 0) {
    const modulo = (temp - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    temp = Math.floor((temp - modulo) / 26);
  }
  return letter;
}

export async function recordVolunteerToSheet(date: string, service: string, role: string, volunteerName: string) {
  const sheetName = getMonth(date).toUpperCase();
  const serviceSchedule = getMonthAndDay(date).toUpperCase();
  const AUDIO = "AUDIO"
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";
  if (!spreadsheetId) {
    return console.error("Missing GOOGLE_SHEET_ID");
  }

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(sheet => sheet.properties?.title === sheetName);
    if (!sheetExists) {
      return console.error(`Sheet '${sheetName}' does not exist in spreadsheet ${spreadsheetId}`);
    }

    // ----------------------------- Row 1 (Headers) -----------------------------
    // Service date is at the header of first row ("APRIL 5 CCF VOLUNTEER LIST")
    const firstRow = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    const scheduleColIndex = firstRow.data.values?.[0].findIndex((cell) => cell.toUpperCase().includes(serviceSchedule)) ?? -1;
    if (scheduleColIndex === -1) {
      return console.error(`Schedule '${serviceSchedule}' not found in the first row of sheet ${sheetName}`);
    }
    // ---------------------------------------------------------------------------

    // -------------------------------- Column A --------------------------------
    // From column A, find the index of AUDIO (this is where we start navigating the schedule cells)
    const firstCol = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });
    const audioRowIndex = firstCol.data.values?.findIndex((row) => (row?.[0] || "").toUpperCase().includes(AUDIO)) ?? -1;
    if (audioRowIndex === -1) {
      return console.error(`Role '${AUDIO}' not found in the first column of sheet ${sheetName}`);
    }
    // ---------------------------------------------------------------------------

    // ------------------------------ AUDIO Section ------------------------------
    // audioRowIndex is 0-based while audioSubHeaderRow 1-based +1
    // subheader is below the audio header so another +1, so total +2 from audioRowIndex
    // If there is "index" in the name means it's 0-based
    // it's a real headache, I know :(
    const audioSubHeaderRow = audioRowIndex + 2;
    const firstActualScheduleRow = audioSubHeaderRow + 1;
    const roleIndex = category.ROLES.indexOf(role);
    const audioSection = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A${audioSubHeaderRow}:AH${audioSubHeaderRow + category.ROLES.length}`,
    });

    const firstServiceTime = "9:00 AM";
    const firstServiceColIndex = findIndexFrom(audioSection.data.values?.[0] || [], (cell) => cell === firstServiceTime, scheduleColIndex);
    if (firstServiceColIndex === -1) {
      return console.error(`First service time '${firstServiceTime}' not found in the audio section header row of sheet ${sheetName}`);
    }

    const actualServiceColIndex = category.SUNDAY_SERVICES.indexOf(service);
    // Convert the column index to letter for the API call (e.g., 0 → A, 1 → B, etc.)
    // Starts from 9:00 AM column index + the offset to the actual service column
    const columnToModify = columnIndexToLetter(firstServiceColIndex + actualServiceColIndex);
    const range = `${sheetName}!${columnToModify}${firstActualScheduleRow + roleIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[volunteerName]],
      },
    });
    // ---------------------------------------------------------------------------
  } catch (error) {
    console.error(`Failed to record volunteer data in Google Sheet: ${error}`);
  }
}
