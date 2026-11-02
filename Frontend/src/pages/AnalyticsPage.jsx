import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, PieChart as PieChartIcon,
  FolderOpen, Users, FileText
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardService } from '../services';
import {
  MONTHLY_DISCIPLINE_DATA, CASE_DISTRIBUTION, MONTHLY_CASES
} from '../data/mockData';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6months');
  const [charts, setCharts] = useState({
    monthlyDiscipline: MONTHLY_DISCIPLINE_DATA,
    caseDistribution: CASE_DISTRIBUTION,
    monthlyCases: MONTHLY_CASES,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await dashboardService.getCharts();
        if (active && res.success && res.data) {
          setCharts({
            monthlyDiscipline: res.data.monthlyDiscipline || MONTHLY_DISCIPLINE_DATA,
            caseDistribution: res.data.caseDistribution || CASE_DISTRIBUTION,
            monthlyCases: res.data.monthlyCases || MONTHLY_CASES,
          });
        }
      } catch {
        // Fallback ke data mock
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analitik</h1>
          <p className="page-subtitle">Analisis tren kedisiplinan dan penanganan kasus</p>
        </div>
        <select className="filter-select" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="3months">3 Bulan Terakhir</option>
          <option value="6months">6 Bulan Terakhir</option>
          <option value="1year">1 Tahun Terakhir</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Tingkat Kehadiran', value: '93%', color: 'green', icon: TrendingUp },
          { label: 'Total Kasus Aktif', value: 8, color: 'yellow', icon: FolderOpen },
          { label: 'Laporan Bulan Ini', value: 5, color: 'red', icon: FileText },
          { label: 'Pegawai Termonitor', value: 430, color: 'blue', icon: Users },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`}><s.icon size={22} /></div>
            <div className="stat-content">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Trend */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-base)', fontWeight: 700 }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Tren Kehadiran Pegawai
          </h3>
        </div>
        <div className="card-body">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.monthlyDiscipline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="hadir" name="Hadir (%)" stackId="1" stroke="#198754" fill="#198754" fillOpacity={0.3} />
                <Area type="monotone" dataKey="terlambat" name="Terlambat (%)" stackId="1" stroke="#D99A17" fill="#D99A17" fillOpacity={0.3} />
                <Area type="monotone" dataKey="tidakHadir" name="Tidak Hadir (%)" stackId="1" stroke="#C0392B" fill="#C0392B" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        {/* Case Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              <PieChartIcon size={18} style={{ color: 'var(--primary)' }} /> Distribusi Kasus
            </h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.caseDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${value}`}
                  >
                    {charts.caseDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Cases */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} /> Kasus Bulanan
            </h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.monthlyCases} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baru" name="Baru" fill="#4EA5D9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selesai" name="Selesai" fill="#198754" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aktif" name="Aktif" fill="#D99A17" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
