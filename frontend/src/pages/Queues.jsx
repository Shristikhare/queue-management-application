import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Queues() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueName, setQueueName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      const res = await api.get('/queues');
      setQueues(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createQueue = async (e) => {
    e.preventDefault();
    if (!queueName.trim()) return;
    setCreateError('');
    setCreating(true);
    try {
      const res = await api.post('/queues', { name: queueName.trim() });
      setQueues((prev) => [{ ...res.data, waitingCount: 0 }, ...prev]);
      setQueueName('');
      setShowForm(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create queue');
    } finally {
      setCreating(false);
    }
  };

  const deleteQueue = async (id) => {
    if (!window.confirm('Delete this queue and all its tokens? This cannot be undone.')) return;
    try {
      await api.delete(`/queues/${id}`);
      setQueues((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete queue');
    }
  };

  const toggleStatus = async (queue) => {
    const newStatus = queue.status === 'active' ? 'closed' : 'active';
    try {
      const res = await api.patch(`/queues/${queue._id}/status`, { status: newStatus });
      setQueues((prev) => prev.map((q) => (q._id === queue._id ? { ...q, status: res.data.status } : q)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Queues</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {queues.length} queue{queues.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setCreateError(''); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm"
        >
          <span className="text-lg leading-none">+</span> New Queue
        </button>
      </div>

      {/* Create queue form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Create New Queue</h2>
          {createError && (
            <p className="text-red-500 text-sm mb-3">{createError}</p>
          )}
          <form onSubmit={createQueue} className="flex gap-3">
            <input
              type="text"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              placeholder="e.g. Customer Service, Counter A…"
              autoFocus
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={creating || !queueName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 px-3 py-2.5 rounded-xl text-sm"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Queue grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : queues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🎟️</p>
          <p className="font-semibold text-gray-600">No queues yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first queue to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {queues.map((queue) => (
            <QueueCard key={queue._id} queue={queue} onDelete={deleteQueue} onToggle={toggleStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueCard({ queue, onDelete, onToggle }) {
  const isActive = queue.status === 'active';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base truncate">{queue.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(queue.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => onDelete(queue._id)}
          aria-label="Delete queue"
          className="ml-2 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex-1 bg-indigo-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{queue.waitingCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Waiting</div>
        </div>
        <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-600">{queue.tokenCounter}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Issued</div>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onToggle(queue)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer border ${
            isActive
              ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
              : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
          }`}
        >
          {isActive ? '● Active' : '○ Closed'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          to={`/queues/${queue._id}`}
          className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl text-sm"
        >
          Manage
        </Link>
        <Link
          to={`/queues/${queue._id}/dashboard`}
          className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold py-2 rounded-xl text-sm"
        >
          Analytics
        </Link>
      </div>
    </div>
  );
}
