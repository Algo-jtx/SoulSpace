import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';

function TimeCapsules() {
  const { user } = useContext(UserContext);
  const [timeCapsules, setTimeCapsules] = useState([]);
  const [message, setMessage] = useState('');
  const [openDate, setOpenDate] = useState(''); // Format: YYYY-MM-DD
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Function to fetch all time capsules
  const fetchTimeCapsules = () => {
    setIsLoading(true);
    fetch('/time_capsules')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors || `Server responded with status: ${response.status}`));
      })
      .then(data => {
        setTimeCapsules(data);
        setErrors([]);
      })
      .catch(err => {
        console.error("Error fetching time capsules:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to load time capsules. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchTimeCapsules();
    } else {
      setTimeCapsules([]);
    }
  }, [user]);

  // Function to handle creating/updating a time capsule
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    // Basic date validation for future date
    const selectedDate = new Date(openDate);
    const now = new Date();
    // Set both to midnight for accurate comparison, ignoring time
    selectedDate.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    if (selectedDate <= now) {
      setErrors(['Open date must be in the future.']);
      setIsLoading(false);
      return;
    }

    const method = editingCapsule ? 'PATCH' : 'POST';
    const url = editingCapsule ? `/time_capsules/${editingCapsule.id}` : '/time_capsules';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, open_date: openDate }), // Backend expects YYYY-MM-DD format
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors));
      })
      .then(newOrUpdatedCapsule => {
        if (editingCapsule) {
          setTimeCapsules(timeCapsules.map(tc => (tc.id === newOrUpdatedCapsule.id ? newOrUpdatedCapsule : tc)));
        } else {
          setTimeCapsules([newOrUpdatedCapsule, ...timeCapsules]);
        }
        setMessage('');
        setOpenDate('');
        setEditingCapsule(null);
        setShowForm(false);
        setErrors([]);
      })
      .catch(err => {
        console.error(`${editingCapsule ? 'Update' : 'Create'} time capsule error:`, err);
        setErrors(Array.isArray(err) ? err : [`Failed to ${editingCapsule ? 'update' : 'create'} time capsule. Please try again.`]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Function to handle deleting a time capsule
  const handleDelete = (capsuleId) => {
    if (!window.confirm("Are you sure you want to delete this time capsule? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    fetch(`/time_capsules/${capsuleId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          setTimeCapsules(timeCapsules.filter(tc => tc.id !== capsuleId));
          setErrors([]);
        } else {
          response.json().then(errorData => Promise.reject(errorData.errors || 'Failed to delete time capsule.'));
        }
      })
      .catch(err => {
        console.error("Delete time capsule error:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to delete time capsule. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Function to open the form for editing an existing time capsule
  const handleEditClick = (capsule) => {
    setEditingCapsule(capsule);
    setMessage(capsule.message);
    // Format date string for input type="date" (YYYY-MM-DD)
    const date = new Date(capsule.open_date);
    const formattedDate = date.toISOString().split('T')[0];
    setOpenDate(formattedDate);
    setShowForm(true);
  };

  // Function to reset the form
  const handleCancelEdit = () => {
    setEditingCapsule(null);
    setMessage('');
    setOpenDate('');
    setShowForm(false);
    setErrors([]);
  };

  // Helper to determine if capsule is openable
  const isCapsuleOpenable = (dateString) => {
    const open = new Date(dateString);
    const now = new Date();
    return open <= now;
  };

  return (
    <div className="container p-6">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Time Capsules</h2>
      <p className="text-md text-gray-600 mb-8 text-center max-w-2xl home-subtitle">
        Write messages to your future self, to be opened on a specific date.
      </p>

      <div className="text-center mb-8">
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary">
          {showForm ? 'Hide Form' : (editingCapsule ? 'Edit Time Capsule' : 'Create New Time Capsule')}
        </button>
      </div>

      {/* Time Capsule Creation/Editing Form */}
      {showForm && (
        <div className="card max-w-2xl form-modal-spacing">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4 text-center">
            {editingCapsule ? 'Edit Your Time Capsule' : 'Create New Time Capsule'}
          </h3>
          <form onSubmit={handleSubmit} className="form-content">
            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                className="form-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="8"
                required
                placeholder="What do you want to tell your future self?"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="openDate" className="form-label">Open Date</label>
              <input
                type="date"
                id="openDate"
                className="form-input"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                required
              />
            </div>
            {errors.length > 0 && (
              <div className="error-message" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="ml-2">{errors.join(', ')}</span>
              </div>
            )}
            <div className="flex-center gap-4">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (editingCapsule ? 'Updating...' : 'Creating...') : (editingCapsule ? 'Update Capsule' : 'Create Capsule')}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display Loading/Error/No Time Capsules */}
      {isLoading && <p className="text-center text-purple-700 text-lg">Loading time capsules...</p>}
      {errors.length > 0 && !isLoading && (
        <div className="error-message text-center" role="alert">
          <strong className="font-bold">Error loading time capsules!</strong>
          <span className="ml-2">{errors.join(', ')}</span>
        </div>
      )}
      {!isLoading && timeCapsules.length === 0 && !showForm && (
        <p className="text-center text-gray-600 text-lg">No time capsules found. Click "Create New Time Capsule" to get started!</p>
      )}

      {/* Time Capsules List */}
      {!isLoading && timeCapsules.length > 0 && (
        <div className="time-capsules-grid letters-grid"> {/* Reusing letters-grid for layout */}
          {timeCapsules.map(capsule => (
            <div key={capsule.id} className="time-capsule-card card">
              <h3 className="text-xl font-bold text-indigo-700 mb-2">
                Open on: {new Date(capsule.open_date).toLocaleDateString()}
              </h3>
              <p className="text-gray-700 text-sm mb-4" style={{ flexGrow: 1 }}>
                {isCapsuleOpenable(capsule.open_date) ? capsule.message : "This message is sealed until its open date."}
              </p>
              <p className="text-gray-500 text-sm time-capsule-created-date">
                Created: {new Date(capsule.created_at).toLocaleDateString()}
              </p>
              <div className="time-capsule-actions flex-center mt-4 gap-0-75rem">
                <button
                  onClick={() => handleEditClick(capsule)}
                  className="btn btn-secondary btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(capsule.id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimeCapsules;
