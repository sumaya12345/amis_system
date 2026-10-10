import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function HRoleDetail({ userId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`http://localhost:5000/api/admin/h-role-overview/${userId}`)
      .then(res => {
        if (res.data.success) {
          setDetail(res.data.detail);
        } else {
          setError('Failed to load detail');
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setError('Unauthorized – session may have expired');
        } else {
          setError('Error loading detail');
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading detail…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!detail) return <div>Coming Soon / Not Implemented Yet</div>;

  // Simple display of detail fields (adjust as needed)
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '10px' }}>← Back</button>
      <h2>H‑Role Detail</h2>
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </div>
  );
}
