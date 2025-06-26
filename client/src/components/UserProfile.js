import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { Link } from 'react-router-dom';

function UserProfile() {
  const { user } = useContext(UserContext);
  const [letters, setLetters] = useState([]);
  const [timeCapsules, setTimeCapsules] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setErrors([]);

      // Fetch all data in parallel
      Promise.all([
        fetch('/letters').then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err.errors || 'Failed to fetch letters.'))),
        fetch('/time_capsules').then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err.errors || 'Failed to fetch time capsules.'))),
        fetch('/user_notes').then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err.errors || 'Failed to fetch user notes.')))
      ])
      .then(([lettersData, timeCapsulesData, userNotesData]) => {
        setLetters(lettersData);
        setTimeCapsules(timeCapsulesData);
        setUserNotes(userNotesData);
      })
      .catch(err => {
        console.error("Error loading user profile data:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to load profile data. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false); // No user, so stop loading
      setLetters([]);
      setTimeCapsules([]);
      setUserNotes([]);
    }
  }, [user]); // Re-fetch if user changes

  // Helper to format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper to determine if a time capsule is openable
  const isCapsuleOpenable = (dateString) => {
    const open = new Date(dateString);
    const now = new Date();
    return open <= now;
  };

  if (isLoading) {
    return (
      <div className="container p-6 flex-center min-h-content-area"> {/* min-h-content-area for better loading display */}
        <p className="text-xl font-semibold text-purple-700">Loading your SoulSpace profile...</p>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="container p-6 flex-center min-h-content-area">
        <div className="error-message text-center" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="ml-2">{errors.join(', ')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Your Profile Overview</h2>
      <p className="text-md text-gray-600 mb-8 text-center max-w-2xl home-subtitle">
        A snapshot of your journey through SoulSpace.
      </p>

      {user && (
        <div className="card user-profile-info mb-8">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4">Hello, {user.username}!</h3>
          <p className="text-gray-700 text-md">Email: {user.email}</p>
          <p className="text-gray-700 text-md">Member Since: {formatDate(user.created_at)}</p>
        </div>
      )}

      {/* Letters Unsent Summary */}
      <div className="profile-section-card card mb-8">
        <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex-center" style={{ justifyContent: 'space-between' }}>
          Letters Unsent ({letters.length})
          <Link to="/dashboard/letters" className="btn btn-secondary btn-sm profile-view-all">View All</Link>
        </h3>
        {letters.length > 0 ? (
          <ul className="profile-list">
            {letters.slice(0, 3).map(letter => ( // Show top 3 letters
              <li key={letter.id} className="profile-list-item">
                <span className="profile-list-title">{letter.title}</span>
                <span className="profile-list-date">({formatDate(letter.created_at)})</span>
              </li>
            ))}
            {letters.length > 3 && (
              <li className="profile-list-item">
                <Link to="/dashboard/letters" className="text-purple-600 font-medium">...and {letters.length - 3} more</Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-gray-600 text-md">No letters written yet. <Link to="/dashboard/letters" className="text-purple-600 font-medium">Write one?</Link></p>
        )}
      </div>

      {/* Time Capsules Summary */}
      <div className="profile-section-card card mb-8">
        <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex-center" style={{ justifyContent: 'space-between' }}>
          Time Capsules ({timeCapsules.length})
          <Link to="/dashboard/time-capsules" className="btn btn-secondary btn-sm profile-view-all">View All</Link>
        </h3>
        {timeCapsules.length > 0 ? (
          <ul className="profile-list">
            {timeCapsules.slice(0, 3).map(capsule => ( // Show top 3 capsules
              <li key={capsule.id} className="profile-list-item">
                <span className="profile-list-title">
                  {isCapsuleOpenable(capsule.open_date) ? "Open" : "Sealed"} until {formatDate(capsule.open_date)}
                </span>
                <span className="profile-list-date">({formatDate(capsule.created_at)})</span>
              </li>
            ))}
            {timeCapsules.length > 3 && (
              <li className="profile-list-item">
                <Link to="/dashboard/time-capsules" className="text-purple-600 font-medium">...and {timeCapsules.length - 3} more</Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-gray-600 text-md">No time capsules created yet. <Link to="/dashboard/time-capsules" className="text-purple-600 font-medium">Create one?</Link></p>
        )}
      </div>

      {/* The Quiet Page Notes Summary */}
      <div className="profile-section-card card">
        <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex-center" style={{ justifyContent: 'space-between' }}>
          Quiet Page Notes ({userNotes.length})
          <Link to="/dashboard/quiet-page" className="btn btn-secondary btn-sm profile-view-all">View Page</Link>
        </h3>
        {userNotes.length > 0 ? (
          <ul className="profile-list">
            {userNotes.slice(0, 3).map(note => ( // Show top 3 notes
              <li key={note.id} className="profile-list-item">
                <span className="profile-list-title">
                  {note.content.substring(0, 50)}{note.content.length > 50 ? '...' : ''}
                </span>
                <span className="profile-list-date">({formatDate(note.created_at)})</span>
              </li>
            ))}
            {userNotes.length > 3 && (
              <li className="profile-list-item">
                <Link to="/dashboard/quiet-page" className="text-purple-600 font-medium">...and {userNotes.length - 3} more</Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-gray-600 text-md">No notes on your quiet page yet. <Link to="/dashboard/quiet-page" className="text-purple-600 font-medium">Start writing?</Link></p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
