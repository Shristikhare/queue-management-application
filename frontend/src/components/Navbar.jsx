import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render navbar on auth pages
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  if (!user || isAuthPage) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">
            QueueManager
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600 font-medium">{user.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
