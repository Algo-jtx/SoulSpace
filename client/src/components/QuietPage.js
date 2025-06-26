import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';

function QuietPage() {
  const { user } = useContext(UserContext);
  const [noteContent, setNoteContent] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState(null); // To store the ID of the note being edited/viewed
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch the most recent user note on component mount
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetch('/user_notes') // Fetch all notes for the user
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          return response.json().then(errorData => Promise.reject(errorData.errors || `Server responded with status: ${response.status}`));
        })
        .then(notes => {
          if (notes.length > 0) {
            // Assuming we only care about the most recent note for "The Quiet Page"
            // The backend is already ordering by created_at.desc()
            setNoteContent(notes[0].content);
            setCurrentNoteId(notes[0].id);
          } else {
            setNoteContent(''); // No notes yet
            setCurrentNoteId(null);
          }
          setErrors([]);
        })
        .catch(err => {
          console.error("Error fetching user notes:", err);
          setErrors(Array.isArray(err) ? err : ['Failed to load your quiet page.']);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setNoteContent('');
      setCurrentNoteId(null);
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');
    setIsLoading(true);

    const method = currentNoteId ? 'PATCH' : 'POST';
    const url = currentNoteId ? `/user_notes/${currentNoteId}` : '/user_notes';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: noteContent }),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors));
      })
      .then(savedNote => {
        setNoteContent(savedNote.content); // Update with content from server response
        setCurrentNoteId(savedNote.id); // Ensure we have the ID for future updates
        setSuccessMessage('Note saved successfully!');
        setErrors([]);
      })
      .catch(err => {
        console.error(`${currentNoteId ? 'Update' : 'Create'} note error:`, err);
        setErrors(Array.isArray(err) ? err : [`Failed to ${currentNoteId ? 'update' : 'create'} note. Please try again.`]);
      })
      .finally(() => {
        setIsLoading(false);
        // Clear success message after a few seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      });
  };

  return (
    <div className="container p-6">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">The Quiet Page</h2>
      <p className="text-md text-gray-600 mb-8 text-center max-w-2xl home-subtitle">
        This is your free-writing space. No rules, no judgments, just your thoughts.
      </p>

      {isLoading && <p className="text-center text-purple-700 text-lg">Loading your notes...</p>}
      {errors.length > 0 && !isLoading && (
        <div className="error-message text-center" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="ml-2">{errors.join(', ')}</span>
        </div>
      )}
      {successMessage && (
        <div className="success-message text-center" role="alert"> {/* New success message class */}
          <strong className="font-bold">Success!</strong>
          <span className="ml-2">{successMessage}</span>
        </div>
      )}

      <div className="card max-w-2xl form-modal-spacing">
        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label htmlFor="noteContent" className="form-label">Your Thoughts</label>
            <textarea
              id="noteContent"
              className="form-input"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows="15"
              placeholder="What's on your mind today?"
            ></textarea>
          </div>
          <div className="flex-center">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuietPage;
