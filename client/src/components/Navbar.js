import React, { useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { UserContext, ThemeContext } from '../App'; // NEW: Import ThemeContext

function Navbar({ onLogout }) {
  const { user } = useContext(UserContext);
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext); // NEW: Get dark mode state and setter
  const history = useHistory();

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <nav className="navbar">
      <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
        SoulSpace
      </Link>

      <div className="navbar-links">
        {/* NEW: Dark Mode Toggle Button */}
        <button onClick={toggleDarkMode} className="btn-icon"> {/* Need to define .btn-icon in CSS */}
          {isDarkMode ? '☀️' : '🌙'} {/* Sun for light mode, Moon for dark mode */}
        </button>

        {user ? (
          <>
            <span className="text-gray-700 font-medium text-username-hide-sm text-username-show-sm">Hello, {user.username}!</span>
            <button
              onClick={onLogout}
              className="btn btn-danger"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">
              Login
            </Link>
            <Link
              to="/signup"
              className="btn btn-primary"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
