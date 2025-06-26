import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';

import './index.css';

export const UserContext = createContext(null);
export const ThemeContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    function checkSession() {
      setLoading(true);
      fetch('/check_session')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          if (response.status === 401) {
            return response.json().then(errorData => {
              if (errorData.errors && errorData.errors === "No active session.") {
                return Promise.resolve(null);
              }
              return Promise.reject(errorData.errors || `Server responded with status: ${response.status}`);
            });
          }
          return response.json().then(errorData => {
            return Promise.reject(errorData.errors || `Server responded with status: ${response.status}`);
          });
        })
        .then(userData => {
          setUser(userData);
          setGlobalError(null);
        })
        .catch(err => {
          console.error("Session check error (catch block):", err);
          setGlobalError('Failed to connect to the server. Please ensure the backend is running and accessible.');
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

  if (globalError) {
    return (
      <div className="min-h-screen flex-center bg-red-100 text-red-800">
        <p className="text-xl font-semibold">{globalError}</p>
      </div>
    );
  }

  return (
    <Router>
      <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
        <UserContext.Provider value={{ user, setUser }}>
          <div className="flex-column min-h-screen">
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
      </ThemeContext.Provider>
    </Router>
  );
}

export default App;
