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

    // --- 🔍 VALIDATION STEP ---
    // If it's NOT IT, we must check if their sheet has today's date
    if (deptId !== 'it_check') {
        if (!sheetLink) return NextResponse.json({ error: "Configuration Error: Link missing" }, { status: 400 });
        
        const isValid = await checkSheetForToday(sheetLink);
        
        if (!isValid) {
            return NextResponse.json({ 
                error: `⚠️ Data Missing! We could not find today's date in your sheet.` 
            }, { status: 400 });
        }
    }

    const timestamp = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });

    await updateDepartmentData(rowIndex, dept.startCol, ['TRUE', supervisor, timestamp, comment]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}