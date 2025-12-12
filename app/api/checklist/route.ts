import { NextResponse } from 'next/server';
import { getTodayRow, createTodayRow, updateDepartmentData, checkSheetForToday, DEPARTMENTS } from '@/lib/sheets';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }).split(',')[0]; 
  
  try {
    let row = await getTodayRow(today);
    
    if (!row) {
      await createTodayRow(today);
      await new Promise(r => setTimeout(r, 1000));
      row = await getTodayRow(today);
    }
    
    const rowData = row?.data || [];
    const structuredData = DEPARTMENTS.map((dept) => ({
      id: dept.id,
      name: dept.name,
      completed: rowData[dept.startCol] === 'TRUE',
      supervisor: rowData[dept.startCol + 1] || '',
      timestamp: rowData[dept.startCol + 2] || '',
      comment: rowData[dept.startCol + 3] || '',
    }));

    const isAllDone = structuredData.every(d => d.completed);

    return NextResponse.json({ 
        date: today, 
        rowIndex: row?.rowIndex ?? 0, 
        departments: structuredData,
        isAllDone
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rowIndex, deptId, supervisor, comment, sheetLink } = body;
    
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    if (!dept) return NextResponse.json({ error: 'Invalid Dept' }, { status: 400 });

    if (deptId !== 'it_check') {
        if (!sheetLink) return NextResponse.json({ error: "Link missing" }, { status: 400 });
        const isValid = await checkSheetForToday(sheetLink);
        if (!isValid) return NextResponse.json({ error: `⚠️ Data Missing! Today's date not found in sheet.` }, { status: 400 });
    }

    // --- ⏰ TIME LOGIC (7:30 PM CUTOFF) ---
    const now = new Date();
    // Get numeric hour/minute in IST
    const istTimeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }); // "19:35:00"
    const [hours, minutes] = istTimeStr.split(':').map(Number);

    // Generate Display Timestamp
    let displayTime = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });

    // CHECK FOR LATE SUBMISSION (> 19:30)
    // Late if Hour > 19 OR (Hour is 19 AND Minute > 30)
    if (hours > 19 || (hours === 19 && minutes > 30)) {
        displayTime = `${displayTime} 🔴 LATE`; // Mark in sheet
    }

    await updateDepartmentData(rowIndex, dept.startCol, ['TRUE', supervisor, displayTime, comment]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}