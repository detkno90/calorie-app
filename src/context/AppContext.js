import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [fastingSession, setFastingSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle();
    if (data) setProfile(data);
    if (error) console.error('fetchProfile error:', error);
  }, []);

  const fetchTodayLogs = useCallback(async () => {
    const { data, error } = await supabase.from('food_logs').select('*').eq('date', today).order('created_at', { ascending: false });
    if (data) setTodayLogs(data);
    if (error) console.error('fetchTodayLogs error:', error);
  }, [today]);

  const fetchTodayWorkouts = useCallback(async () => {
    const { data, error } = await supabase.from('workout_logs').select('*').eq('date', today).order('created_at', { ascending: false });
    if (data) setTodayWorkouts(data);
    if (error) console.error('fetchTodayWorkouts error:', error);
  }, [today]);

  const fetchFastingSession = useCallback(async () => {
    const { data, error } = await supabase.from('fasting_sessions').select('*').eq('active', true).maybeSingle();
    if (data) setFastingSession(data);
    else setFastingSession(null);
    if (error) console.error('fetchFastingSession error:', error);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchTodayLogs(), fetchTodayWorkouts(), fetchFastingSession()]);
      setLoading(false);
    }
    init();
  }, [fetchProfile, fetchTodayLogs, fetchTodayWorkouts, fetchFastingSession]);

  const todayCaloriesIn = todayLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const todayCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const netCalories = todayCaloriesIn - todayCaloriesBurned;

  return (
    <AppContext.Provider value={{
      profile, setProfile, fetchProfile,
      todayLogs, fetchTodayLogs,
      todayWorkouts, fetchTodayWorkouts,
      fastingSession, setFastingSession, fetchFastingSession,
      todayCaloriesIn, todayCaloriesBurned, netCalories,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
