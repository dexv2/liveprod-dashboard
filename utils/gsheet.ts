import { google } from 'googleapis';
import { getMonth, getMonthAndDay, getMonthAndDayShort, getMonthShort } from './helpers';
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
 * 0 → A,
 * 1 → B,
 * ...
 * 25 → Z,
 * 26 → AA,
 * 27 → AB,
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
    // From column where Schedule is found, find the index of AUDIO (this is where we start navigating the schedule cells)
    const scheduleColLetter = columnIndexToLetter(scheduleColIndex);
    const scheduleCol = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${scheduleColLetter}:${scheduleColLetter}`,
    });
    const audioRowIndex = scheduleCol.data.values?.findIndex((row) => (row?.[0] || "").toUpperCase().includes(AUDIO)) ?? -1;
    if (audioRowIndex === -1) {
      return console.error(`Role '${AUDIO}' not found in the first column of sheet ${sheetName}`);
    }
    // ---------------------------------------------------------------------------

    // ------------------------------ AUDIO Section ------------------------------
    // audioRowIndex is 0-based while audioFirstRoleRow is 1-based (+1)
    // first role row is 2 rows below the audio header so another +2, meaning total +3 from audioRowIndex
    // If there is "index" in the name means it's 0-based
    // it's a real headache, I know :(
    const firstActualScheduleRow = audioRowIndex + 3;
    const roleIndex = category.ROLES.indexOf(role);
    const audioSection = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // firstActualScheduleRow starts from first row so we need to subtract by 1
      // the added category.ROLES.length so it will not overflow to the next row
      range: `${sheetName}!A${firstActualScheduleRow}:AH${firstActualScheduleRow + category.ROLES.length - 1}`,
    });

    const FIRST_ROLE = "FOH";
    const firstRoleColIndex = findIndexFrom(audioSection.data.values?.[0] || [], (cell) => cell === FIRST_ROLE, scheduleColIndex);
    if (firstRoleColIndex === -1) {
      return console.error(`First role '${FIRST_ROLE}' not found in the audio section header row of sheet ${sheetName}`);
    }

    const actualServiceColIndex = category.SUNDAY_SERVICES.indexOf(service);
    // Convert the column index to letter for the API call (e.g., 0 → A, 1 → B, etc.)
    // FOH | 9:00 AM | 12:00 PM | 3:00 PM | 6:00 PM
    // From 'FOH' column index, move 1 to the right -> that's the starting column
    // Move again x times to the right where x is the position of the actual service from starting column
    const columnToModify = columnIndexToLetter(firstRoleColIndex + 1 + actualServiceColIndex);
    const range = `${sheetName}!${columnToModify}${firstActualScheduleRow + roleIndex}`;

    // ------------------- Verify if the last 2 roles in Byron's sheet is "Audio Volunteer" -------------------
    const rolesCol = columnIndexToLetter(firstRoleColIndex);
    const lastRoleIndex = firstActualScheduleRow + category.ROLES.length - 1;
    const secondLastRoleIndex = lastRoleIndex - 1;
    const last2RoleRange = `${sheetName}!${rolesCol}${lastRoleIndex}:${rolesCol}${secondLastRoleIndex}`;
    const last2RoleCell = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: last2RoleRange,
    });
    const last2Roles = last2RoleCell.data.values;
    if (!Array.isArray(last2Roles)) return console.error('Last 2 roles not found');

    let isValid = true;
    for (let i = 0; i < last2Roles.length; i++) {
      const lastRoles = JSON.stringify(last2Roles[i]);
      // The actual checking of last 2 roles
      isValid = lastRoles.includes('Audio Volunteer');
    }

    if (!isValid) return console.error('Last 2 roles are not "Audio Volunteer." Risk of overflowing to another section');
    // ----------------------------------------- End of Verification ------------------------------------------

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

export async function recordVolunteerToSheetSNS(date: string, service: string, role: string, volunteerName: string) {
  const sheetName = getMonthShort(date).toUpperCase();
  const serviceSchedule = getMonthAndDayShort(date).toUpperCase();
  const AUDIO = "AUDIO"
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SNS_GOOGLE_SHEET_ID || "";
  if (!spreadsheetId) {
    return console.error("Missing SNS_GOOGLE_SHEET_ID");
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
    // From column where Schedule is found, find the index of AUDIO (this is where we start navigating the schedule cells)
    const scheduleColLetter = columnIndexToLetter(scheduleColIndex);
    const scheduleCol = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${scheduleColLetter}:${scheduleColLetter}`,
    });
    const audioRowIndex = scheduleCol.data.values?.findIndex((row) => (row?.[0] || "").toUpperCase().includes(AUDIO)) ?? -1;
    if (audioRowIndex === -1) {
      return console.error(`Role '${AUDIO}' not found in the first column of sheet ${sheetName}`);
    }
    // ---------------------------------------------------------------------------

    // ------------------------------ AUDIO Section ------------------------------
    // audioRowIndex is 0-based while audioFirstRoleRow is 1-based (+1)
    // first role row is 2 rows below the audio header so another +2, meaning total +3 from audioRowIndex
    // If there is "index" in the name means it's 0-based
    // it's a real headache, I know :(
    const firstActualScheduleRow = audioRowIndex + 3;
    const roleIndex = category.SNS_GSHEET_ROLES.indexOf(role);
    const audioSection = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // firstActualScheduleRow starts from first row so we need to subtract by 1
      // the added category.ROLES.length so it will not overflow to the next row
      range: `${sheetName}!A${firstActualScheduleRow}:AH${firstActualScheduleRow + category.SNS_GSHEET_ROLES.length - 1}`,
    });

    const FIRST_ROLE = "FOH";
    const firstRoleColIndex = findIndexFrom(audioSection.data.values?.[0] || [], (cell) => cell === FIRST_ROLE, scheduleColIndex);
    if (firstRoleColIndex === -1) {
      return console.error(`First role '${FIRST_ROLE}' not found in the audio section header row of sheet ${sheetName}`);
    }

    const actualServiceColIndex = category.SATURDAY_SERVICES.indexOf(service);
    // Convert the column index to letter for the API call (e.g., 0 → A, 1 → B, etc.)
    // FOH | 9:00 AM | 12:00 PM | 3:00 PM | 6:00 PM
    // From 'FOH' column index, move 1 to the right -> that's the starting column
    // Move again x times to the right where x is the position of the actual service from starting column
    const columnToModify = columnIndexToLetter(firstRoleColIndex + 1 + actualServiceColIndex);
    const range = `${sheetName}!${columnToModify}${firstActualScheduleRow + roleIndex}`;

    // ------------------- Verify if the last 2 roles in Byron's sheet is "Audio Volunteer" -------------------
    const rolesCol = columnIndexToLetter(firstRoleColIndex);
    const lastRoleIndex = firstActualScheduleRow + category.ROLES.length - 1;
    const secondLastRoleIndex = lastRoleIndex - 1;
    const last2RoleRange = `${sheetName}!${rolesCol}${lastRoleIndex}:${rolesCol}${secondLastRoleIndex}`;
    const last2RoleCell = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: last2RoleRange,
    });
    const last2Roles = last2RoleCell.data.values;
    if (!Array.isArray(last2Roles)) return console.error('Last 2 roles not found');

    let isValid = true;
    for (let i = 0; i < last2Roles.length; i++) {
      const lastRoles = JSON.stringify(last2Roles[i]);
      // The actual checking of last 2 roles
      isValid = lastRoles.includes('Audio Volunteer');
    }

    if (!isValid) return console.error('Last 2 roles are not "Audio Volunteer." Risk of overflowing to another section');
    // ----------------------------------------- End of Verification ------------------------------------------

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

// --------------------------------------- BULK UPDATE ----------------------------------------

export async function bulkRecordVolunteerToSheet(date: string, volunteers: string[][]) {
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
    // From column where Schedule is found, find the index of AUDIO (this is where we start navigating the schedule cells)
    const scheduleColLetter = columnIndexToLetter(scheduleColIndex);
    const scheduleCol = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${scheduleColLetter}:${scheduleColLetter}`,
    });
    const audioRowIndex = scheduleCol.data.values?.findIndex((row) => (row?.[0] || "").toUpperCase().includes(AUDIO)) ?? -1;
    if (audioRowIndex === -1) {
      return console.error(`Role '${AUDIO}' not found in the first column of sheet ${sheetName}`);
    }
    // ---------------------------------------------------------------------------

    // ------------------------------ AUDIO Section ------------------------------
    // audioRowIndex is 0-based while audioFirstRoleRow is 1-based (+1)
    // first role row is 2 rows below the audio header so another +2, meaning total +3 from audioRowIndex
    // If there is "index" in the name means it's 0-based
    // it's a real headache, I know :(
    const firstActualScheduleRow = audioRowIndex + 3;
    const audioSection = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // firstActualScheduleRow starts from first row so we need to subtract by 1
      // the added category.ROLES.length so it will not overflow to the next row
      range: `${sheetName}!A${firstActualScheduleRow}:AH${firstActualScheduleRow + category.ROLES.length - 1}`,
    });

    const FIRST_ROLE = "FOH";
    const firstRoleColIndex = findIndexFrom(audioSection.data.values?.[0] || [], (cell) => cell === FIRST_ROLE, scheduleColIndex);
    if (firstRoleColIndex === -1) {
      return console.error(`First role '${FIRST_ROLE}' not found in the audio section header row of sheet ${sheetName}`);
    }

    // Convert the column index to letter for the API call (e.g., 0 → A, 1 → B, etc.)
    // FOH | 9:00 AM | 12:00 PM | 3:00 PM | 6:00 PM
    // From 'FOH' column index, move 1 to the right -> that's the starting column
    // Move again x times to the right where x is the position of the actual service from starting column
    const columnToModify = columnIndexToLetter(firstRoleColIndex + 1);
    const range = `${sheetName}!${columnToModify}${firstActualScheduleRow}`;

    // ------------------- Verify if the last 2 roles in Byron's sheet is "Audio Volunteer" -------------------
    const rolesCol = columnIndexToLetter(firstRoleColIndex);
    const lastRoleIndex = firstActualScheduleRow + category.ROLES.length - 1;
    const secondLastRoleIndex = lastRoleIndex - 1;
    const last2RoleRange = `${sheetName}!${rolesCol}${lastRoleIndex}:${rolesCol}${secondLastRoleIndex}`;
    const last2RoleCell = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: last2RoleRange,
    });
    const last2Roles = last2RoleCell.data.values;
    if (!Array.isArray(last2Roles)) return console.error('Last 2 roles not found');

    let isValid = true;
    for (let i = 0; i < last2Roles.length; i++) {
      const lastRoles = JSON.stringify(last2Roles[i]);
      // The actual checking of last 2 roles
      isValid = lastRoles.includes('Audio Volunteer');
    }

    if (!isValid) return console.error('Last 2 roles are not "Audio Volunteer." Risk of overflowing to another section');
    // ----------------------------------------- End of Verification ------------------------------------------

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: volunteers,
      },
    });
    // ---------------------------------------------------------------------------
  } catch (error) {
    console.error(`Failed to record volunteer data in Google Sheet: ${error}`);
  }
}

export async function bulkRecordVolunteerToSheetSNS(date: string, volunteers: string[][]) {
  const sheetName = getMonthShort(date).toUpperCase();
  const serviceSchedule = getMonthAndDayShort(date).toUpperCase();
  const AUDIO = "AUDIO"
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SNS_GOOGLE_SHEET_ID || "";
  if (!spreadsheetId) {
    return console.error("Missing SNS_GOOGLE_SHEET_ID");
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
    // From column where Schedule is found, find the index of AUDIO (this is where we start navigating the schedule cells)
    const scheduleColLetter = columnIndexToLetter(scheduleColIndex);
    const scheduleCol = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${scheduleColLetter}:${scheduleColLetter}`,
    });
    const audioRowIndex = scheduleCol.data.values?.findIndex((row) => (row?.[0] || "").toUpperCase().includes(AUDIO)) ?? -1;
    if (audioRowIndex === -1) {
      return console.error(`Role '${AUDIO}' not found in the first column of sheet ${sheetName}`);
    }
    // ---------------------------------------------------------------------------

    // ------------------------------ AUDIO Section ------------------------------
    // audioRowIndex is 0-based while audioFirstRoleRow is 1-based (+1)
    // first role row is 2 rows below the audio header so another +2, meaning total +3 from audioRowIndex
    // If there is "index" in the name means it's 0-based
    // it's a real headache, I know :(
    const firstActualScheduleRow = audioRowIndex + 3;
    const audioSection = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // firstActualScheduleRow starts from first row so we need to subtract by 1
      // the added category.ROLES.length so it will not overflow to the next row
      range: `${sheetName}!A${firstActualScheduleRow}:AH${firstActualScheduleRow + category.SNS_GSHEET_ROLES.length - 1}`,
    });

    const FIRST_ROLE = "FOH";
    const firstRoleColIndex = findIndexFrom(audioSection.data.values?.[0] || [], (cell) => cell === FIRST_ROLE, scheduleColIndex);
    if (firstRoleColIndex === -1) {
      return console.error(`First role '${FIRST_ROLE}' not found in the audio section header row of sheet ${sheetName}`);
    }

    // Convert the column index to letter for the API call (e.g., 0 → A, 1 → B, etc.)
    // FOH | 9:00 AM | 12:00 PM | 3:00 PM | 6:00 PM
    // From 'FOH' column index, move 1 to the right -> that's the starting column
    // Move again x times to the right where x is the position of the actual service from starting column
    const columnToModify = columnIndexToLetter(firstRoleColIndex + 1);
    const range = `${sheetName}!${columnToModify}${firstActualScheduleRow}`;

    // ------------------- Verify if the last 2 roles in Byron's sheet is "Audio Volunteer" -------------------
    const rolesCol = columnIndexToLetter(firstRoleColIndex);
    const lastRoleIndex = firstActualScheduleRow + category.ROLES.length - 1;
    const secondLastRoleIndex = lastRoleIndex - 1;
    const last2RoleRange = `${sheetName}!${rolesCol}${lastRoleIndex}:${rolesCol}${secondLastRoleIndex}`;
    const last2RoleCell = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: last2RoleRange,
    });
    const last2Roles = last2RoleCell.data.values;
    if (!Array.isArray(last2Roles)) return console.error('Last 2 roles not found');

    let isValid = true;
    for (let i = 0; i < last2Roles.length; i++) {
      const lastRoles = JSON.stringify(last2Roles[i]);
      // The actual checking of last 2 roles
      isValid = lastRoles.includes('Audio Volunteer');
    }

    if (!isValid) return console.error('Last 2 roles are not "Audio Volunteer." Risk of overflowing to another section');
    // ----------------------------------------- End of Verification ------------------------------------------

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: volunteers,
      },
    });
    // ---------------------------------------------------------------------------
  } catch (error) {
    console.error(`Failed to record volunteer data in Google Sheet: ${error}`);
  }
}
