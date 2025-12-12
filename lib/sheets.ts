import { google } from 'googleapis';

// --- CONFIGURATION ---
export const DEPARTMENTS = [
  { id: 'floor', name: 'Production (First Floor)', startCol: 1 },
  { id: 'basement', name: 'Production (Basement)', startCol: 5 },
  { id: 'quality', name: 'Quality Check', startCol: 9 },
  { id: 'stock', name: 'Stock Availability', startCol: 13 },
  { id: 'attendance', name: 'Attendance', startCol: 17 },
];

const LOGS_SHEET_TITLE = "Data_Logs";

async function getAuthSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth: await auth.getClient() as any });
}

// --- STANDARD CHECKLIST FUNCTIONS ---
export async function getTodayRow(dateStr: string) {
  const sheets = await getAuthSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:U',
  });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === dateStr);
  if (rowIndex === -1) return null;
  return { rowIndex: rowIndex + 1, data: rows[rowIndex] };
}

export async function createTodayRow(dateStr: string) {
  const sheets = await getAuthSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:A',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[dateStr, ...Array(20).fill('')]] },
  });
}

export async function updateDepartmentData(rowIndex: number, colIndex: number, data: string[]) {
  const sheets = await getAuthSheets();
  const startChar = String.fromCharCode(65 + colIndex);
  const endChar = String.fromCharCode(65 + colIndex + 3);
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Sheet1!${startChar}${rowIndex}:${endChar}${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [data] },
  });
}

// --- NEW: LINK IMPORT FUNCTIONS ---
export async function processSheetLink(deptName: string, supervisor: string, sheetLink: string) {
  const sheets = await getAuthSheets();
  const mainSpreadsheetId = process.env.GOOGLE_SHEET_ID;

  // 1. Extract the ID from the link the user pasted
  const matches = sheetLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matches || !matches[1]) throw new Error("Invalid Google Sheet Link");
  const externalSheetId = matches[1];

  // 2. Read data from the Supervisor's sheet (Assumes data is in the first tab)
  // We read range A:Z to capture everything.
  const externalResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: externalSheetId,
    range: 'A:Z', 
  });
  
  const rawData = externalResponse.data.values;
  if (!rawData || rawData.length === 0) return; // Nothing to copy

  // 3. Prepare data for Archive (Add Timestamp, Dept, Supervisor to every row)
  const timestamp = new Date().toLocaleString();
  // We skip the first row if it's a header, or copy all. Let's copy all to be safe.
  const labeledRows = rawData.map(row => [timestamp, deptName, supervisor, ...row]);

  // 4. Check if "Data_Logs" exists in YOUR main sheet
  const meta = await sheets.spreadsheets.get({ spreadsheetId: mainSpreadsheetId });
  const sheetExists = meta.data.sheets?.some(s => s.properties?.title === LOGS_SHEET_TITLE);

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: mainSpreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: LOGS_SHEET_TITLE } } }] }
    });
    // Add Header
    await sheets.spreadsheets.values.append({
      spreadsheetId: mainSpreadsheetId,
      range: `${LOGS_SHEET_TITLE}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [["Archived At", "Department", "Supervisor", "--- COPIED DATA ---"]] }
    });
  }

  // 5. Paste the data into your Archive
  await sheets.spreadsheets.values.append({
    spreadsheetId: mainSpreadsheetId,
    range: `${LOGS_SHEET_TITLE}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: labeledRows },
  });
}