import { getAuthSheets } from './sheets';

// --- CONFIGURATION ---
const STANDARD_UNITS_PER_BOX = 1000; 
const ANOMALY_THRESHOLD = 2.0;

// --- TYPES ---
export interface AnalyticsData {
  floor: any[];
  quality: any[];
  stock: any[];
  attendance: any[];
}

export interface SupervisorScore {
  name: string;
  score: number;
  totalOutput: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Anomaly {
  dept: string;
  metric: string;
  value: number;
  average: number;
  severity: 'medium' | 'high';
}

// --- 1. DATA INGESTION ---
export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  const sheets = await getAuthSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  
  // Fetch from DB sheets
  const ranges = ['DB_Floor!A:Z', 'DB_Quality!A:Z', 'DB_Stock!A:Z', 'DB_Attendance!A:Z'];
  
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const data = response.data.valueRanges;
    if (!data) return null;

    // --- SAFETY FIX HERE ---
    // We use optional chaining (?.) and default arrays (|| []) to prevent "Object is possibly undefined" errors.
    const floorRaw = data[0]?.values || [];
    const qualityRaw = data[1]?.values || [];
    const stockRaw = data[2]?.values || [];
    const attendanceRaw = data[3]?.values || [];

    return {
      floor: parseSheet(floorRaw, ['date', 'time', 'supervisor', 'link', 'comment', 'production', 'boxes']),
      quality: parseSheet(qualityRaw, ['date', 'time', 'supervisor', 'link', 'comment', 'received', 'ok', 'rejected']),
      stock: parseSheet(stockRaw, ['date', 'time', 'supervisor', 'link', 'comment', 'itemsAdded']),
      attendance: parseSheet(attendanceRaw, ['date', 'time', 'supervisor', 'link', 'comment', 'present', 'absent']),
    };
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    return null;
  }
}

// Helper: Safely parses Google Sheet rows
function parseSheet(rows: any[][], headers: string[]) {
  if (!rows || rows.length === 0) return [];
  return rows.map(row => {
    const obj: any = {};
    headers.forEach((h, i) => {
      const val = row[i];
      const cleanVal = val?.toString().replace(/,/g, '').trim(); 
      const isNum = !isNaN(parseFloat(cleanVal)) && isFinite(cleanVal as any) && !cleanVal.includes('/');
      obj[h] = isNum ? parseFloat(cleanVal) : val;
    });
    return obj;
  }).filter(r => r.date && r.date.includes('/')); 
}

// --- 2. ADVANCED CALCULATIONS ---
export function runHighEndAnalytics(data: AnalyticsData) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const matchDate = istDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const dailyFloor = data.floor.filter(d => d.date === matchDate);
  const dailyQuality = data.quality.filter(d => d.date === matchDate);
  const dailyAttendance = data.attendance.filter(d => d.date === matchDate);
  
  const totalProduction = dailyFloor.reduce((sum, r) => sum + (r.production || 0), 0);
  const totalBoxes = dailyFloor.reduce((sum, r) => sum + (r.boxes || 0), 0);
  
  const efficiency = totalBoxes > 0 
    ? Math.round((totalProduction / (totalBoxes * STANDARD_UNITS_PER_BOX)) * 100) 
    : 0;

  const totalOK = dailyQuality.reduce((sum, r) => sum + (r.ok || 0), 0);
  const totalRejected = dailyQuality.reduce((sum, r) => sum + (r.rejected || 0), 0);
  const qTotal = totalOK + totalRejected;
  
  const rawRejectionRate = qTotal > 0 ? (totalRejected / qTotal) * 100 : 0;
  const qualityScore = qTotal > 0 
    ? Math.max(0, Math.round(((totalOK - (totalRejected * 1.5)) / qTotal) * 100))
    : 100;

  const staffPresent = dailyAttendance.reduce((sum, r) => sum + (r.present || 0), 0);

  const supervisorScores = calculateSPI(data.floor);
  const anomalies = detectAnomalies(data.floor, totalProduction);

  return {
    kpis: {
      totalProduction,
      efficiency,
      rejectionRate: rawRejectionRate.toFixed(1),
      qualityScore,
      totalBoxes,
      staffPresent
    },
    supervisorScores,
    anomalies,
    history: aggregateHistory(data.floor) 
  };
}

// --- 3. LOGIC MODULES ---
function calculateSPI(floorHistory: any[]): SupervisorScore[] {
  const supervisorMap = new Map<string, number[]>();
  floorHistory.forEach(row => {
    if (!row.supervisor || !row.production) return;
    if (!supervisorMap.has(row.supervisor)) supervisorMap.set(row.supervisor, []);
    supervisorMap.get(row.supervisor)?.push(row.production);
  });

  const allProductions = floorHistory.map(r => r.production || 0);
  const deptAverage = allProductions.reduce((a, b) => a + b, 0) / (allProductions.length || 1);

  const scores: SupervisorScore[] = [];
  supervisorMap.forEach((outputs, name) => {
    const avg = outputs.reduce((a, b) => a + b, 0) / outputs.length;
    const rawScore = avg / (deptAverage || 1); 
    const lastOutput = outputs[outputs.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (lastOutput > avg * 1.1) trend = 'up';
    if (lastOutput < avg * 0.9) trend = 'down';

    scores.push({ name, score: parseFloat(rawScore.toFixed(2)), totalOutput: outputs.reduce((a,b) => a +b, 0), trend });
  });
  return scores.sort((a, b) => b.score - a.score).slice(0, 5);
}

function detectAnomalies(history: any[], todayValue: number): Anomaly[] {
  const dailyMap = new Map<string, number>();
  history.forEach(r => {
    if (!dailyMap.has(r.date)) dailyMap.set(r.date, 0);
    dailyMap.set(r.date, dailyMap.get(r.date)! + (r.production || 0));
  });

  const values = Array.from(dailyMap.values());
  if (values.length < 3) return []; 

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const zScore = (todayValue - mean) / (stdDev || 1);

  const anomalies: Anomaly[] = [];
  if (zScore < -ANOMALY_THRESHOLD) {
    anomalies.push({ dept: 'Floor', metric: 'Production Drop', value: todayValue, average: Math.round(mean), severity: zScore < -3 ? 'high' : 'medium' });
  }
  return anomalies;
}

function aggregateHistory(floorData: any[]) {
    const historyMap = new Map();
    floorData.forEach(row => {
        if (!row.date) return;
        if(!historyMap.has(row.date)) {
            historyMap.set(row.date, { date: row.date, production: 0 });
        }
        const entry = historyMap.get(row.date);
        entry.production += (Number(row.production) || 0);
    });
    return Array.from(historyMap.values()).slice(-14);
}