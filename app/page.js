'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import NavBar from './components/NavBar';

export default function HomePage() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [stationCount, setStationCount] = useState('--');
  const [chargedCount, setChargedCount] = useState('--');
  const [mySwaps, setMySwaps] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);
      setChecking(false);

      const { data: routes } = await supabase.from('routes').select('id');
      setStationCount(routes ? routes.length : 0);

      if (userData?.user) {
        const { count } = await supabase
          .from('routes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.user.id);
        setMySwaps(count || 0);
      }
    }
    load();
  }, []);

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

  if (!user) {
    return (
      <>
        <NavBar />
        <main>
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p className="eyebrow">welcome to coride</p>
            <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', margin: '18px 0 16px' }}>
              Same commute, <span style={{ color: 'var(--coral)' }}>every day</span>. Why ride alone?
            </h1>
            <p style={{ color: 'var(--dim)', maxWidth: 460, margin: '0 auto 32px' }}>
              Create a free profile or sign in to start matching with riders on your route.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/account" className="btn-primary">Create account</Link>
              <Link href="/account" className="btn-ghost">Sign in</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main>
        <div className="hero">
          <div>
            <p className="eyebrow">live routes near you</p>
            <h1>
              Same commute, <span>every day</span>. Why ride alone?
            </h1>
            <p className="lede">
              Match with people who take your exact route to work, college, or school — split
              the cost, cut the traffic, and actually enjoy the ride.
            </p>
            <div className="hero-ctas">
              <Link href="/post" className="btn-primary">
                Post your route
              </Link>
              <Link href="/matches" className="btn-ghost">
                Browse matches
              </Link>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <b>{stationCount}</b>
              <span>routes posted</span>
            </div>
            <div className="metric">
              <b>{mySwaps}</b>
              <span>your posted routes</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}