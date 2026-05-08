import { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import JourneyMap from './components/JourneyMap';
import AdminPanel from './components/AdminPanel';
import ChangePasswordModal from './components/ChangePasswordModal';
import { getMe, getJourney, getJourneyVersion, saveJourney, logout } from './api';
import { useUndoRedoFull } from './hooks/useUndoRedo';

const POLL_INTERVAL = 4000;

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [liveUpdateAvailable, setLiveUpdateAvailable] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null);

  const { state: journeyData, set: setJourneyData, undo, redo, reset, canUndo, canRedo } = useUndoRedoFull(null);
  const pollingRef = useRef(null);
  const serverVersionRef = useRef(null);
  const isDirtyRef = useRef(false);

  // Check existing auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { user } = await getMe();
        setUser(user);
        await loadJourney();
      } catch {
        // not logged in
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  // Start polling after login
  useEffect(() => {
    if (user && journeyData) {
      startPolling();
    }
    return () => stopPolling();
  }, [user, !!journeyData]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        isDirtyRef.current = true;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        isDirtyRef.current = true;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  async function loadJourney() {
    setLoadingData(true);
    try {
      const { data, updatedAt, updatedBy } = await getJourney();
      reset(data);
      serverVersionRef.current = updatedAt;
      setLastSyncedAt(updatedAt);
      setLastUpdatedBy(updatedBy);
      isDirtyRef.current = false;
    } finally {
      setLoadingData(false);
    }
  }

  function startPolling() {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const v = await getJourneyVersion();
        if (v && v.updatedAt !== serverVersionRef.current) {
          serverVersionRef.current = v.updatedAt;
          setLiveUpdateAvailable(true);
          setLastUpdatedBy(v.updatedBy);
        }
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function applyLiveUpdate() {
    await loadJourney();
    setLiveUpdateAvailable(false);
  }

  function handleJourneyChange(newData) {
    setJourneyData(newData);
    isDirtyRef.current = true;
    setSaveStatus('idle');
    setLiveUpdateAvailable(false);
  }

  async function handleSave() {
    if (!journeyData) return;
    setSaveStatus('saving');
    try {
      const result = await saveJourney(journeyData);
      serverVersionRef.current = result.updatedAt;
      setLastSyncedAt(result.updatedAt);
      setLastUpdatedBy(result.updatedBy);
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    reset(null);
    stopPolling();
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={u => { setUser(u); loadJourney(); }} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-none">Qualitia</h1>
                <p className="text-xs text-gray-500 leading-none mt-0.5">User Journey Map</p>
              </div>
            </div>

            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => { undo(); isDirtyRef.current = true; setSaveStatus('idle'); }}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={() => { redo(); isDirtyRef.current = true; setSaveStatus('idle'); }}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Center: Live update banner */}
          <div className="flex-1 flex justify-center">
            {liveUpdateAvailable && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span>{lastUpdatedBy} made changes</span>
                <button
                  onClick={applyLiveUpdate}
                  className="font-semibold underline hover:no-underline"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

          {/* Right: Save + User */}
          <div className="flex items-center gap-2">
            {lastSyncedAt && saveStatus === 'idle' && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Saved {new Date(lastSyncedAt).toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                ${saveStatus === 'saved' ? 'bg-green-100 text-green-700 border border-green-200' :
                  saveStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                  saveStatus === 'saving' ? 'bg-blue-100 text-blue-600 border border-blue-200 cursor-wait' :
                  'bg-blue-600 hover:bg-blue-700 text-white'}
              `}
            >
              {saveStatus === 'saving' ? (
                <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
              ) : saveStatus === 'saved' ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Saved</>
              ) : saveStatus === 'error' ? (
                <>Save Failed</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save</>
              )}
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </button>
            )}

            {/* User menu dropdown */}
            <div className="relative pl-2 border-l border-gray-200" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 hidden sm:block">{user.username}</span>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.username}</p>
                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Change password */}
                  <button
                    onClick={() => { setShowChangePassword(true); setShowUserMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={() => { handleLogout(); setShowUserMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Journey Map */}
      {loadingData ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading journey map…</p>
          </div>
        </div>
      ) : journeyData ? (
        <JourneyMap journeyData={journeyData} onChange={handleJourneyChange} />
      ) : null}

      {/* Admin Panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* Change Password */}
      {showChangePassword && <ChangePasswordModal user={user} onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
