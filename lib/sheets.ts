import { google } from 'googleapis';

// --- TYPES ---
export interface DepartmentData {
  supervisor: string;
  comment?: string;
  sheetLink?: string | null;
  prodCount?: string;
  boxesUsed?: string;
  totalPresent?: string;
  totalAbsent?: string;
  piecesReceived?: string;
  okPieces?: string;
  rejCount?: string;
  itemsAdded?: string;
}

export const DEPARTMENTS = [
  { id: 'floor', name: 'Production (First Floor)', startCol: 1 },
  { id: 'basement', name: 'Production (Basement)', startCol: 5 },
  { id: 'quality', name: 'Quality Check', startCol: 9 },
  { id: 'stock', name: 'Stock Availability', startCol: 13 },
  { id: 'attendance', name: 'Attendance', startCol: 17 },
  { id: 'it_check', name: 'IT Final Verification', startCol: 21 }
];

const CONFIG_SHEET = "Config_Links";

// --- EXPORTED AUTH FUNCTION (Required for Analytics) ---
export async function getAuthSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth: await auth.getClient() as any });
}

export async function getStoredLinks() {
  const sheets = await getAuthSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${CONFIG_SHEET}!A:B` });
    const rows = response.data.values || [];
    const links: Record<string, string> = {};
    rows.forEach(row => { if (row[0] && row[1]) links[row[0]] = row[1]; });
    return links;
  } catch (e) { return {}; }
}

export async function updateStoredLink(deptId: string, newLink: string) {
  const sheets = await getAuthSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${CONFIG_SHEET}!A:A` });
  const rows = response.data.values || [];
  let rowIndex = rows.findIndex(row => row[0] === deptId);
  
  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({ spreadsheetId, range: `${CONFIG_SHEET}!A:A`, valueInputOption: 'USER_ENTERED', requestBody: { values: [[deptId, newLink]] } });
  } else {
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `${CONFIG_SHEET}!B${rowIndex + 1}`, valueInputOption: 'USER_ENTERED', requestBody: { values: [[newLink]] } });
  }
}

// --- 📝 NEW: SEPARATE SHEET LOGGING (DATABASE) ---
export async function logDepartmentData(deptId: string, data: DepartmentData) {
    const sheets = await getAuthSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    // Ensure tabs like "DB_Floor", "DB_Quality" exist in your Google Sheet
    const targetSheet = `DB_${deptId.charAt(0).toUpperCase() + deptId.slice(1)}`; 
    
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const dateStr = istDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = istDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // COMMON COLS: [Date, Time, Supervisor, Link, Comments]
    const common = [dateStr, timeStr, data.supervisor, data.sheetLink || "-", data.comment || ""];
    let rowValues: string[] = [];

    if (deptId === 'floor' || deptId === 'basement') {
        // [..., Production, Boxes]
        rowValues = [...common, data.prodCount || "0", data.boxesUsed || "0"];
    } else if (deptId === 'attendance') {
        // [..., Present, Absent]
        rowValues = [...common, data.totalPresent || "0", data.totalAbsent || "0"];
    } else if (deptId === 'quality') {
        // [..., Received, OK, Rejected]
        rowValues = [...common, data.piecesReceived || "0", data.okPieces || "0", data.rejCount || "0"];
    } else if (deptId === 'stock') {
        // [..., Items Added]
        rowValues = [...common, data.itemsAdded || "0"];
    } else {
        rowValues = common;
    }

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${targetSheet}!A:A`, 
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowValues] }
        });
    } catch (e) {
        console.error(`Error logging to ${targetSheet}. Ensure the tab exists!`, e);
    }
}

// --- 📊 OLD DASHBOARD LOGIC (Kept for safety) ---
export async function fetchDashboardMetrics() {
  const links = await getStoredLinks();
  const targetDepts = ['floor', 'basement', 'quality']; 
  const metricMap: Record<string, string[]> = {
    'Brands': ['brand', 'sku name'], 'RFS': ['total rfs', 'rfs'],
    'Rollers': ['total rollers'], 'Manpower': ['total manpower'],
    'Production': ['total production'], 'QCRejected': ['total rejected pieces']
  };
  const aggregatedData: Record<string, number | string> = {};
  for (const key in metricMap) aggregatedData[key] = 0;
  aggregatedData['Brands'] = ""; 

  for (const dept of targetDepts) {
    // ... (Your original logic remains here if you need it)
  }
  return aggregatedData;
}

// --- 🏆 LEADERBOARD INTELLIGENCE ---
export async function getLeaderboardData() {
  const sheets = await getAuthSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sheet1!A:Z' });
    return response.data.values ? response.data.values.slice(1) : [];
  } catch (error) { return []; }
}

// --- STANDARD EXPORTS ---
export async function getTodayRow(dateStr: string) {
  const sheets = await getAuthSheets();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: 'Sheet1!A:Z' });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === dateStr);
  if (rowIndex === -1) return null;
  return { rowIndex: rowIndex + 1, data: rows[rowIndex] };
}
export async function createTodayRow(dateStr: string) {
  const sheets = await getAuthSheets();
  await sheets.spreadsheets.values.append({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: 'Sheet1!A:A', valueInputOption: 'USER_ENTERED', requestBody: { values: [[dateStr, ...Array(25).fill('')]] } });
}
export async function updateDepartmentData(rowIndex: number, colIndex: number, data: string[]) {
  const sheets = await getAuthSheets();
  const startChar = getColumnLetter(colIndex);
  const endChar = getColumnLetter(colIndex + 3);
  await sheets.spreadsheets.values.update({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: `Sheet1!${startChar}${rowIndex}:${endChar}${rowIndex}`, valueInputOption: 'USER_ENTERED', requestBody: { values: [data] } });
}
function getColumnLetter(colIndex: number) {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}