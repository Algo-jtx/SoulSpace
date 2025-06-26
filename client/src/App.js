import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';

import './index.css';

export const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    function checkSession() { // Removed 'async' keyword
      setLoading(true); // Ensure loading is set before fetch
      fetch('/check_session')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          // If response not ok, still return a promise that resolves to null/error
          return response.json().then(err => Promise.reject(err.errors || 'Failed to check session.'));
        })
        .then(userData => {
          setUser(userData);
        })
        .catch(err => {
          console.error("Failed to check session:", err);
          setError("Failed to connect to the server. Please ensure the backend is running.");
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex-center bg-purple-soft-gradient text-gray-800">
        <p className="text-xl font-semibold text-purple-700">Loading SoulSpace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex-center bg-red-100 text-red-800">
        <p className="text-xl font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <Router>
      <UserContext.Provider value={{ user, setUser }}>
        <div className="flex-column min-h-screen bg-purple-soft-gradient text-gray-800">
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route
              path="/dashboard"
              render={(routerProps) => (user ? <Dashboard {...routerProps} /> : <Login />)}
            />
            <Route component={NotFound} />
          </Switch>
        </div>
      </UserContext.Provider>
    </Router>
  );
}

export default App;
