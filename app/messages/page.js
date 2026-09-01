'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import NavBar from '../components/NavBar';

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [namesById, setNamesById] = useState({});
  const [myRatingGiven, setMyRatingGiven] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadThreads(currentUser) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: true });

    const threadMap = {};
    (msgs || []).forEach(m => {
      const otherId = m.sender_id === currentUser.id ? m.recipient_id : m.sender_id;
      const key = `${m.route_id}:${otherId}`;
      if (!threadMap[key]) threadMap[key] = { routeId: m.route_id, otherId, messages: [] };
      threadMap[key].messages.push(m);
    });
    const threadList = Object.values(threadMap);
    setThreads(threadList);

    const otherIds = [...new Set(threadList.map(t => t.otherId))];
    if (otherIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', otherIds);
      const map = {};
      (profs || []).forEach(p => (map[p.id] = p.full_name));
      setNamesById(map);
    }
    setLoading(false);
    return threadList;
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push('/account');
        return;
      }
      setUser(userData.user);
      await loadThreads(userData.user);
    }
    init();
  }, [router]);

  function openThread(thread) {
    setActiveThread(thread);
    setMessages(thread.messages);
    setMyRatingGiven(0);
  }

  async function sendMessage() {
    if (!draft.trim() || !activeThread || !user) return;
    const { error } = await supabase.from('messages').insert({
      route_id: activeThread.routeId,
      sender_id: user.id,
      recipient_id: activeThread.otherId,
      content: draft.trim()
    });
    if (!error) {
      setDraft('');
      const updated = await loadThreads(user);
      const refreshed = updated.find(t => t.routeId === activeThread.routeId && t.otherId === activeThread.otherId);
      if (refreshed) {
        setActiveThread(refreshed);
        setMessages(refreshed.messages);
      }
    }
  }

  async function submitRating(stars) {
    if (!activeThread || !user) return;
    setMyRatingGiven(stars);
    await supabase.from('ratings').insert({
      route_id: activeThread.routeId,
      rater_id: user.id,
      ratee_id: activeThread.otherId,
      stars
    });
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
          <p className="eyebrow">Your conversations</p>
          <h2>Messages.</h2>
        </div>

        {threads.length === 0 ? (
          <p className="empty-state">No conversations yet — message someone from the matches page to start one.</p>
        ) : !activeThread ? (
          <div className="thread-list">
            {threads.map((t, i) => (
              <div className="thread-card" key={i} onClick={() => openThread(t)}>
                <b>{namesById[t.otherId] || 'Rider'}</b>
                <span>{t.messages[t.messages.length - 1]?.content}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-box">
            <button className="btn-ghost" style={{ marginBottom: 16, padding: '8px 16px', fontSize: 13 }} onClick={() => setActiveThread(null)}>
              ← Back to conversations
            </button>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div className={'chat-bubble ' + (m.sender_id === user.id ? 'mine' : 'theirs')} key={i}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input
                type="text"
                placeholder="Type a message…"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button className="btn-primary" onClick={sendMessage}>
                Send
              </button>
            </div>
            <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--dim)' }}>Rate this rider after your trip:</span>
              <div className="rating-row">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={'star-btn' + (n <= myRatingGiven ? ' filled' : '')}
                    onClick={() => submitRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}