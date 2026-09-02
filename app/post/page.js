'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase';
import NavBar from '../components/NavBar';

const PostRouteMap = dynamic(() => import('../components/PostRouteMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 360,
        borderRadius: 18,
        marginTop: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#081313',
        border: '1px solid var(--line)',
      }}
    >
      Loading map...
    </div>
  ),
});

export default function PostRoutePage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [time, setTime] = useState('');

  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const [locating, setLocating] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);

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

  useEffect(() => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    setTime(`${hours}:${minutes}`);
  }, []);

  function useCurrentLocation() {
    setError('');

    if (!navigator.geolocation) {
      setError('Your browser does not support location services.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(coords);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
          );

          const data = await res.json();

          if (data?.display_name) {
            setStart(data.display_name);
          } else {
            setStart(
              `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            );
          }
        } catch {
          setStart(
            `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
          );
        }

        setLocating(false);
      },
      (geoError) => {
        setLocating(false);

        if (geoError.code === 1) {
          setError(
            'Location permission was denied. Please allow location access in your browser.'
          );
        } else if (geoError.code === 2) {
          setError('Your location could not be detected.');
        } else {
          setError('Could not get your current location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  async function findDestination() {
    setError('');

    if (!end.trim()) {
      setError('Enter a destination first.');
      return;
    }

    setSearchingDestination(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          end
        )}&limit=1`
      );

      const data = await res.json();

      if (!data || data.length === 0) {
        setError(
          'Destination could not be found. Try a more specific place.'
        );
        setSearchingDestination(false);
        return;
      }

      setDestination({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      });
    } catch {
      setError('Could not search for the destination.');
    }

    setSearchingDestination(false);
  }

  async function submit(e) {
    e.preventDefault();

    setError('');

    if (!start || !end || !time) {
      setError(
        'Choose your pickup point, destination, and departure time.'
      );
      return;
    }

    if (!currentLocation) {
      setError(
        'Please use your current location before posting the route.'
      );
      return;
    }

    const { error: insertError } = await supabase
      .from('routes')
      .insert({
        user_id: user.id,
        start_point: start,
        end_point: end,
        pickup_time: time,
        recurring: recurring,
      });

    if (insertError) {
      console.error(insertError);
      setError('Could not post your route. Try again.');
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      router.push('/matches');
    }, 1200);
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
          <p className="eyebrow">SMART COMMUTE</p>

          <h2>Where are you heading?</h2>

          <p style={{ color: 'var(--muted)', marginTop: 8 }}>
            Set your route and find people travelling the same way.
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{
            maxWidth: 900,
            margin: '0 auto',
          }}
        >
          <div
            className="form-box"
            style={{
              maxWidth: 'none',
              padding: 24,
            }}
          >
            {/* CURRENT LOCATION */}

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                📍 Starting point
              </label>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: 'var(--panel)',
                  color: 'white',
                  textAlign: 'left',
                  cursor: locating ? 'wait' : 'pointer',
                  fontSize: 14,
                }}
              >
                {locating
                  ? '📡 Finding your location...'
                  : currentLocation
                  ? '📍 Current location detected'
                  : '📍 Use my current location'}
              </button>

              {start && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: 'var(--muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {start}
                </div>
              )}
            </div>

            {/* DESTINATION */}

            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                🏁 Destination
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  type="text"
                  placeholder="Search where you're going..."
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  style={{
                    flex: 1,
                  }}
                />

                <button
                  type="button"
                  onClick={findDestination}
                  disabled={searchingDestination}
                  style={{
                    padding: '0 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#FF6B4A',
                    color: '#081313',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {searchingDestination ? '...' : 'Find'}
                </button>
              </div>
            </div>

            {/* MAP */}

            <PostRouteMap
              currentLocation={currentLocation}
              destination={destination}
            />

            {/* TIME */}

            <div style={{ marginTop: 22 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                🕐 Departure time
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{
                    flex: 1,
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();

                    setTime(
                      `${String(now.getHours()).padStart(2, '0')}:${String(
                        now.getMinutes()
                      ).padStart(2, '0')}`
                    );
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⚡ Now
                </button>
              </div>
            </div>

            {/* RECURRING */}

            <div
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(127, 224, 190, 0.06)',
                border: '1px solid var(--line)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />

                <span>
                  🔄 <strong>Repeat this commute every weekday</strong>
                </span>
              </label>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="error-msg"
                style={{
                  marginTop: 14,
                }}
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                style={{
                  color: 'var(--mint)',
                  fontSize: 13,
                  marginTop: 14,
                }}
              >
                ✓ Route posted. Finding your commute matches…
              </div>
            )}

            {/* POST BUTTON */}

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: 20,
                fontSize: 15,
                padding: '15px',
              }}
            >
              🚗 Post & Find Commute Matches
            </button>
          </div>
        </form>
      </main>
    </>
  );
}