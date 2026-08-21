import { useState } from 'react';
import { getDeliveries, todayDate } from '../api';

// Change this to a strong password before deploying
const ADMIN_PASSWORD = 'podadmin2024';

const ZONE_LABELS = {
  MB: 'Mira-Bhayandar', CH: 'Chembur', PW: 'Powai',
  AN: 'Andheri', ML: 'Malad', VD: 'Vandre', BV: 'Borivali',
};

export default function AdminView({ onBack }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');

  const [date, setDate] = useState(todayDate());
  const [deliveries, setDeliveries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterZone, setFilterZone] = useState('ALL');

  const handlePwSubmit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      loadDeliveries(date);
    } else {
      setPwError('Incorrect password');
    }
  };

  const loadDeliveries = async (d) => {
    setLoading(true);
    setError('');
    try {
      const result = await getDeliveries(d);
      if (result.success) {
        setDeliveries(result.deliveries);
      } else {
        setError(result.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    loadDeliveries(e.target.value);
  };

  const filtered = filterZone === 'ALL'
    ? (deliveries || [])
    : (deliveries || []).filter(d => d.point_id?.startsWith(filterZone));

  const complete = filtered.filter(d => d.status === 'complete').length;
  const partial = filtered.filter(d => d.status === 'partial').length;

  // ── Password gate ──────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--primary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🔒 Admin Access</h2>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 20 }}>
            Enter your admin password to continue
          </p>
          <form onSubmit={handlePwSubmit}>
            <input
              className="input"
              type="password"
              placeholder="Admin password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
            />
            {pwError && <div className="banner banner-error" style={{ marginBottom: 12 }}>{pwError}</div>}
            <button type="submit" className="btn btn-primary">Enter</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
              ← Back to Driver Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ────────────────────────────────────────────
  return (
    <div className="page">
      <div className="header">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>📊 Admin Dashboard</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>All delivery records</div>
        </div>
        <button onClick={onBack}>← Exit</button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 2 }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            style={{ padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 2 }}>Zone</label>
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            style={{ padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 14 }}
          >
            <option value="ALL">All Zones</option>
            {Object.entries(ZONE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => loadDeliveries(date)}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary cards */}
      {deliveries && (
        <div style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
          {[
            { label: 'Total', value: filtered.length, color: 'var(--primary)' },
            { label: 'Complete', value: complete, color: 'var(--success)' },
            { label: 'Partial', value: partial, color: 'var(--error)' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: '#fff', borderRadius: 8, padding: '10px 12px',
              textAlign: 'center', boxShadow: 'var(--shadow)',
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="spinner" />}
      {error && <div className="banner banner-error">{error}</div>}

      {/* Deliveries table */}
      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto', padding: '0 16px 32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <thead>
              <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                {['Point', 'Driver', 'Assigned', 'Delivered', 'Status', 'Time', 'Photo', 'Signature'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.delivery_id || i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{d.point_id}</td>
                  <td style={{ padding: '10px 12px' }}>{d.driver_id}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{d.assigned_boxes}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600,
                    color: parseInt(d.delivered_boxes) < parseInt(d.assigned_boxes) ? 'var(--error)' : 'var(--success)' }}>
                    {d.delivered_boxes}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge badge-${d.status === 'complete' ? 'success' : 'partial'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-sub)' }}>
                    {d.submitted_at ? new Date(d.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {d.photo_url
                      ? <a href={d.photo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a>
                      : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {d.signature_url
                      ? <a href={d.signature_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && deliveries && filtered.length === 0 && (
        <div className="banner banner-info">No deliveries found for this date / zone.</div>
      )}
    </div>
  );
}
