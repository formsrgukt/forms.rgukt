import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import Icon from './Icon/Icon';

// Mock data for visualizations
const timeData = [
  { date: 'Mon', responses: 45 },
  { date: 'Tue', responses: 52 },
  { date: 'Wed', responses: 120 },
  { date: 'Thu', responses: 85 },
  { date: 'Fri', responses: 65 },
  { date: 'Sat', responses: 30 },
  { date: 'Sun', responses: 110 }
];

const deptData = [
  { name: 'Computer Science', value: 420 },
  { name: 'Electronics', value: 380 },
  { name: 'Mechanical', value: 145 },
  { name: 'Civil', value: 97 }
];

const satisfactionData = [
  { name: 'Excellent', value: 65, color: 'var(--success-500)' },
  { name: 'Good', value: 20, color: 'var(--primary-400)' },
  { name: 'Average', value: 10, color: 'var(--warning-400)' },
  { name: 'Poor', value: 5, color: 'var(--error-500)' }
];

const suggestions = [
  { id: 1, text: "The lab equipment needs an upgrade, especially the oscilloscopes.", sentiment: "Constructive", color: "var(--warning-600)", bg: "var(--warning-100)" },
  { id: 2, text: "Excellent support from the teaching assistants this semester!", sentiment: "Positive", color: "var(--success-600)", bg: "var(--success-100)" },
  { id: 3, text: "Library hours should be extended during exam weeks.", sentiment: "Constructive", color: "var(--warning-600)", bg: "var(--warning-100)" },
  { id: 4, text: "Hostel WiFi connectivity drops frequently in Block B.", sentiment: "Negative", color: "var(--error-600)", bg: "var(--error-100)" }
];

function Analytics() {
  return (
    <div className="analytics-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Detailed Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Student Feedback Survey 2024</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary">
            <Icon name="filter" size={18} /> Filter
          </button>
          <button className="btn btn-primary">
            <Icon name="download" size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Total Responses</span>
            <div style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="users" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>1,042</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success-600)', fontWeight: 'var(--font-weight-medium)' }}>+12%</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Completion Rate</span>
            <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="check" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>86%</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success-600)', fontWeight: 'var(--font-weight-medium)' }}>+2.4%</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Responses Today</span>
            <div style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-600)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="activity" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>42</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)', fontWeight: 'var(--font-weight-medium)' }}>-5%</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Avg. Time</span>
            <div style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="clock" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>4m 12s</h3>
          </div>
        </div>
      </div>

      {/* Middle Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }} className="dashboard-grid-2">
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)', fontWeight: 'var(--font-weight-medium)' }}>Responses Over Time</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-app)' }}
                  itemStyle={{ color: 'var(--primary-600)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="responses" stroke="var(--primary-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorResponses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)', fontWeight: 'var(--font-weight-medium)' }}>Department Distribution</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--gray-50)' }}
                  contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--primary-500)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }} className="dashboard-grid-2">
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)', fontWeight: 'var(--font-weight-medium)' }}>Overall Satisfaction</h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={satisfactionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {satisfactionData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', width: '60px' }}>{item.name}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}>Recent Suggestions</h3>
            <button className="btn-ghost text-sm" style={{ padding: 0, color: 'var(--primary-600)' }}>View all</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1, overflowY: 'auto' }}>
            {suggestions.map(s => (
              <div key={s.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>"{s.text}"</p>
                <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', backgroundColor: s.bg, color: s.color }}>
                  {s.sentiment}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @media (min-width: 1024px) {
          .dashboard-grid-2 {
            grid-template-columns: 2fr 1fr;
          }
          .dashboard-grid-2:last-child {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Analytics;
