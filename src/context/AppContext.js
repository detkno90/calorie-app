import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [fastingSession, setFastingSession] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setTodayLogs([]);
        setTodayWorkouts([]);
        setFastingSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodayLogs();
      fetchTodayWorkouts();
      fetchFastingSession();
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profile').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
  }, [user]);

  const fetchTodayLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('food_logs').select('*')
      .eq('date', today).eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTodayLogs(data);
  }, [user, today]);

  const fetchTodayWorkouts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('workout_logs').select('*')
      .eq('date', today).eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTodayWorkouts(data);
  }, [user, today]);

  const fetchFastingSession = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('fasting_sessions').select('*')
      .eq('active', true).eq('user_id', user.id).maybeSingle();
    setFastingSession(data || null);
  }, [user]);

  const todayCaloriesIn = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const todayCaloriesBurned = todayWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const netCalories = todayCaloriesIn - todayCaloriesBurned;

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AppContext.Provider value={{
      user, authLoading, signOut,
      profile, setProfile, fetchProfile,
      todayLogs, fetchTodayLogs,
      todayWorkouts, fetchTodayWorkouts,
      fastingSession, setFastingSession, fetchFastingSession,
      todayCaloriesIn, todayCaloriesBurned, netCalories,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
