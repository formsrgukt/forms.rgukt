import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import Icon from './Icon/Icon';
import Loader from './Loader';
import { getForms, getAllResponses } from '../services/db';

function Analytics() {
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedForms, fetchedResponses] = await Promise.all([
          getForms(),
          getAllResponses()
        ]);
        setForms(fetchedForms);
        setResponses(fetchedResponses);
      } catch (err) {
        console.error("Error fetching analytics data", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="container flex-center" style={{ minHeight: '60vh' }}><Loader /></div>;
  }

  // Calculate top metrics
  const totalResponses = responses.length;
  const activeForms = forms.length;

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const responsesToday = responses.filter(r => (now - r.submittedAt) < oneDayMs).length;

  let latestActivity = 'None';
  if (responses.length > 0) {
    const latestDate = new Date(responses[0].submittedAt);
    latestActivity = latestDate.toLocaleDateString() + ' ' + latestDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Compute Responses Over Time (Last 7 days)
  const timeDataMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * oneDayMs);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    timeDataMap[dateStr] = 0;
  }
  
  responses.forEach(r => {
    if ((now - r.submittedAt) < 7 * oneDayMs) {
      const dateStr = new Date(r.submittedAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (timeDataMap[dateStr] !== undefined) {
        timeDataMap[dateStr]++;
      }
    }
  });

  const timeData = Object.keys(timeDataMap).map(key => ({
    date: key,
    responses: timeDataMap[key]
  }));

  // Compute Top Forms (Top 5 by responses)
  const formCounts = {};
  responses.forEach(r => {
    formCounts[r.formId] = (formCounts[r.formId] || 0) + 1;
  });

  let topFormsData = Object.keys(formCounts).map(formId => {
    const form = forms.find(f => f.id === formId);
    let shortName = form ? (form.title || 'Untitled Form') : 'Deleted Form';
    if (shortName.length > 20) shortName = shortName.substring(0, 20) + '...';
    return {
      name: shortName,
      value: formCounts[formId]
    };
  });
  
  topFormsData.sort((a, b) => b.value - a.value);
  topFormsData = topFormsData.slice(0, 5);
  
  // Latest Responses (Top 10)
  const latestResponses = responses.slice(0, 10);

  return (
    <div className="analytics-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Global Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Overview across all your forms</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary">
            <Icon name="filter" size={18} /> Filter
          </button>
          <button className="btn btn-primary" onClick={() => alert("CSV Export coming soon!")}>
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
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>{totalResponses}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Active Forms</span>
            <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="check" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>{activeForms}</h3>
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
            <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>{responsesToday}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Latest Activity</span>
            <div style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="clock" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)' }}>{latestActivity}</h3>
          </div>
        </div>
      </div>

      {/* Middle Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }} className="dashboard-grid-2">
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)', fontWeight: 'var(--font-weight-medium)' }}>Responses Over Time (Last 7 Days)</h3>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
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
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)', fontWeight: 'var(--font-weight-medium)' }}>Top Forms by Activity</h3>
          {topFormsData.length === 0 ? (
            <div className="flex-center" style={{ height: '300px', color: 'var(--text-tertiary)' }}>No data yet</div>
          ) : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={topFormsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--gray-50)' }}
                    contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {topFormsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="var(--primary-500)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}>Latest Responses</h3>
        </div>
        
        {latestResponses.length === 0 ? (
          <div className="flex-center" style={{ padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>No responses recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Timestamp</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Form Name</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {latestResponses.map((response) => {
                  const form = forms.find(f => f.id === response.formId);
                  return (
                    <tr key={response.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                        {new Date(response.submittedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {form ? form.title || 'Untitled Form' : 'Deleted Form'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                        {response.email || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style>{`
        @media (min-width: 1024px) {
          .dashboard-grid-2 {
            grid-template-columns: 2fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Analytics;
