import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const PRESETS = [
  { type: 'Running',         icon: '🏃', cpm: 10 },
  { type: 'Cycling',         icon: '🚴', cpm: 8  },
  { type: 'Swimming',        icon: '🏊', cpm: 9  },
  { type: 'Weight Training', icon: '🏋️', cpm: 6  },
  { type: 'HIIT',            icon: '🔥', cpm: 12 },
  { type: 'Walking',         icon: '🚶', cpm: 5  },
  { type: 'Yoga',            icon: '🧘', cpm: 3  },
  { type: 'Basketball',      icon: '🏀', cpm: 8  },
  { type: 'Football',        icon: '⚽', cpm: 9  },
  { type: 'Jump Rope',       icon: '⚡', cpm: 13 },
];

export default function WorkoutLog() {
  const { todayWorkouts, fetchTodayWorkouts, user } = useApp();
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState(30);
  const [customCals, setCustomCals] = useState('');
  const [customType, setCustomType] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const estCals = selected ? Math.round(selected.cpm * duration) : 0;
  const totalBurned = todayWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);

  async function logWorkout() {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const type = customMode ? customType : selected?.type;
    const cals = customMode ? (parseInt(customCals) || 0) : estCals;
    if (!type || !cals) { setSaving(false); return; }
    await supabase.from('workout_logs').insert({
      user_id: user.id,
      workout_type: type,
      duration_minutes: parseInt(duration),
      calories_burned: cals,
      date: today,
    });
    fetchTodayWorkouts();
    setSelected(null); setCustomType(''); setCustomCals(''); setDuration(30); setCustomMode(false);
    showToast('Workout logged! 💪');
    setSaving(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-subtitle">Log Activity</div><div className="page-title">Workout</div></div>
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={() => { setCustomMode(!customMode); setSelected(null); }}>
          {customMode ? '← Presets' : '✏️ Custom'}
        </button>
      </div>

      {totalBurned > 0 && (
        <div className="card" style={{ background: 'rgba(91,141,239,0.1)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 32 }}>🔥</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#5B8DEF' }}>{totalBurned} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>kcal burned today</span></div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{todayWorkouts.length} workout{todayWorkouts.length > 1 ? 's' : ''} logged</div>
            </div>
          </div>
        </div>
      )}

      {!customMode ? (
        <>
          <div style={{ padding: '0 16px 8px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>SELECT WORKOUT</div>
          <div className="workout-grid">
            {PRESETS.map(w => (
              <div key={w.type} className={`workout-tile ${selected?.type === w.type ? 'selected' : ''}`} onClick={() => setSelected(selected?.type === w.type ? null : w)}>
                <div className="workout-tile-icon">{w.icon}</div>
                <div className="workout-tile-name">{w.type}</div>
                <div className="workout-tile-rate">~{w.cpm} kcal/min</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Custom Workout</div>
          <div className="input-group">
            <label className="input-label">Workout Name</label>
            <input className="input" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g. Muay Thai" />
          </div>
          <div className="input-group">
            <label className="input-label">Calories Burned</label>
            <input className="input" type="number" value={customCals} onChange={e => setCustomCals(e.target.value)} placeholder="kcal" />
          </div>
        </div>
      )}

      {(selected || customMode) && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="input-group">
            <label className="input-label">Duration (minutes)</label>
            <input className="input" type="number" min="1" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)} />
          </div>
          {!customMode && selected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(91,141,239,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{duration} min × {selected.cpm} kcal/min</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#5B8DEF' }}>{estCals} kcal</span>
            </div>
          )}
          <button className="btn btn-primary" onClick={logWorkout} disabled={saving || (!selected && !customType)}>
            {saving ? 'Logging...' : 'Log Workout'}
          </button>
        </div>
      )}

      {todayWorkouts.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>TODAY'S ACTIVITY</div>
          {todayWorkouts.map(w => (
            <div key={w.id} className="log-item">
              <div style={{ flex: 1 }}>
                <div className="log-name">{w.workout_type}</div>
                <div className="log-meta">{w.duration_minutes} min</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#5B8DEF' }}>-{w.calories_burned} kcal</div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
