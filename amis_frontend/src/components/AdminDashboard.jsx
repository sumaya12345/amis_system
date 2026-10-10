import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/dashboard')
      .then(res => {
        if (res.data.success) {
          setStats(res.data.stats);
        } else {
          setError('Failed to load stats');
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setError('Unauthorized – session may have expired');
        } else {
          setError('Error loading dashboard');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats) return <div>No data available.</div>;

  // Render available stats dynamically
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
            <strong>{key.replace(/_/g, ' ')}</strong>
            <div>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
