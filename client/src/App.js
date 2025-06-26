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
  const [globalError, setGlobalError] = useState(null); // Renamed 'error' to 'globalError' for clarity

  useEffect(() => {
    function checkSession() {
      setLoading(true);
      fetch('/check_session')
        .then(response => {
          // If the response is OK (status 200-299), parse and set user data
          if (response.ok) {
            return response.json();
          }
          // If response is NOT OK, but it's a 401 Unauthorized specifically for "No active session."
          // We handle this gracefully by resolving the promise with null, indicating no logged-in user.
          // This prevents setting a 'globalError' for a normal unauthenticated state.
          if (response.status === 401) {
            return response.json().then(errorData => {
              if (errorData.errors && errorData.errors === "No active session.") {
                return Promise.resolve(null); // Resolve with null to signify no user
              }
              // For any other 401 or unexpected error, reject the promise
              return Promise.reject(errorData.errors || `Server responded with status: ${response.status}`);
            });
          }
          // For any other non-2xx status, treat as an error and reject the promise
          return response.json().then(errorData => {
            return Promise.reject(errorData.errors || `Server responded with status: ${response.status}`);
          });
        })
        .then(userData => {
          // userData will be null if 401 "No active session." was handled above,
          // or the actual user object if successfully logged in.
          setUser(userData);
          setGlobalError(null); // Clear any previous global errors if this path is taken
        })
        .catch(err => {
          // This catch block now primarily handles true network errors (e.g., server down)
          // or unhandled server-side errors.
          console.error("Session check error (catch block):", err);
          setGlobalError('Failed to connect to the server. Please ensure the backend is running and accessible.');
          setUser(null); // Ensure user is null on a true error
        })
        .finally(() => {
          setLoading(false); // Always stop loading, regardless of success or failure
        });
    }

    checkSession();
  }, []);

  // Display a loading message while the session check is in progress
  if (loading) {
    return (
      <div className="min-h-screen flex-center bg-purple-soft-gradient text-gray-800">
        <p className="text-xl font-semibold text-purple-700">Loading SoulSpace...</p>
      </div>
    );
  }

  // Only display the global error message if a true connection issue occurred
  if (globalError) {
    return (
      <div className="min-h-screen flex-center bg-red-100 text-red-800">
        <p className="text-xl font-semibold">{globalError}</p>
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
