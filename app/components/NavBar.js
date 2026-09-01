'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const loggedOutTabs = [
  { href: '/', label: 'home', icon: '🏠' },
  { href: '/account', label: 'sign in', icon: '👤' }
];

const loggedInTabs = [
  { href: '/', label: 'home', icon: '🏠' },
  { href: '/post', label: 'post', icon: '➕' },
  { href: '/matches', label: 'matches', icon: '🔍' },
  { href: '/messages', label: 'chats', icon: '💬' },
  { href: '/account', label: 'account', icon: '👤' }
];

export default function NavBar() {
  const pathname = usePathname();
  const [email, setEmail] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email || null);
      setChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const tabs = email ? loggedInTabs : loggedOutTabs;

  return (
    <>
      <header className="top-header">
        <nav>
          <Link href="/" className="logo">
            <span className="logo-mark"></span>coride
          </Link>
          {checked && (
            <div className="tabs desktop-tabs">
              {tabs.map(t => (
                <Link key={t.href} href={t.href} className={'tab-btn' + (pathname === t.href ? ' active' : '')}>
                  {t.label}
                </Link>
              ))}
            </div>
          )}
          <span className="pill-account">{email || 'not signed in'}</span>
        </nav>
      </header>

      {checked && (
        <nav className="bottom-nav">
          {tabs.map(t => (
            <Link key={t.href} href={t.href} className={'bottom-tab' + (pathname === t.href ? ' active' : '')}>
              <span className="bottom-tab-icon">{t.icon}</span>
              <span className="bottom-tab-label">{t.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}