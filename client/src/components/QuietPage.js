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
      setErrors([]);

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
            setNoteContent(''); // No notes yet, so input starts empty
            setCurrentNoteId(null); // No note ID if none exist
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
        // --- START CHANGES HERE ---
        setNoteContent(''); // Clear the textarea content after successful save
        setCurrentNoteId(null); // Reset currentNoteId so next save is a new POST
        // --- END CHANGES HERE ---
        setSuccessMessage('Note saved successfully! You can write a new note now.'); // More explicit success message
        setErrors([]);
      })
      .catch(err => {
        console.error(`${currentNoteId ? 'Update' : 'Create'} note error:`, err);
        setErrors(Array.isArray(err) ? err : [`Failed to ${currentNoteId ? 'update' : 'create'} note. Please try again.`]);
      })
      .finally(() => {
        setIsLoading(false);
        // Clear success message after a few seconds
        setTimeout(() => setSuccessMessage(''), 5000); // Increased timeout for reading message
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
        <div className="success-message text-center" role="alert">
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
       {/* Optionally display a list of all past notes if needed, but for 'quiet page' it might be simpler to focus on current/new */}
       {/* If you wanted to show old notes:
       <div className="mt-8">
         <h3 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Past Notes</h3>
         {userNotes.length > 0 ? ( // Assuming you'd fetch all notes here
           <ul className="profile-list">
             {userNotes.map(note => (
               <li key={note.id} className="profile-list-item">
                 <span className="profile-list-title">{note.content.substring(0, 80)}...</span>
                 <span className="profile-list-date">({new Date(note.created_at).toLocaleDateString()})</span>
               </li>
             ))}
           </ul>
         ) : (
           <p className="text-center text-gray-600">No past notes to display.</p>
         )}
       </div>
       */}
    </div>
  );
}

export default QuietPage;
