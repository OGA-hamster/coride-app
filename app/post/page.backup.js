'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import NavBar from '../components/NavBar';

export default function PostRoutePage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [time, setTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push('/account');
        return;
      }
      setUser(data.user);
      setChecking(false);
    });
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!start || !end || !time) {
      setError('Fill in your pickup point, drop point, and time.');
      return;
    }
    const { error: insertError } = await supabase.from('routes').insert({
      user_id: user.id,
      start_point: start,
      end_point: end,
      pickup_time: time,
      recurring: recurring
    });
    if (insertError) {
      setError('Could not post your route. Try again.');
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/matches'), 1200);
  }

  if (checking) {
    return (
      <>
        <NavBar />
        <main>
          <p className="empty-state">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main>
        <div className="section-head">
          <p className="eyebrow">Takes under a minute</p>
          <h2>Post your daily route.</h2>
        </div>
        <form className="form-box" onSubmit={submit}>
          <label>Pickup point</label>
          <input type="text" placeholder="Sunrise Apartments" value={start} onChange={e => setStart(e.target.value)} />
          <label>Drop point</label>
          <input type="text" placeholder="Kingsway Tech Park" value={end} onChange={e => setEnd(e.target.value)} />
          <label>Usual pickup time</label>
          <input type="text" placeholder="8:45 AM" value={time} onChange={e => setTime(e.target.value)} />
          <div className="checkbox-row">
            <input type="checkbox" id="recurring" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
            <label htmlFor="recurring">This repeats every weekday</label>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 20 }}>
            Post route
          </button>
          {error && <div className="error-msg">{error}</div>}
          {success && <div style={{ color: 'var(--mint)', fontSize: 13, marginTop: 12 }}>Route posted. Taking you to matches…</div>}
        </form>
      </main>
    </>
  );
}