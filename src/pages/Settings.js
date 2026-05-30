import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { profile, fetchProfile, user, signOut } = useApp();
  const [form, setForm] = useState({
    name: '', age: '', weight_kg: '', height_cm: '',
    goal_type: 'lose', activity_level: 'moderate', daily_calorie_goal: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [tdee, setTdee] = useState(null);

  useEffect(() => {
    if (profile) setForm(prev => ({ ...prev, ...profile }));
  }, [profile]);

  const calculateTDEE = useCallback(() => {
    const w = parseFloat(form.weight_kg);
    const h = parseFloat(form.height_cm);
    const a = parseInt(form.age);
    if (!w || !h || !a) { setTdee(null); return; }
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    setTdee(Math.round(bmr * (mult[form.activity_level] || 1.55)));
  }, [form.weight_kg, form.height_cm, form.age, form.activity_level]);

  useEffect(() => { calculateTDEE(); }, [calculateTDEE]);

  function suggestCalories() {
    if (!tdee) return;
    const map = { lose: tdee - 500, maintain: tdee, gain: tdee + 300 };
    setForm(p => ({ ...p, daily_calorie_goal: String(map[p.goal_type] || tdee) }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        id: user.id,
        name: form.name || '',
        age: parseInt(form.age) || null,
        weight_kg: parseFloat(form.weight_kg) || null,
        height_cm: parseFloat(form.height_cm) || null,
        goal_type: form.goal_type || 'lose',
        activity_level: form.activity_level || 'moderate',
        daily_calorie_goal: parseInt(form.daily_calorie_goal) || 2000,
      };
      const { error } = await supabase.from('profile').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      await fetchProfile();
      showToast('Saved! ✅');
    } catch (err) {
      console.error(err);
      showToast('Save failed ❌');
    }
    setSaving(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  const GOALS = [
    { v: 'lose',     icon: '🎯', label: 'Lose Weight',  sub: '−500 kcal' },
    { v: 'maintain', icon: '⚖️', label: 'Maintain',     sub: 'TDEE' },
    { v: 'gain',     icon: '📈', label: 'Gain Weight',  sub: '+300 kcal' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-subtitle">Personalize</div>
          <div className="page-title">Goals</div>
        </div>
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={signOut}>
          Sign Out
        </button>
      </div>

      {/* Account info */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          👤
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{profile?.name || 'Your Account'}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>YOUR INFO</div>
        <div className="input-group">
          <label className="input-label">Name</label>
          <input className="input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="input-group">
            <label className="input-label">Age</label>
            <input className="input" type="number" value={form.age || ''} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="years" />
          </div>
          <div className="input-group">
            <label className="input-label">Weight (kg)</label>
            <input className="input" type="number" step="0.1" value={form.weight_kg || ''} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} placeholder="kg" />
          </div>
          <div className="input-group" style={{ gridColumn: '1/-1' }}>
            <label className="input-label">Height (cm)</label>
            <input className="input" type="number" value={form.height_cm || ''} onChange={e => setForm(p => ({ ...p, height_cm: e.target.value }))} placeholder="cm" />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>YOUR GOAL</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {GOALS.map(g => (
            <div key={g.v} className={`goal-pill ${form.goal_type === g.v ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, goal_type: g.v }))}>
              <div className="goal-pill-icon">{g.icon}</div>
              <div className="goal-pill-label">{g.label}</div>
              <div className="goal-pill-sub">{g.sub}</div>
            </div>
          ))}
        </div>
        <div className="input-group">
          <label className="input-label">Activity Level</label>
          <select className="input" value={form.activity_level || 'moderate'} onChange={e => setForm(p => ({ ...p, activity_level: e.target.value }))}>
            <option value="sedentary">Sedentary (desk job)</option>
            <option value="light">Light (1-3x/week)</option>
            <option value="moderate">Moderate (3-5x/week)</option>
            <option value="active">Active (6-7x/week)</option>
            <option value="very_active">Very Active (2x/day)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>DAILY CALORIE GOAL</div>
        {tdee && (
          <div style={{ background: 'var(--accent-light)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Your estimated TDEE</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                  {tdee} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>kcal/day</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                  {form.goal_type === 'lose' ? `Suggested: ${tdee - 500} kcal` :
                   form.goal_type === 'gain' ? `Suggested: ${tdee + 300} kcal` :
                   `Suggested: ${tdee} kcal`}
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }} onClick={suggestCalories}>
                Auto-fill
              </button>
            </div>
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Daily Target (kcal)</label>
          <input className="input" type="number" value={form.daily_calorie_goal || ''} onChange={e => setForm(p => ({ ...p, daily_calorie_goal: e.target.value }))} placeholder="e.g. 1800" />
        </div>
      </div>

      <div style={{ padding: '4px 16px 32px' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
