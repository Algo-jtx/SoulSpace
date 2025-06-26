import React, { useContext } from 'react';
import { Switch, Route, Link, useHistory, useRouteMatch } from 'react-router-dom';
import { UserContext } from '../App';
import Navbar from './Navbar';
import LettersUnsent from './LettersUnsent';
import TimeCapsules from './TimeCapsules';
import QuietPage from './QuietPage';
import LoopBreaker from './LoopBreaker';
import SoulNotes from './SoulNotes';
import BreathGround from './BreathGround';
import UserProfile from './UserProfile'; 

function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const history = useHistory();
  let { path, url } = useRouteMatch(); 

  const handleLogout = () => {
    fetch('/logout', { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          setUser(null); 
          history.push('/login'); 
        } else {
          response.json().then(errorData => {
            console.error('Logout failed:', errorData);
            alert('Failed to log out. Please try again.');
          }).catch(() => {
            alert('Failed to log out. An unknown error occurred.'); 
          });
        }
      })
      .catch(error => {
        console.error('Logout network error:', error);
        alert('Network error during logout. Please try again.'); 
      });
  };

  if (!user) {
    return (
      <div className="flex-center min-h-screen bg-red-100">
        <p className="text-red-700">Access Denied. Please <Link to="/login" className="text-purple-700 font-semibold">login</Link>.</p>
      </div>
    );
  }

  return (
    <div className="flex-column min-h-screen bg-purple-soft-gradient text-gray-800">
      <Navbar onLogout={handleLogout} />

      <main className="flex-grow p-6">
        <h1 className="text-4xl font-bold text-indigo-700 mb-8 text-center">Your SoulSpace Dashboard</h1>
        <div className="dashboard-grid">
          <Link to={`${url}/profile`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="user profile">👤</span>
            <h2 className="dashboard-card-title">My Profile</h2>
            <p className="dashboard-card-description">Overview of your SoulSpace journey.</p>
          </Link>

          <Link to={`${url}/letters`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="envelope">✉️</span>
            <h2 className="dashboard-card-title">Letters Unsent</h2>
            <p className="dashboard-card-description">Write what you can't say out loud.</p>
          </Link>
          <Link to={`${url}/time-capsules`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="hourglass">⏳</span>
            <h2 className="dashboard-card-title">Time Capsules</h2>
            <p className="dashboard-card-description">Send messages to your future self.</p>
          </Link>
          <Link to={`${url}/quiet-page`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="notepad">📝</span>
            <h2 className="dashboard-card-title">The Quiet Page</h2>
            <p className="dashboard-card-description">Your personal free-writing space.</p>
          </Link>
          <Link to={`${url}/loop-breaker`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="infinity">♾️</span>
            <h2 className="dashboard-card-title">Loop Breaker</h2>
            <p className="dashboard-card-description">Gently redirect negative spirals.</p>
          </Link>
          <Link to={`${url}/soul-notes`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="sparkles">✨</span>
            <h2 className="dashboard-card-title">Soul Notes</h2>
            <p className="dashboard-card-description">Short comforting thoughts.</p>
          </Link>
          <Link to={`${url}/breath-ground`} className="dashboard-card">
            <span className="dashboard-card-icon" role="img" aria-label="leaf">🍃</span>
            <h2 className="dashboard-card-title">Breath & Ground</h2>
            <p className="dashboard-card-description">Simple breathing techniques.</p>
          </Link>
        </div>

        <Switch>
          <Route path={`${path}/profile`} component={UserProfile} /> 
          <Route path={`${path}/letters`} component={LettersUnsent} />
          <Route path={`${path}/time-capsules`} component={TimeCapsules} />
          <Route path={`${path}/quiet-page`} component={QuietPage} />
          <Route path={`${path}/loop-breaker`} component={LoopBreaker} />
          <Route path={`${path}/soul-notes`} component={SoulNotes} />
          <Route path={`${path}/breath-ground`} component={BreathGround} />
          <Route exact path={path} render={() => (
             <p className="text-center text-gray-700 text-lg mt-8">Select a feature above to get started!</p>
          )} />
        </Switch>
      </main>
    </div>
  );
}

export default Dashboard;
