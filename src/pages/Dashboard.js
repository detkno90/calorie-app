import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const MEALS = [
  { name: 'Breakfast', icon: '☀️', color: '#F5A623', bg: 'rgba(245,166,35,0.12)' },
  { name: 'Lunch',     icon: '🌤',  color: '#4CAF82', bg: 'rgba(76,175,130,0.12)' },
  { name: 'Dinner',    icon: '🌙', color: '#5B8DEF', bg: 'rgba(91,141,239,0.12)' },
  { name: 'Snacks',    icon: '🍎', color: '#EF5B5B', bg: 'rgba(239,91,91,0.12)' },
];

function getDateStr(date) {
  return date.toISOString().split('T')[0];
}

function CalendarStreak({ logDates }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() { setViewMonth(new Date(year, month - 1, 1)); }
  function nextMonth() { setViewMonth(new Date(year, month + 1, 1)); }

  const todayStr = getDateStr(today);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: 'var(--bg3)', border: 'none', color: 'var(--text)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{monthName}</div>
        <button onClick={nextMonth} style={{ background: 'var(--bg3)', border: 'none', color: 'var(--text)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', paddingBottom: 6 }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 2px' }}>
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isLogged = logDates.has(dateStr);
          const isFuture = dateStr > todayStr;

          return (
            <div key={day} style={{ textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: isToday ? 700 : 500,
                background: isLogged ? 'var(--accent)' : isToday ? 'var(--bg3)' : 'transparent',
                color: isLogged ? '#fff' : isToday ? 'var(--accent)' : isFuture ? 'var(--text3)' : 'var(--text)',
                border: isToday && !isLogged ? '2px solid var(--accent)' : 'none',
              }}>
                {isLogged && !isToday ? '✓' : day}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>Logged</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--accent)' }} />
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>Today</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile, todayLogs, todayWorkouts, todayCaloriesIn, todayCaloriesBurned, netCalories, fetchTodayLogs } = useApp();
  const navigate = useNavigate();
  const [logDates, setLogDates] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const goal = profile?.daily_calorie_goal || 2000;
  const remaining = goal - netCalories;
  const progress = Math.min(netCalories / goal, 1);
  const isOver = netCalories > goal;

  const protein = Math.round(todayLogs.reduce((s, l) => s + (l.protein || 0), 0));
  const carbs   = Math.round(todayLogs.reduce((s, l) => s + (l.carbs || 0), 0));
  const fat     = Math.round(todayLogs.reduce((s, l) => s + (l.fat || 0), 0));
  const proteinGoal = Math.round((goal * 0.30) / 4);
  const carbsGoal   = Math.round((goal * 0.45) / 4);
  const fatGoal     = Math.round((goal * 0.25) / 9);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const circumference = 2 * Math.PI * 72;
  const strokeOffset = circumference * (1 - progress);

  useEffect(() => {
    fetchLogHistory();
  }, []);

  async function fetchLogHistory() {
    const { data } = await supabase
      .from('food_logs')
      .select('date')
      .order('date', { ascending: false });

    if (!data) return;

    const dates = new Set(data.map(d => d.date));
    setLogDates(dates);
    setStreak(calcStreak(dates));
  }

  function calcStreak(dates) {
    let streak = 0;
    const check = new Date();
    // If today not logged yet, start checking from yesterday
    const todayStr = getDateStr(check);
    if (!dates.has(todayStr)) {
      check.setDate(check.getDate() - 1);
    }
    while (true) {
      const str = getDateStr(check);
      if (dates.has(str)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return streak;
  }

  async function deleteLog(id) {
    await supabase.from('food_logs').delete().eq('id', id);
    fetchTodayLogs();
    fetchLogHistory();
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-subtitle">{today}</div>
          <div className="page-title">{profile?.name ? `Hi, ${profile.name} 👋` : 'Today'}</div>
        </div>
        {/* Streak badge */}
        <div
          onClick={() => setShowCalendar(!showCalendar)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: streak > 0 ? 'rgba(245,166,35,0.15)' : 'var(--card)',
            border: `1.5px solid ${streak > 0 ? '#F5A623' : 'var(--border)'}`,
            borderRadius: 100, padding: '6px 14px', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: streak > 0 ? '#F5A623' : 'var(--text2)' }}>{streak}</span>
          <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>day{streak !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Calendar (collapsible) */}
      {showCalendar && <CalendarStreak logDates={logDates} />}

      {/* Calorie Ring Card */}
      <div className="card" style={{ paddingBottom: 16 }}>
        <div className="ring-wrap">
          <div className="ring-container">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="72" fill="none" stroke="var(--bg3)" strokeWidth="12" />
              <circle
                cx="90" cy="90" r="72"
                fill="none"
                stroke={isOver ? '#EF5B5B' : '#4CAF82'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease', transformOrigin: '90px 90px' }}
              />
            </svg>
            <div className="ring-center">
              <div className="ring-calories" style={{ color: isOver ? '#EF5B5B' : '#fff' }}>
                {isOver ? `+${Math.abs(remaining)}` : remaining}
              </div>
              <div className="ring-label">{isOver ? 'over goal' : 'kcal left'}</div>
            </div>
          </div>
          <div className="ring-goal">Goal: {goal.toLocaleString()} kcal</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4CAF82' }}>{todayCaloriesIn}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginTop: 2 }}>🍽 Eaten</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#5B8DEF' }}>{todayCaloriesBurned}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginTop: 2 }}>🔥 Burned</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: isOver ? '#EF5B5B' : 'var(--text)' }}>{netCalories}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginTop: 2 }}>⚡ Net</div>
          </div>
        </div>
      </div>

      {/* Macro cards */}
      <div className="macro-row">
        {[
          { label: 'Protein', value: protein, goal: proteinGoal, color: '#EF5B5B' },
          { label: 'Carbs',   value: carbs,   goal: carbsGoal,   color: '#4CAF82' },
          { label: 'Fat',     value: fat,     goal: fatGoal,     color: '#F5A623' },
        ].map(m => (
          <div className="macro-card" key={m.label}>
            <div className="macro-card-label">{m.label}</div>
            <div className="macro-card-value" style={{ color: m.color }}>{m.value}<span className="macro-card-unit">g</span></div>
            <div className="macro-bar">
              <div className="macro-bar-fill" style={{ width: `${Math.min(m.value / m.goal, 1) * 100}%`, background: m.color }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontWeight: 500 }}>/ {m.goal}g</div>
          </div>
        ))}
      </div>

      {/* Meal sections */}
      {MEALS.map(meal => {
        const logs = todayLogs.filter(l => l.meal_type === meal.name);
        const mealCals = logs.reduce((s, l) => s + (l.calories || 0), 0);
        return (
          <div className="meal-card" key={meal.name}>
            <div className="meal-header">
              <div className="meal-header-left">
                <div className="meal-icon" style={{ background: meal.bg }}>{meal.icon}</div>
                <div>
                  <div className="meal-name">{meal.name}</div>
                  <div className="meal-cal">{mealCals > 0 ? `${mealCals} kcal` : 'No items yet'}</div>
                </div>
              </div>
              <button className="meal-add-btn" onClick={() => navigate('/food')}>+</button>
            </div>
            {logs.length > 0 && (
              <div className="meal-items">
                {logs.map(log => (
                  <div className="meal-item" key={log.id}>
                    <div className="meal-item-info">
                      <div className="meal-item-name">{log.food_name}</div>
                      <div className="meal-item-meta">{log.serving_size}
                        {log.protein > 0 && ` · P${Math.round(log.protein)}g`}
                        {log.carbs > 0 && ` C${Math.round(log.carbs)}g`}
                        {log.fat > 0 && ` F${Math.round(log.fat)}g`}
                      </div>
                    </div>
                    <div className="meal-item-cal">{log.calories} kcal</div>
                    <button className="delete-btn" onClick={() => deleteLog(log.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Workout summary */}
      {todayWorkouts.length > 0 && (
        <div className="meal-card">
          <div className="meal-header">
            <div className="meal-header-left">
              <div className="meal-icon" style={{ background: 'rgba(91,141,239,0.12)' }}>💪</div>
              <div>
                <div className="meal-name">Workouts</div>
                <div className="meal-cal">-{todayCaloriesBurned} kcal burned</div>
              </div>
            </div>
            <button className="meal-add-btn" style={{ background: 'rgba(91,141,239,0.12)', color: '#5B8DEF' }} onClick={() => navigate('/workout')}>+</button>
          </div>
          <div className="meal-items">
            {todayWorkouts.map(w => (
              <div className="meal-item" key={w.id}>
                <div className="meal-item-info">
                  <div className="meal-item-name">{w.workout_type}</div>
                  <div className="meal-item-meta">{w.duration_minutes} min</div>
                </div>
                <div className="meal-item-cal" style={{ color: '#5B8DEF' }}>-{w.calories_burned} kcal</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}
