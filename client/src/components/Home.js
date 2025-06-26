import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../App';

function Home() {
  const { user } = useContext(UserContext);

  return (
    <div className="min-h-screen flex-column flex-center text-center p-6 bg-purple-soft-gradient text-gray-800">
      <header className="mb-8">
        <h1 className="text-5xl font-extrabold text-purple-800 mb-4 tracking-tight leading-tight">
          Welcome to <span className="text-indigo-600">SoulSpace</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl home-subtitle">
          Your personal sanctuary for emotional, spiritual, and mental well-being.
          Pause, breathe, write, and reconnect with yourself.
        </p>
      </header>

      <main className="flex-column flex-center gap-4">
        {user ? (
          <p className="text-lg text-gray-700">
            Welcome back, <span className="font-semibold text-indigo-700">{user.username}</span>!
            <br />
            <Link to="/dashboard" className="text-purple-600 mt-2 home-dashboard-link">
              Go to your Dashboard
            </Link>
          </p>
        ) : (
          <>
            <Link
              to="/signup"
              className="btn btn-primary"
            >
              Get Started - Sign Up
            </Link>
            <p className="text-md text-gray-600">
              Already a member?{' '}
              <Link to="/login" className="text-purple-600 font-medium">
                Log In
              </Link>
            </p>
          </>
        )}
      </main>

      <footer className="mt-12 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} SoulSpace. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
