import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const MEAL_TABS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function FoodSearch() {
  const { fetchTodayLogs, user } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [meal, setMeal] = useState('Breakfast');
  const [servings, setServings] = useState(1);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '100g' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  async function searchFood(e, loadMore = false) {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    const currentPage = loadMore ? page + 1 : 1;
    if (!loadMore) { setResults([]); setPage(1); }
    setSearching(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${currentPage}&fields=id,product_name,brands,nutriments`);
      const data = await res.json();
      const filtered = (data.products || []).filter(p => p.product_name?.trim() && p.nutriments?.['energy-kcal_100g']);
      if (loadMore) { setResults(prev => [...prev, ...filtered]); setPage(currentPage); }
      else setResults(filtered);
      setHasMore(filtered.length === 20);
    } catch { showToast('Search failed. Try again.'); }
    setSearching(false);
  }

  function getCals(p) { return Math.round(p.nutriments?.['energy-kcal_100g'] || 0); }
  function getProtein(p) { return Math.round(p.nutriments?.['proteins_100g'] || 0); }
  function getCarbs(p) { return Math.round(p.nutriments?.['carbohydrates_100g'] || 0); }
  function getFat(p) { return Math.round(p.nutriments?.['fat_100g'] || 0); }

  async function logFood() {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('food_logs').insert({
      user_id: user.id,
      food_name: selected.product_name,
      brand: selected.brands || '',
      calories: Math.round(getCals(selected) * servings),
      protein: Math.round(getProtein(selected) * servings),
      carbs: Math.round(getCarbs(selected) * servings),
      fat: Math.round(getFat(selected) * servings),
      serving_size: `${Math.round(servings * 100)}g`,
      meal_type: meal,
      date: today,
    });
    fetchTodayLogs();
    setSelected(null); setServings(1);
    showToast(`Added to ${meal}!`);
    setSaving(false);
  }

  async function logManual() {
    if (!manual.name || !manual.calories) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('food_logs').insert({
      user_id: user.id,
      food_name: manual.name,
      calories: parseInt(manual.calories) || 0,
      protein: parseFloat(manual.protein) || 0,
      carbs: parseFloat(manual.carbs) || 0,
      fat: parseFloat(manual.fat) || 0,
      serving_size: manual.serving || '1 serving',
      meal_type: meal,
      date: today,
    });
    fetchTodayLogs();
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '100g' });
    showToast(`Added to ${meal}!`);
    setSaving(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Add Food</div>
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={() => { setManualMode(!manualMode); setResults([]); }}>
          {manualMode ? '🔍 Search' : '✏️ Manual'}
        </button>
      </div>

      <div className="chip-tabs">
        {MEAL_TABS.map(m => (
          <button key={m} className={`chip-tab ${meal === m ? 'active' : ''}`} onClick={() => setMeal(m)}>{m}</button>
        ))}
      </div>

      {manualMode ? (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Manual Entry</div>
          <div className="input-group">
            <label className="input-label">Food Name *</label>
            <input className="input" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Nasi Lemak" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="input-group">
              <label className="input-label">Calories *</label>
              <input className="input" type="number" value={manual.calories} onChange={e => setManual(p => ({ ...p, calories: e.target.value }))} placeholder="kcal" />
            </div>
            <div className="input-group">
              <label className="input-label">Serving Size</label>
              <input className="input" value={manual.serving} onChange={e => setManual(p => ({ ...p, serving: e.target.value }))} placeholder="e.g. 1 plate" />
            </div>
            <div className="input-group">
              <label className="input-label">Protein (g)</label>
              <input className="input" type="number" value={manual.protein} onChange={e => setManual(p => ({ ...p, protein: e.target.value }))} placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label">Carbs (g)</label>
              <input className="input" type="number" value={manual.carbs} onChange={e => setManual(p => ({ ...p, carbs: e.target.value }))} placeholder="0" />
            </div>
            <div className="input-group" style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Fat (g)</label>
              <input className="input" type="number" value={manual.fat} onChange={e => setManual(p => ({ ...p, fat: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={logManual} disabled={saving || !manual.name || !manual.calories}>
            {saving ? 'Adding...' : `Add to ${meal}`}
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={searchFood} style={{ padding: '0 16px 12px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
              <input className="search-bar" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search food..." />
            </div>
          </form>

          {searching && results.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-title">Searching...</div></div>
          )}

          {results.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px 8px', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{results.length} results · tap to add</div>
              <div className="scroll-list">
                {results.map((p, i) => (
                  <div key={`${p.id}-${i}`} className="search-result" onClick={() => { setSelected(p); setServings(1); }}>
                    <div className="search-result-icon">🥘</div>
                    <div className="search-result-info">
                      <div className="search-result-name">{p.product_name}</div>
                      {p.brands && <div className="search-result-brand">{p.brands}</div>}
                    </div>
                    <div className="search-result-cal">{getCals(p)} kcal</div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div style={{ padding: '12px 18px' }}>
                  <button className="btn btn-secondary" onClick={() => searchFood(null, true)} disabled={searching}>
                    {searching ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}

          {!searching && results.length === 0 && query && (
            <div className="empty-state"><div className="empty-state-icon">😕</div><div className="empty-state-title">No results for "{query}"</div><div className="empty-state-sub">Try simpler words or Manual entry</div></div>
          )}
          {!query && (
            <div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-title">Search for a food</div><div className="empty-state-sub">Try "banana", "rice", "chicken"</div></div>
          )}
        </>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{selected.product_name}</div>
            {selected.brands && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{selected.brands}</div>}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Calories', value: Math.round(getCals(selected) * servings), color: '#4CAF82' },
                { label: 'Protein',  value: `${Math.round(getProtein(selected) * servings)}g`, color: '#EF5B5B' },
                { label: 'Carbs',    value: `${Math.round(getCarbs(selected) * servings)}g`, color: '#4CAF82' },
                { label: 'Fat',      value: `${Math.round(getFat(selected) * servings)}g`, color: '#F5A623' },
              ].map(n => (
                <div key={n.label} style={{ flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: n.color }}>{n.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{n.label}</div>
                </div>
              ))}
            </div>
            <div className="input-group">
              <label className="input-label">Servings (×100g)</label>
              <input className="input" type="number" min="0.1" step="0.1" value={servings} onChange={e => setServings(parseFloat(e.target.value) || 1)} />
            </div>
            <button className="btn btn-primary" onClick={logFood} disabled={saving}>
              {saving ? 'Adding...' : `Add to ${meal}`}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
