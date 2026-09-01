'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase';
import NavBar from '../components/NavBar';
import Toast from '../components/Toast';

const RouteMap = dynamic(() => import('../components/RouteMap'), { ssr: false });

export default function MatchesPage() {
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [view, setView] = useState('list');
  const router = useRouter();

  function showToast(message) {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2400);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push('/account');
        return;
      }
      setUser(userData.user);

      const { data: routeData } = await supabase
        .from('routes')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      const otherRoutes = (routeData || []).filter(r => r.user_id !== userData.user.id);
      setRoutes(otherRoutes);

      const userIds = [...new Set(otherRoutes.map(r => r.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase.from('profiles').select('*').in('id', userIds);
        const map = {};
        (profileData || []).forEach(p => (map[p.id] = p));
        setProfilesById(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function startChat(route) {
    const { error } = await supabase.from('messages').insert({
      route_id: route.id,
      sender_id: user.id,
      recipient_id: route.user_id,
      content: `Hi! I saw your route from ${route.start_point} to ${route.end_point} around ${route.pickup_time} — want to carpool?`
    });
    if (error) {
      showToast('Could not start the chat. Try again.');
      return;
    }
    showToast('Message sent — check your messages tab.');
    setTimeout(() => router.push('/messages'), 900);
  }

  if (loading) {
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
          <p className="eyebrow">Live routes near you</p>
          <h2>Find your commute match.</h2>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            className={view === 'list' ? 'btn-primary' : 'btn-ghost'}
            style={{ width: 'auto', padding: '9px 18px', fontSize: 13 }}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            className={view === 'map' ? 'btn-primary' : 'btn-ghost'}
            style={{ width: 'auto', padding: '9px 18px', fontSize: 13 }}
            onClick={() => setView('map')}
          >
            Map
          </button>
        </div>

        {routes.length === 0 ? (
          <p className="empty-state">No routes posted yet — be the first, or check back soon.</p>
        ) : view === 'map' ? (
          <RouteMap routes={routes} profilesById={profilesById} onConnect={startChat} />
        ) : (
          <div className="route-grid">
            {routes.map(r => {
              const p = profilesById[r.user_id];
              return (
                <div className="route-card" key={r.id}>
                  <div className="route-top">
                    <b>{p?.full_name || 'Rider'}</b>
                    <span style={{ fontSize: 12.5, color: 'var(--dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {r.recurring ? 'repeats weekdays' : ''}
                    </span>
                  </div>
                  <div className="route-line-wrap">
                    <div className="route-track"></div>
                    <div className="route-point">
                      <div className="route-dot start"></div>
                      <div>
                        <b>{r.start_point}</b>
                        <span>Pickup · {r.pickup_time}</span>
                      </div>
                    </div>
                    <div className="route-point">
                      <div className="route-dot end"></div>
                      <div>
                        <b>{r.end_point}</b>
                        <span>Drop-off</span>
                      </div>
                    </div>
                  </div>
                  <button className="msg-btn" onClick={() => startChat(r)}>
                    Message to connect
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}