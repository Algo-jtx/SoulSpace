import React, { useState, useEffect } from 'react';

function SoulNotes() {
  const [soulNote, setSoulNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // Function to fetch a new random soul note
  const fetchNewSoulNote = () => {
    setIsLoading(true);
    setErrors([]);
    setSoulNote(null); // Clear previous note while loading

    fetch('/soul_notes/random')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors || `Server responded with status: ${response.status}`));
      })
      .then(data => {
        setSoulNote(data);
      })
      .catch(err => {
        console.error("Error fetching soul note:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to load a soul note. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Fetch a note when the component mounts
  useEffect(() => {
    fetchNewSoulNote();
  }, []);

  return (
    <div className="container p-6 flex-column flex-center" style={{ minHeight: '60vh' }}>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Soul Notes</h2>
      <p className="text-md text-gray-600 mb-8 text-center max-w-2xl home-subtitle">
        Short, comforting thoughts designed to bring a moment of peace.
      </p>

      <div className="card max-w-2xl form-modal-spacing text-center">
        {isLoading ? (
          <p className="text-xl text-purple-700 font-semibold">Loading a note...</p>
        ) : errors.length > 0 ? (
          <div className="error-message" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="ml-2">{errors.join(', ')}</span>
          </div>
        ) : soulNote ? (
          <>
            <p className="text-xl text-gray-800 font-medium mb-2">{soulNote.message}</p>
            {soulNote.category && <p className="text-sm text-gray-500">Category: {soulNote.category}</p>}
          </>
        ) : (
          <p className="text-xl text-gray-600">Click the button to get a soul note.</p>
        )}
      </div>

      <div className="text-center mt-6">
        <button onClick={fetchNewSoulNote} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Getting Note...' : 'Get New Soul Note'}
        </button>
      </div>
    </div>
  );
}

export default SoulNotes;
