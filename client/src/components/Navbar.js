import React, { useContext } from 'react';
import { Link } from 'react-router-dom'; // Removed useNavigate as it's not directly used here
import { UserContext } from '../App';

function Navbar({ onLogout }) {
  const { user } = useContext(UserContext);

  return (
    <nav className="navbar">
      <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
        SoulSpace
      </Link>

      <div className="navbar-links">
        {user ? (
          <>
            <span className="text-gray-700 font-medium text-username-hide-sm text-username-show-sm">Hello, {user.username}!</span> {/* Added classes for responsiveness */}
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
