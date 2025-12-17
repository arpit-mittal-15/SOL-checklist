import { NextResponse } from 'next/server';
import { getLeaderboardData, DEPARTMENTS } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawData = await getLeaderboardData();
    
    // Helper to parse time string "7:15:00 PM" -> Minutes from midnight
    const parseTime = (timeStr: string) => {
        if (!timeStr) return 9999; // No submission = infinite time
        const cleanTime = timeStr.replace('🔴 LATE', '').trim();
        const [time, modifier] = cleanTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const scores: Record<string, any> = {};
    const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }); // e.g. "17 Dec 2025" or however your sheet saves it (Adjust format to match your sheet)
    
    // Initialize Departments
    DEPARTMENTS.forEach(d => {
        if (d.id !== 'it_check') {
            scores[d.name] = { 
                id: d.id, 
                name: d.name, 
                supervisor: 'Unknown', 
                todayTime: null, 
                points: 0,
                weeklyScore: 0,
                monthlyScore: 0 
            };
        }
    });

    // Process Rows
    rawData.forEach(row => {
        const rowDate = row[0]; // Date column
        
        DEPARTMENTS.forEach(dept => {
            if (dept.id === 'it_check') return;

            const supervisor = row[dept.startCol + 1];
            const timestamp = row[dept.startCol + 2];
            
            if (timestamp) {
                // Determine Points based on time (Earlier is better)
                // Deadline 19:30 (1170 mins). 
                const minutes = parseTime(timestamp);
                let dailyPoints = 0;
                
                if (minutes <= 1170) { // Before 7:30 PM
                    // Max points 100 for very early, decreasing as it gets closer to 7:30
                    dailyPoints = Math.max(0, 100 - Math.floor((minutes - 1080) / 2)); // Example scoring
                    if (dailyPoints < 10) dailyPoints = 10; // Minimum points for being on time
                }

                if (scores[dept.name]) {
                    scores[dept.name].weeklyScore += dailyPoints;
                    scores[dept.name].monthlyScore += dailyPoints;
                    // Update latest known supervisor name
                    if (supervisor) scores[dept.name].supervisor = supervisor;
                    
                    // If row is TODAY, set today's stats
                    // Note: Date matching logic might need strict formatting check depending on your sheet
                    // For now, we assume the last row is today or we check simply
                    if (rowDate && rowDate.includes(new Date().getDate().toString())) {
                         scores[dept.name].todayTime = timestamp;
                         scores[dept.name].points = dailyPoints;
                    }
                }
            }
        });
    });

    // Convert to Array and Sort by Today's Points
    const leaderboard = Object.values(scores).sort((a: any, b: any) => {
        // Sort by Today's submission time (earlier is better)
        // If no submission today, put at bottom
        if (!a.todayTime) return 1;
        if (!b.todayTime) return -1;
        return parseTime(a.todayTime) - parseTime(b.todayTime);
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}