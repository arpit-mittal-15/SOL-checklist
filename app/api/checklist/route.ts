import { NextResponse } from 'next/server';
import { getTodayRow, createTodayRow, updateDepartmentData, processSheetLink, DEPARTMENTS } from '@/lib/sheets';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
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

    return NextResponse.json({ date: today, rowIndex: row?.rowIndex ?? 0, departments: structuredData });
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

    const timestamp = format(new Date(), 'HH:mm:ss');
    
    // 1. Process the External Link (If provided)
    // We do this FIRST. If the link is bad (access denied), we fail and don't check off the task.
    if (sheetLink) {
        try {
            await processSheetLink(dept.name, supervisor, sheetLink);
        } catch (e) {
            console.error("Link Error:", e);
            return NextResponse.json({ error: 'Link Error: Please ensure "Anyone with link" is viewable or share with bot email.' }, { status: 400 });
        }
    } else {
        // Enforce Mandatory Link
        return NextResponse.json({ error: 'Google Sheet Link is required' }, { status: 400 });
    }

    // 2. If Link was successful, Mark as Complete
    await updateDepartmentData(rowIndex, dept.startCol, ['TRUE', supervisor, timestamp, comment]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}