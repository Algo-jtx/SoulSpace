import React, { useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { UserContext, ThemeContext } from '../App'; 

function Navbar({ onLogout }) {
  const { user } = useContext(UserContext);
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const history = useHistory();

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <nav className="navbar">
      <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
        SoulSpace
      </Link>

      <div className="navbar-links">
        <button onClick={toggleDarkMode} className="btn-icon"> 
          {isDarkMode ? '☀️' : '🌙'} 
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
