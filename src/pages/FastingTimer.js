import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const PROTOCOLS = [
  { label: '16:8', fast: 16, eat: 8,  desc: 'Most popular · 16h fast, 8h eating' },
  { label: '18:6', fast: 18, eat: 6,  desc: 'Moderate · 18h fast, 6h eating' },
  { label: '20:4', fast: 20, eat: 4,  desc: 'Advanced · 20h fast, 4h eating' },
  { label: '23:1', fast: 23, eat: 1,  desc: 'OMAD · One meal a day' },
];

function fmt(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function FastingTimer() {
  const { fastingSession, setFastingSession, fetchFastingSession } = useApp();
  const [now, setNow] = useState(Date.now());
  const [protocol, setProtocol] = useState(PROTOCOLS[0]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchFastingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHistory() {
    const { data } = await supabase.from('fasting_sessions').select('*').eq('active', false).order('created_at', { ascending: false }).limit(5);
    if (data) setHistory(data);
  }

  async function startFast() {
    setLoading(true);
    await supabase.from('fasting_sessions').update({ active: false, end_time: new Date().toISOString() }).eq('active', true);
    const { data, error } = await supabase.from('fasting_sessions').insert({
      protocol: protocol.label, fast_hours: protocol.fast,
      start_time: new Date().toISOString(), active: true, completed: false,
    }).select().single();
    if (error) { console.error(error); setLoading(false); return; }
    if (data) setFastingSession(data);
    setLoading(false);
  }

  async function stopFast() {
    setLoading(true);
    const durationHours = (Date.now() - new Date(fastingSession.start_time).getTime()) / 3600000;
    await supabase.from('fasting_sessions').update({
      active: false, end_time: new Date().toISOString(),
      completed: durationHours >= fastingSession.fast_hours,
    }).eq('id', fastingSession.id);
    setFastingSession(null);
    fetchHistory();
    setLoading(false);
  }

  let elapsed = 0, target = 0, pct = 0, isEating = false, remaining = 0;
  if (fastingSession) {
    elapsed = now - new Date(fastingSession.start_time).getTime();
    target = fastingSession.fast_hours * 3600000;
    pct = Math.min(elapsed / target, 1);
    isEating = elapsed >= target;
    remaining = target - elapsed;
  }

  const r = 100;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-subtitle">Track Your Fast</div>
          <div className="page-title">Fasting</div>
        </div>
      </div>

      {!fastingSession ? (
        <>
          {/* Protocol picker */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>CHOOSE PROTOCOL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROTOCOLS.map(p => (
                <div
                  key={p.label}
                  className={`protocol-card ${protocol.label === p.label ? 'active' : ''}`}
                  onClick={() => setProtocol(p)}
                >
                  <div className={`protocol-badge ${protocol.label === p.label ? 'active' : ''}`}>{p.label}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{p.desc}</div>
                  </div>
                  {protocol.label === p.label && <div style={{ color: 'var(--accent)', fontSize: 16 }}>✓</div>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '0 16px' }}>
            <button className="btn btn-primary" onClick={startFast} disabled={loading}>
              {loading ? 'Starting...' : `Start ${protocol.label} Fast`}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Fasting ring */}
          <div className="fasting-ring-wrap">
            <div className="fasting-circle">
              <svg width="230" height="230" viewBox="0 0 230 230">
                <circle cx="115" cy="115" r={r} fill="none" stroke="var(--bg3)" strokeWidth="14" />
                <circle
                  cx="115" cy="115" r={r}
                  fill="none"
                  stroke={isEating ? '#4CAF82' : '#5B8DEF'}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.9s linear', transformOrigin: '115px 115px', transform: 'rotate(-90deg)' }}
                />
              </svg>
              <div className="fasting-circle-text">
                <div className="fasting-time">{isEating ? fmt(elapsed - target) : fmt(remaining)}</div>
                <div className="fasting-sublabel">{isEating ? 'in eating window' : 'remaining'}</div>
                <div className="fasting-protocol">{fastingSession.protocol}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#5B8DEF' }}>{Math.floor(elapsed / 3600000)}h {Math.floor((elapsed % 3600000) / 60000)}m</div>
              <div className="stat-label">Elapsed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(pct * 100)}%</div>
              <div className="stat-label">Complete</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#4CAF82' }}>{fastingSession.fast_hours}h</div>
              <div className="stat-label">Goal</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>Started</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {new Date(fastingSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {new Date(fastingSession.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              {!isEating && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>Eating window opens</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#4CAF82' }}>
                    {new Date(new Date(fastingSession.start_time).getTime() + target).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </div>
            {isEating && (
              <div style={{ marginTop: 12, background: 'var(--accent-light)', borderRadius: 10, padding: '10px 14px', color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
                🎉 You've completed your fast! Enjoy your meal.
              </div>
            )}
          </div>

          <div style={{ padding: '0 16px 24px' }}>
            <button className="btn btn-danger" onClick={stopFast} disabled={loading}>
              {loading ? 'Ending...' : 'End Fast'}
            </button>
          </div>
        </>
      )}

      {history.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>RECENT FASTS</div>
          {history.map(h => {
            const dur = h.end_time ? ((new Date(h.end_time) - new Date(h.start_time)) / 3600000).toFixed(1) : '-';
            return (
              <div key={h.id} className="log-item">
                <div style={{ flex: 1 }}>
                  <div className="log-name">{h.protocol} · {dur}h fasted</div>
                  <div className="log-meta">{new Date(h.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                </div>
                <div style={{ fontSize: 20 }}>{h.completed ? '✅' : '⚡'}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
