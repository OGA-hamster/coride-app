'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import NavBar from '../components/NavBar';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [womenOnly, setWomenOnly] = useState(false);
  const [error, setError] = useState('');
  const [ratingInfo, setRatingInfo] = useState({ avg: '—', count: 0 });

  async function refresh() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
    if (data?.user) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setProfile(p);
      const { data: myRatings } = await supabase.from('ratings').select('stars').eq('ratee_id', data.user.id);
      if (myRatings && myRatings.length > 0) {
        const avg = myRatings.reduce((s, r) => s + r.stars, 0) / myRatings.length;
        setRatingInfo({ avg: avg.toFixed(1), count: myRatings.length });
      } else {
        setRatingInfo({ avg: '—', count: 0 });
      }
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Enter an email and password to continue.');
      return;
    }
    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: name || 'Rider',
          women_only_filter: womenOnly
        });
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
    }
    await refresh();
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <>
      <NavBar />
      <main>
        <div className="section-head">
          <p className="eyebrow">Your account</p>
          <h2>{user ? 'Your profile' : mode === 'login' ? 'Sign in' : 'Create a profile'}</h2>
        </div>

        {user ? (
          <div className="profile-card">
            <div className="profile-row">
              <span>Name</span>
              <span>{profile?.full_name || 'Rider'}</span>
            </div>
            <div className="profile-row">
              <span>Email</span>
              <span>{user.email}</span>
            </div>
            <div className="profile-row">
              <span>Rating</span>
              <span>{ratingInfo.avg} ({ratingInfo.count} rides)</span>
            </div>
            <div className="profile-row">
              <span>Women-only match filter</span>
              <span>{profile?.women_only_filter ? 'On' : 'Off'}</span>
            </div>
            <button className="logout-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : (
          <form className="form-box" onSubmit={submit}>
            {mode === 'signup' && (
              <>
                <label>Name</label>
                <input type="text" placeholder="Aditi Rao" value={name} onChange={e => setName(e.target.value)} />
              </>
            )}
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <label>Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {mode === 'signup' && (
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="womenOnly"
                  checked={womenOnly}
                  onChange={e => setWomenOnly(e.target.checked)}
                />
                <label htmlFor="womenOnly">Only show me women-only matches</label>
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 20 }}>
              {mode === 'login' ? 'Sign in' : 'Create profile'}
            </button>
            {error && <div className="error-msg">{error}</div>}
            <div className="auth-switch">
              {mode === 'login' ? 'New here?' : 'Already have a profile?'}
              <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? 'Create a profile' : 'Sign in'}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
