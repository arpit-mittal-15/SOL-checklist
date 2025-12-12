import { google } from 'googleapis';

export const DEPARTMENTS = [
  { id: 'floor', name: 'Production (First Floor)', startCol: 1 },
  { id: 'basement', name: 'Production (Basement)', startCol: 5 },
  { id: 'quality', name: 'Quality Check', startCol: 9 },
  { id: 'stock', name: 'Stock Availability', startCol: 13 },
  { id: 'attendance', name: 'Attendance', startCol: 17 },
  { id: 'it_check', name: 'IT Final Verification', startCol: 21 }
];

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
  // Create row with enough empty slots for 6 departments
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

// --- 🔍 FULL SHEET DEEP SCAN VALIDATION ---
export async function checkSheetForToday(sheetLink: string) {
  const sheets = await getAuthSheets();

  // 1. Extract ID from link
  const matches = sheetLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matches || !matches[1]) return false;
  const externalSheetId = matches[1];

  try {
      // 2. READ THE ENTIRE SHEET (A to ZZ)
      // This captures virtually everything in the first tab
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: externalSheetId,
        range: 'A:ZZ', 
      });

      const rows = response.data.values || [];
      
      // 3. Generate Today's Date Strings (IST)
      const now = new Date();
      const options: any = { timeZone: 'Asia/Kolkata' };
      
      const day = now.toLocaleString('en-IN', { day: 'numeric', ...options }); 
      const monthNum = now.toLocaleString('en-IN', { month: 'numeric', ...options });
      const year = now.toLocaleString('en-IN', { year: 'numeric', ...options });
      const yearShort = year.slice(-2);
      const monthShort = now.toLocaleString('en-IN', { month: 'short', ...options }); // "Dec"
      
      const searchTerms = [
          `${day}/${monthNum}/${year}`,       // 12/12/2025
          `${day}-${monthNum}-${year}`,       // 12-12-2025
          `${day}/${monthNum}/${yearShort}`,  // 12/12/25
          `${day}-${monthNum}-${yearShort}`,  // 12-12-25
          `${year}-${monthNum}-${day}`,       // 2025-12-12
          `${day} ${monthShort}`,             // 12 Dec
          `${day}-${monthShort}`,             // 12-Dec
          `${Number(day)} ${monthShort}`,     // 5 Dec
          `${Number(day)}-${monthShort}`      // 5-Dec
      ];

      // 4. FLATTEN & SEARCH
      // Combine all cell data into one giant string to find the date anywhere
      const allText = rows.flat().join(" ").toLowerCase(); 

      const found = searchTerms.some(term => allText.includes(term.toLowerCase()));

      if (found) {
          console.log(`✅ Date found in sheet: ${externalSheetId}`);
      } else {
          console.log(`❌ Date NOT found. Searched for: ${searchTerms.join(", ")}`);
      }

      return found;

  } catch (error) {
      console.error("Validation Error (Access Denied?):", error);
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