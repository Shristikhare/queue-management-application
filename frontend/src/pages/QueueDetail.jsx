import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-sky-500',    'bg-teal-500',   'bg-amber-500',
];

function avatarColor(tokenNumber) {
  return AVATAR_COLORS[tokenNumber % AVATAR_COLORS.length];
}

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function waitTime(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function QueueDetail() {
  const { id } = useParams();
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personName, setPersonName] = useState('');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(null); // tokenId + action string
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get(`/queues/${id}`);
      setQueue(res.data.queue);
      setTokens(res.data.tokens);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // ── Add person ───────────────────────────────────────────────────────────────
  const addPerson = async (e) => {
    e.preventDefault();
    if (!personName.trim()) return;
    setAdding(true);
    try {
      await api.post(`/queues/${id}/tokens`, { personName: personName.trim() });
      setPersonName('');
      await fetchQueue();
      showToast('Person added to queue');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add person', 'error');
    } finally {
      setAdding(false);
    }
  };

  // ── Move up / down ───────────────────────────────────────────────────────────
  const move = async (tokenId, direction) => {
    setBusy(tokenId + direction);
    try {
      await api.patch(`/tokens/${tokenId}/move`, { direction });
      await fetchQueue();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot move token', 'error');
    } finally {
      setBusy(null);
    }
  };

  // ── Serve ────────────────────────────────────────────────────────────────────
  const serve = async (tokenId) => {
    setBusy(tokenId + 'serve');
    try {
      await api.patch(`/tokens/${tokenId}/serve`);
      setTokens((prev) => prev.filter((t) => t._id !== tokenId));
      showToast('Token served ✓');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to serve token', 'error');
    } finally {
      setBusy(null);
    }
  };

  // ── Cancel ───────────────────────────────────────────────────────────────────
  const cancel = async (tokenId) => {
    if (!window.confirm('Cancel this token?')) return;
    setBusy(tokenId + 'cancel');
    try {
      await api.patch(`/tokens/${tokenId}/cancel`);
      setTokens((prev) => prev.filter((t) => t._id !== tokenId));
      showToast('Token cancelled');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel token', 'error');
    } finally {
      setBusy(null);
    }
  };

  // ── Serve Next (top of queue) ────────────────────────────────────────────────
  const serveNext = () => {
    if (tokens.length > 0) serve(tokens[0]._id);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="text-center py-20 text-red-500">Queue not found.</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <Link to="/" className="text-indigo-600 text-sm hover:underline">
            ← All Queues
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{queue.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                queue.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {queue.status === 'active' ? '● Active' : '○ Closed'}
            </span>
            <span className="text-sm text-gray-400">
              {tokens.length} waiting · {queue.tokenCounter} total issued
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={serveNext}
            disabled={tokens.length === 0 || busy !== null}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Serve Next
          </button>
          <Link
            to={`/queues/${id}/dashboard`}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
        </div>
      </div>

      {/* Add Person */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Add Person to Queue</h2>
        <form onSubmit={addPerson} className="flex gap-3">
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Enter person's name…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={adding || !personName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
          >
            {adding ? 'Adding…' : '+ Add'}
          </button>
        </form>
      </div>

      {/* Token list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h2 className="font-semibold text-gray-700 text-sm">Waiting Queue</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {tokens.length} {tokens.length === 1 ? 'person' : 'people'}
          </span>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-medium">Queue is empty</p>
            <p className="text-sm">Add people above to get started</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {tokens.map((token, idx) => (
              <TokenRow
                key={token._id}
                token={token}
                position={idx + 1}
                isFirst={idx === 0}
                isLast={idx === tokens.length - 1}
                onMove={move}
                onServe={serve}
                onCancel={cancel}
                busy={busy}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Token Row ──────────────────────────────────────────────────────────────────

function TokenRow({ token, position, isFirst, isLast, onMove, onServe, onCancel, busy }) {
  const isServing = busy === token._id + 'serve';
  const isCancelling = busy === token._id + 'cancel';
  const isMoving = busy === token._id + 'up' || busy === token._id + 'down';
  const anyBusy = isServing || isCancelling || isMoving;

  return (
    <li className={`flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition ${isFirst ? 'bg-emerald-50 hover:bg-emerald-50' : ''}`}>
      {/* Position number */}
      <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${isFirst ? 'text-emerald-600' : 'text-gray-300'}`}>
        {position}
      </span>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full ${avatarColor(token.tokenNumber)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
        {initials(token.personName)}
      </div>

      {/* Name & token info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{token.personName}</p>
        <p className="text-xs text-gray-400">
          Token <span className="font-medium text-gray-500">#{token.tokenNumber}</span>
          {' · '}
          {waitTime(token.createdAt)} waiting
        </p>
      </div>

      {/* "Next" badge on first item */}
      {isFirst && (
        <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0">
          Next
        </span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Move Up */}
        <button
          onClick={() => onMove(token._id, 'up')}
          disabled={isFirst || anyBusy}
          title="Move up"
          className="p-2 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Move Down */}
        <button
          onClick={() => onMove(token._id, 'down')}
          disabled={isLast || anyBusy}
          title="Move down"
          className="p-2 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Serve */}
        <button
          onClick={() => onServe(token._id)}
          disabled={anyBusy}
          title="Serve this person"
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ml-1"
        >
          {isServing ? '…' : 'Serve'}
        </button>

        {/* Cancel */}
        <button
          onClick={() => onCancel(token._id)}
          disabled={anyBusy}
          title="Cancel token"
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCancelling ? '…' : 'Cancel'}
        </button>
      </div>
    </li>
  );
}
