import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex-column flex-center text-center p-6 bg-purple-soft-gradient text-gray-800">
      <h1 className="text-6xl font-extrabold text-purple-700 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Oops! The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="btn btn-primary"
      >
        Go to Home
      </Link>
    </div>
  );
}

export default NotFound;
