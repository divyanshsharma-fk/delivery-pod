import { useState, useEffect } from 'react';
import { getAssignments, todayDate } from '../api';

const ZONE_LABELS = {
  MB: 'Mira-Bhayandar', CH: 'Chembur', PW: 'Powai',
  AN: 'Andheri', ML: 'Malad', VD: 'Vandre', BV: 'Borivali',
};

export default function Dashboard({ driver, onSelectPoint, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = todayDate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAssignments(driver.driver_id, today);
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load assignments');
      }
    } catch {
      setError('Network error. Pull down to refresh.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isSubmitted = (point_id) =>
    data?.submitted_points?.includes(point_id);

  const getAssignment = (point_id) =>
    data?.assignments?.find(a => a.point_id === point_id);

  const formatDate = (d) => {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day} ${months[parseInt(m)-1]} ${y}`;
  };

  const submittedCount = data?.submitted_points?.length || 0;
  const totalAssigned = data?.assignments?.length || 0;

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>📦 {driver.name}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {ZONE_LABELS[driver.zone_id] || driver.zone_id} Zone
          </div>
        </div>
        <button onClick={onLogout}>Logout</button>
      </div>

      {/* Date + summary bar */}
      <div style={{
        background: '#fff',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>Today</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(today)}</div>
        </div>
        {data && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>Submitted</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: submittedCount === totalAssigned && totalAssigned > 0 ? 'var(--success)' : 'var(--orange)' }}>
              {submittedCount} / {totalAssigned}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && <div className="spinner" />}

      {error && (
        <div className="banner banner-error">
          {error}
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Assigned delivery points */}
          {data.assignments?.length > 0 ? (
            <>
              <div className="section-label">Your Deliveries Today</div>
              {data.points
                .filter(p => getAssignment(p.point_id))
                .map(point => {
                  const assignment = getAssignment(point.point_id);
                  const submitted = isSubmitted(point.point_id);
                  return (
                    <div
                      key={point.point_id}
                      className={`point-item ${submitted ? 'submitted' : 'pending'}`}
                      onClick={() => !submitted && onSelectPoint(point, assignment)}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="point-name">{point.point_name}</div>
                        <div className="point-meta">
                          {assignment.assigned_boxes} boxes assigned
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: 12 }}>
                        {submitted ? (
                          <span className="badge badge-success">✓ Done</span>
                        ) : (
                          <span className="badge badge-pending">Pending →</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </>
          ) : (
            <div className="banner banner-info" style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No assignments today</div>
              <div style={{ fontSize: 13 }}>
                Your admin hasn't set up today's deliveries yet. Check back later.
              </div>
            </div>
          )}

          {/* Unassigned zone points */}
          {data.points.filter(p => !getAssignment(p.point_id)).length > 0 && (
            <>
              <div className="section-label" style={{ marginTop: 8 }}>
                Other Points in Your Zone (Not Assigned Today)
              </div>
              {data.points
                .filter(p => !getAssignment(p.point_id))
                .map(point => (
                  <div key={point.point_id} className="point-item no-assignment">
                    <div style={{ flex: 1 }}>
                      <div className="point-name">{point.point_name}</div>
                      <div className="point-meta">No assignment today</div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </>
      )}

      {/* Refresh button */}
      {!loading && (
        <div style={{ padding: '16px 16px 32px', textAlign: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      )}
    </div>
  );
}
