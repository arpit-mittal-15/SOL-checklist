import { NextResponse } from 'next/server';
import { getAnalyticsData, runHighEndAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawData = await getAnalyticsData();
    
    if (!rawData) {
        return NextResponse.json({ 
            success: true, 
            kpis: { totalProduction: 0, efficiency: 0, rejectionRate: "0.0", qualityScore: 100, totalBoxes: 0, staffPresent: 0 },
            graphData: [],
            supervisorScores: [],
            anomalies: []
        });
    }

    const analyticsResults = runHighEndAnalytics(rawData);

    return NextResponse.json({ 
      success: true, 
      kpis: analyticsResults.kpis,
      graphData: analyticsResults.history,
      supervisorScores: analyticsResults.supervisorScores,
      anomalies: analyticsResults.anomalies
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}