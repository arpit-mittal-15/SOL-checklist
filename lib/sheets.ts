import { google } from 'googleapis';

export const DEPARTMENTS = [
  { id: 'floor', name: 'Production (First Floor)', startCol: 1 },
  { id: 'basement', name: 'Production (Basement)', startCol: 5 },
  { id: 'quality', name: 'Quality Check', startCol: 9 },
  { id: 'stock', name: 'Stock Availability', startCol: 13 },
  { id: 'attendance', name: 'Attendance', startCol: 17 },
  { id: 'it_check', name: 'IT Final Verification', startCol: 21 }
];

const CONFIG_SHEET = "Config_Links";

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

// --- 🔗 DYNAMIC LINK MANAGEMENT ---
export async function getStoredLinks() {
  const sheets = await getAuthSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // 1. Try to read the config sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG_SHEET}!A:B`,
    });

    const rows = response.data.values || [];
    // Convert rows to a simple object: { 'floor': 'https://...', 'basement': '...' }
    const links: Record<string, string> = {};
    rows.forEach(row => {
      if (row[0] && row[1]) links[row[0]] = row[1];
    });
    return links;

  } catch (e) {
    // 2. If sheet doesn't exist, create it with defaults
    console.log("Config sheet missing, creating...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: CONFIG_SHEET } } }] }
    });
    
    // Add default rows
    const defaults = DEPARTMENTS.map(d => [d.id, ""]); // Empty links initially
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${CONFIG_SHEET}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [["Dept_ID", "Latest_Link"], ...defaults] }
    });
    
    return {};
  }
}

export async function updateStoredLink(deptId: string, newLink: string) {
  const sheets = await getAuthSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  
  // 1. Get current config rows
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${CONFIG_SHEET}!A:A`, // Just get IDs
  });
  const rows = response.data.values || [];
  
  // 2. Find row number for this department
  let rowIndex = rows.findIndex(row => row[0] === deptId);
  
  if (rowIndex === -1) {
    // If not found, append it
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${CONFIG_SHEET}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[deptId, newLink]] }
    });
  } else {
    // 3. Update the specific cell (Column B is index 1, Row is index + 1)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${CONFIG_SHEET}!B${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newLink]] }
    });
  }
}

// --- STANDARD FUNCTIONS ---
export async function getTodayRow(dateStr: string) {
  const sheets = await getAuthSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:Z', 
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
    requestBody: { values: [[dateStr, ...Array(25).fill('')]] },
  });
}

export async function updateDepartmentData(rowIndex: number, colIndex: number, data: string[]) {
  const sheets = await getAuthSheets();
  const startChar = getColumnLetter(colIndex);
  const endChar = getColumnLetter(colIndex + 3);
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Sheet1!${startChar}${rowIndex}:${endChar}${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [data] },
  });
}

export async function checkSheetForToday(sheetLink: string) {
  const sheets = await getAuthSheets();
  const matches = sheetLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matches || !matches[1]) return false;
  const externalSheetId = matches[1];

  try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: externalSheetId,
        range: 'A:ZZ', 
      });
      const rows = response.data.values || [];
      const now = new Date();
      const options: any = { timeZone: 'Asia/Kolkata' };
      const day = now.toLocaleString('en-IN', { day: 'numeric', ...options }); 
      const monthNum = now.toLocaleString('en-IN', { month: 'numeric', ...options });
      const year = now.toLocaleString('en-IN', { year: 'numeric', ...options });
      const yearShort = year.slice(-2);
      const monthShort = now.toLocaleString('en-IN', { month: 'short', ...options });
      
      const searchTerms = [
          `${day}/${monthNum}/${year}`, `${day}-${monthNum}-${year}`,
          `${day}/${monthNum}/${yearShort}`, `${day}-${monthNum}-${yearShort}`,
          `${year}-${monthNum}-${day}`, `${day} ${monthShort}`, `${day}-${monthShort}`,
          `${Number(day)} ${monthShort}`, `${Number(day)}-${monthShort}`
      ];

      const allText = rows.flat().join(" ").toLowerCase(); 
      return searchTerms.some(term => allText.includes(term.toLowerCase()));
  } catch (error) {
      console.error("Val Error", error);
      return false; 
  }
}

function getColumnLetter(colIndex: number) {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}