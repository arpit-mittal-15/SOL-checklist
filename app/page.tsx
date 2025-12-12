'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle2, Lock, ArrowRight, Activity, ShieldCheck, Link as LinkIcon } from 'lucide-react';

// --- 🔐 SECURITY SETTINGS ---
const DEPARTMENT_PINS: Record<string, string> = {
  'floor': '1001',
  'basement': '2002',
  'quality': '3003',
  'stock': '4004',
  'attendance': '5005'
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [rowIndex, setRowIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/checklist');
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json.departments || []);
      setRowIndex(json.rowIndex);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (deptId: string, name: string, comment: string, sheetLink: string) => {
    setSubmitting(deptId);
    
    const res = await fetch('/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ rowIndex, deptId, supervisor: name, comment, sheetLink }),
    });

    const json = await res.json();
    
    if (!res.ok) {
        // If error (like bad link), show alert
        alert(json.error || "Failed to submit. Check your link permissions.");
    } else {
        await fetchData();
    }
    setSubmitting(null);
  };

  // Calculations
  const completedCount = data.filter(d => d.completed).length;
  const progress = (completedCount / 5) * 100;
  const isAllDone = completedCount === 5;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const dayStr = today.toLocaleDateString('en-GB', { weekday: 'long' });

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0f172a] text-white">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-bold tracking-widest uppercase text-blue-400">System Initializing...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans pb-24">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-transparent opacity-100" />
      </div>

      <header className="relative z-10 pt-6 px-6 pb-20">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="relative h-16 w-40 filter drop-shadow-lg">
             <Image src="/logo.webp" alt="Logo" fill className="object-contain object-left" priority />
          </div>
          <div className="text-right text-white">
            <div className="text-3xl font-black tracking-tighter leading-none">{dateStr}</div>
            <div className="text-xs font-bold text-blue-300 uppercase tracking-widest">{dayStr}</div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mt-8">
           <div className="flex justify-between items-end mb-2 text-white">
             <div>
               <h1 className="text-lg font-bold">Daily Protocol</h1>
               <p className="text-xs text-blue-200 opacity-80">Authorized Personnel Only</p>
             </div>
             <div className="text-right">
               <div className="text-3xl font-black leading-none">{Math.round(progress)}<span className="text-lg">%</span></div>
             </div>
           </div>
           
           <div className="h-3 w-full bg-blue-900/50 rounded-full backdrop-blur-sm overflow-hidden border border-white/10 relative">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(239,68,68,0.8)] relative overflow-hidden
                  ${isAllDone ? 'bg-green-500' : 'bg-gradient-to-r from-red-600 to-red-400'}
                `}
                style={{ width: `${Math.max(progress, 5)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
           </div>
        </div>
      </header>

      <main className="relative z-20 px-4 -mt-12 max-w-xl mx-auto space-y-5">
        {data.map((dept, index) => {
          const isLocked = index > 0 && !data[index - 1].completed;
          const isActive = !dept.completed && !isLocked;

          return (
            <div 
              key={dept.id}
              className={`
                relative rounded-2xl transition-all duration-500 ease-out overflow-hidden
                ${isActive 
                  ? 'bg-white shadow-[0_20px_40px_-15px_rgba(30,58,138,0.3)] scale-[1.02] ring-1 ring-red-100 translate-y-0 z-10' 
                  : 'bg-white/90 shadow-sm border border-slate-100 hover:bg-white translate-y-2 z-0'
                }
                ${isLocked ? 'opacity-60 grayscale-[50%] bg-slate-50' : ''}
              `}
            >
              {isActive && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500"></div>}

              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`
                    h-12 w-12 rounded-xl flex items-center justify-center text-lg shadow-inner
                    ${dept.completed ? 'bg-green-100 text-green-700' : isActive ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}
                  `}>
                    {dept.completed ? <CheckCircle2 size={24} /> : isActive ? <Activity size={24} className="animate-pulse"/> : <Lock size={22} />}
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-bold text-lg leading-tight ${dept.completed ? 'text-slate-800' : isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                      {dept.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {dept.completed && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Submitted</span>}
                      {isActive && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase animate-pulse">Action Required</span>}
                    </div>
                  </div>
                </div>

                <div className="pl-[60px]">
                  {dept.completed ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100 flex items-start gap-3">
                      <ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-slate-900 font-semibold">{dept.supervisor}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{dept.timestamp}</div>
                        {dept.comment && <div className="text-xs text-slate-500 italic mt-1 border-t border-slate-200 pt-1">"{dept.comment}"</div>}
                      </div>
                    </div>
                  ) : isActive ? (
                    <div className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                      <ActiveForm dept={dept} requiredPin={DEPARTMENT_PINS[dept.id]} onSubmit={handleSubmit} isSubmitting={submitting === dept.id} />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic flex items-center gap-2 h-8">Waiting for previous sequence...</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isAllDone && (
          <div className="text-center py-8 animate-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full text-green-700 mb-3 shadow-lg shadow-green-200">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800">All Systems Clear</h2>
            <p className="text-slate-500 text-sm">Great job team.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ActiveForm({ dept, requiredPin, onSubmit, isSubmitting }: any) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [pin, setPin] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const handleVerifyAndSubmit = () => {
    if (pin !== requiredPin) {
      setError('Incorrect Department PIN');
      return;
    }
    // Simple URL validation
    if (!link.includes('docs.google.com/spreadsheets')) {
        setError('Link must be a Google Sheet URL');
        return;
    }
    setError('');
    onSubmit(dept.id, name, comment, link);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
          <div className="group relative">
            <input 
            className="peer w-full h-11 bg-white border-b-2 border-slate-200 text-sm font-semibold text-slate-900 placeholder-transparent focus:border-red-500 focus:outline-none transition-colors"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            />
            <label className="absolute left-0 -top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-red-500">
            Supervisor Name
            </label>
          </div>
          
          <div className="group relative">
            <input 
            className="peer w-full h-11 bg-white border-b-2 border-slate-200 text-sm font-medium text-slate-900 placeholder-transparent focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Comments"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            />
            <label className="absolute left-0 -top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-blue-500">
            Comments (Optional)
            </label>
          </div>
      </div>

      {/* --- 🔗 MANDATORY SHEET LINK --- */}
      <div className="group relative">
        <div className="flex items-center gap-3">
             <div className="bg-green-50 p-3 rounded-lg text-green-700">
                 <LinkIcon size={20} />
             </div>
             <input 
             className="peer w-full h-12 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
             placeholder="Paste Google Sheet Link Here..."
             value={link}
             onChange={(e) => setLink(e.target.value)}
             />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 pl-12">
            *Ensure sheet is shared with bot or "Anyone with link".
        </p>
      </div>

      <div className="flex gap-3">
        <div className="group relative w-32 shrink-0">
            <input 
            type="password"
            maxLength={4}
            className={`peer w-full h-12 bg-white border-b-2 text-center text-sm font-bold text-slate-900 tracking-widest placeholder-transparent focus:outline-none transition-colors
                ${error && error.includes('PIN') ? 'border-red-500 text-red-600' : 'border-slate-200 focus:border-red-500'}
            `}
            placeholder="PIN"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(''); }}
            />
            <label className="absolute left-0 right-0 text-center -top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-red-500">
            PIN
            </label>
        </div>

        <button 
            disabled={!name.trim() || !pin || !link || isSubmitting}
            onClick={handleVerifyAndSubmit}
            className={`
            flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg
            ${!name.trim() || !pin || !link
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-[#1e3a8a] text-white shadow-blue-900/20 hover:bg-blue-900'
            }
            `}
        >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
            <>
                <span>VERIFY & SUBMIT</span>
                <ArrowRight size={16} />
            </>
            )}
        </button>
      </div>
      
      {error && <div className="text-center text-xs text-red-500 font-bold animate-pulse">{error}</div>}
    </div>
  );
}