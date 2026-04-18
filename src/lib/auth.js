import { useState, useEffect } from 'react';
import { supabaseClient } from './supabase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'PASSWORD_RECOVERY') setAuthEvent('PASSWORD_RECOVERY');
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) => supabaseClient.auth.signInWithPassword({ email, password });
  const signUp = (email, password) => supabaseClient.auth.signUp({ email, password });
  const signOut = () => supabaseClient.auth.signOut();
  const resetPassword = (email) => supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  const updatePassword = (newPassword) => supabaseClient.auth.updateUser({ password: newPassword });

  return { user, authLoading, signIn, signUp, signOut, resetPassword, updatePassword, authEvent, setAuthEvent };
}
