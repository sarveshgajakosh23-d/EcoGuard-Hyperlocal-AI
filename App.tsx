/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Wind, Thermometer, Droplets, Map as MapIcon, ShieldAlert, FileText, Send, Clock, Factory, Car, Trash2, HardHat } from 'lucide-react';
import { Reading, AIInsight, CitizenReport, ExposureMetric } from './types';
import { getPollutionInsights } from './services/geminiService';
import { PollutionHeatmap } from './components/PollutionHeatmap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [exposure, setExposure] = useState<ExposureMetric[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');

  const fetchData = async () => {
    try {
      const [readingsRes, reportsRes, exposureRes] = await Promise.all([
        fetch('/api/readings/latest'),
        fetch('/api/reports'),
        fetch('/api/exposure')
      ]);
      const readingsData = await readingsRes.json();
      const reportsData = await reportsRes.json();
      const exposureData = await exposureRes.json();
      setReadings(readingsData);
      setReports(reportsData);
      setExposure(exposureData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const generateAIInsights = async () => {
    if (readings.length === 0) return;
    setLoadingAI(true);
    const data = await getPollutionInsights(readings, reports);
    setInsights(data);
    setLoadingAI(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (readings.length > 0 && !insights) {
      generateAIInsights();
    }
  }, [readings]);

  const [reportForm, setReportForm] = useState({ description: '', severity: 'Medium' });

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description) return;
    
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1,
          description: reportForm.description,
          severity: reportForm.severity.toLowerCase()
        })
      });
      setReportForm({ description: '', severity: 'Medium' });
      fetchData();
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  const avgPM25 = readings.reduce((acc, r) => acc + r.pm25, 0) / (readings.length || 1);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wind className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">EcoGuard <span className="text-emerald-500">Hyperlocal</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Municipal Air Intelligence</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'overview' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'reports' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Citizen Reports
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Live System</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Emergency Alerts */}
              {insights?.alerts && insights.alerts.length > 0 && (
                <div className="space-y-4">
                  {insights.alerts.map((alert, i) => (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={i} 
                      className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center animate-pulse">
                          <AlertTriangle className="text-black w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-500">Hazard Alert: {alert.ward}</h3>
                          <p className="text-xs text-zinc-400">AQI predicted to reach {alert.predictedAQI} within {alert.timeframe}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.actions.map((action, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase">
                            {action}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  label="Avg City PM2.5" 
                  value={Math.round(avgPM25)} 
                  unit="µg/m³" 
                  icon={<Activity className="w-4 h-4 text-emerald-500" />}
                  trend="+2.4% vs yesterday"
                />
                <StatCard 
                  label="Active Sensors" 
                  value={readings.length} 
                  unit="Units" 
                  icon={<Wind className="w-4 h-4 text-blue-500" />}
                />
                <StatCard 
                  label="Risk Level" 
                  value={insights?.riskLevel || '...'} 
                  unit="" 
                  icon={<ShieldAlert className="w-4 h-4 text-orange-500" />}
                  isStatus
                />
                <StatCard 
                  label="Reports (24h)" 
                  value={reports.length} 
                  unit="Alerts" 
                  icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Visualization */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-sm font-semibold flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-emerald-500" />
                        Hyperlocal Pollution Heatmap
                      </h2>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">Ward-Level Resolution</span>
                    </div>
                    <PollutionHeatmap readings={readings} />
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                    <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Citizen Exposure Tracker (Today)
                    </h2>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={exposure}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="ward" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          />
                          <Bar dataKey="hazardousDurationMinutes" radius={[4, 4, 0, 0]}>
                            {exposure.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.hazardousDurationMinutes > 60 ? '#ef4444' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-4 text-center uppercase tracking-widest">Minutes of Hazardous AQI Exposure per Ward</p>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                    <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Pollution Trend Analysis
                    </h2>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={readings}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="ward_name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#10b981' }}
                          />
                          <Line type="monotone" dataKey="pm25" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                          <Line type="monotone" dataKey="pm10" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* AI Insights Sidebar */}
                <div className="space-y-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShieldAlert className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">AI Intelligence Engine</h2>
                      </div>
                      
                      {loadingAI ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-4 bg-emerald-500/10 rounded w-3/4" />
                          <div className="h-20 bg-emerald-500/10 rounded" />
                          <div className="h-4 bg-emerald-500/10 rounded w-1/2" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] text-emerald-500/60 uppercase font-mono mb-2">Detected Hotspots</p>
                            <div className="flex flex-wrap gap-2">
                              {insights?.hotspots.map((h, i) => (
                                <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-medium">
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-emerald-500/60 uppercase font-mono mb-2">Source Intelligence</p>
                            <div className="space-y-3">
                              {insights?.sourceAnalysis.map((analysis, i) => (
                                <div key={i} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                                  <div className="text-[10px] text-zinc-400 mb-2">{analysis.ward}</div>
                                  <div className="space-y-1.5">
                                    {analysis.sources.map((s, idx) => (
                                      <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {s.type.includes('Traffic') && <Car className="w-3 h-3 text-blue-400" />}
                                          {s.type.includes('Construction') && <HardHat className="w-3 h-3 text-orange-400" />}
                                          {s.type.includes('Industrial') && <Factory className="w-3 h-3 text-purple-400" />}
                                          {s.type.includes('Waste') && <Trash2 className="w-3 h-3 text-red-400" />}
                                          <span className="text-[10px] text-zinc-300">{s.type}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-500">{Math.round(s.probability * 100)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-emerald-500/60 uppercase font-mono mb-2">6H Forecast</p>
                            <p className="text-sm text-zinc-300 leading-relaxed italic">
                              "{insights?.prediction}"
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-emerald-500/60 uppercase font-mono mb-2">Mitigation Actions</p>
                            <ul className="space-y-2">
                              {insights?.recommendations.map((r, i) => (
                                <li key={i} className="text-xs text-zinc-400 flex gap-2">
                                  <span className="text-emerald-500">•</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <button 
                            onClick={generateAIInsights}
                            className="w-full py-3 bg-emerald-500 text-black text-xs font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                          >
                            <Activity className="w-4 h-4" />
                            Refresh AI Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weather Context */}
                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Environmental Context</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                        <Thermometer className="w-4 h-4 text-orange-400 mb-2" />
                        <div className="text-lg font-bold">24°C</div>
                        <div className="text-[10px] text-zinc-500 uppercase">Temp</div>
                      </div>
                      <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                        <Droplets className="w-4 h-4 text-blue-400 mb-2" />
                        <div className="text-lg font-bold">62%</div>
                        <div className="text-[10px] text-zinc-500 uppercase">Humidity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                    <FileText className="text-red-500 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Citizen Reporting Portal</h2>
                    <p className="text-xs text-zinc-500">Help us identify local pollution incidents in real-time.</p>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmitReport}>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Incident Description</label>
                    <textarea 
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors min-h-[120px]"
                      placeholder="e.g., Heavy smoke detected near Industrial Ward B..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Severity</label>
                      <select 
                        value={reportForm.severity}
                        onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Location</label>
                      <button className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-sm flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors">
                        <MapIcon className="w-4 h-4" />
                        Detect Current Location
                      </button>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-400 transition-colors flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Report
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Community Reports</h3>
                {reports.map((report) => (
                  <div key={report.id} className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${report.severity === 'high' ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <div>
                      <p className="text-sm text-zinc-200 mb-1">{report.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono uppercase">
                        <span>{new Date(report.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-red-400">{report.severity} Severity</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Wind className="w-5 h-5" />
            <span className="text-sm font-bold">EcoGuard v1.0</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
            <a href="#" className="hover:text-emerald-500 transition-colors">System Status</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">API Documentation</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
          </div>
          <p className="text-[10px] text-zinc-600 font-mono">© 2026 Municipal Air Intelligence Division</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, unit, icon, trend, isStatus }: { label: string, value: string | number, unit: string, icon: React.ReactNode, trend?: string, isStatus?: boolean }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl hover:border-emerald-500/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && <span className="text-[10px] text-emerald-500 font-mono">{trend}</span>}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{label}</p>
        <div className="flex items-baseline gap-1">
          <h3 className={`text-2xl font-bold tracking-tight ${isStatus ? 'capitalize text-emerald-400' : 'text-white'}`}>
            {value}
          </h3>
          <span className="text-xs text-zinc-500 font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
}
