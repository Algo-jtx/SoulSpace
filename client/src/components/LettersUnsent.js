import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App'; 
import { useRouteMatch } from 'react-router-dom'; 

function LettersUnsent() {
  const { user } = useContext(UserContext); 
  const [letters, setLetters] = useState([]); 
  const [title, setTitle] = useState(''); 
  const [content, setContent] = useState(''); 
  const [errors, setErrors] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const [editingLetter, setEditingLetter] = useState(null); 
  const [showForm, setShowForm] = useState(false); 

  const fetchLetters = () => {
    setIsLoading(true);
    fetch('/letters') 
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors || 'Failed to fetch letters.'));
      })
      .then(data => {
        setLetters(data); 
        setErrors([]); 
      })
      .catch(err => {
        console.error("Error fetching letters:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to load letters. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (user) { 
      fetchLetters();
    } else {
      setLetters([]);
    }
  }, [user]);

  // creatingandupdating a letter
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    const method = editingLetter ? 'PATCH' : 'POST';
    const url = editingLetter ? `/letters/${editingLetter.id}` : '/letters';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors));
      })
      .then(newOrUpdatedLetter => {
        // If editing, update the letter in the existing list
        if (editingLetter) {
          setLetters(letters.map(l => (l.id === newOrUpdatedLetter.id ? newOrUpdatedLetter : l)));
        } else {
          setLetters([newOrUpdatedLetter, ...letters]);
        }
        setTitle('');
        setContent('');
        setEditingLetter(null);
        setShowForm(false);
        setErrors([]); 
      })
      .catch(err => {
        console.error(`${editingLetter ? 'Update' : 'Create'} letter error:`, err);
        setErrors(Array.isArray(err) ? err : [`Failed to ${editingLetter ? 'update' : 'create'} letter. Please try again.`]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleDelete = (letterId) => {
    if (!window.confirm("Are you sure you want to delete this letter? This action cannot be undone.")) {
      return; 
    }

    setIsLoading(true);
    fetch(`/letters/${letterId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          // to filterout the deleted letter from the state
          setLetters(letters.filter(l => l.id !== letterId));
          setErrors([]);
        } else {
          response.json().then(errorData => Promise.reject(errorData.errors || 'Failed to delete letter.'));
        }
      })
      .catch(err => {
        console.error("Delete letter error:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to delete letter. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleEditClick = (letter) => {
    setEditingLetter(letter);
    setTitle(letter.title);
    setContent(letter.content);
    setShowForm(true); 
  };

  const handleCancelEdit = () => {
    setEditingLetter(null);
    setTitle('');
    setContent('');
    setShowForm(false);
    setErrors([]);
  };

  return (
    <div className="container p-6">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Letters Unsent</h2>
      <p className="text-md text-gray-600 mb-8 text-center" style={{ maxWidth: '40rem', margin: '0 auto' }}>
        A private place to write things you can’t say out loud, without the pressure of sending them.
      </p>

      <div className="text-center mb-8">
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary">
          {showForm ? 'Hide Form' : (editingLetter ? 'Edit Letter' : 'Write a New Letter')}
        </button>
      </div>

      {showForm && (
        <div className="card max-w-2xl" style={{ margin: '0 auto 2rem auto' }}>
          <h3 className="text-2xl font-bold text-indigo-700 mb-4 text-center">
            {editingLetter ? 'Edit Your Letter' : 'Write a New Letter'}
          </h3>
          <form onSubmit={handleSubmit} className="form-content">
            <div className="form-group">
              <label htmlFor="title" className="form-label">Title</label>
              <input
                type="text"
                id="title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="A title for your unsent thoughts..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="content" className="form-label">Content</label>
              <textarea
                id="content"
                className="form-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="8"
                required
                placeholder="Pour out your heart here..."
              ></textarea>
            </div>
            {errors.length > 0 && (
              <div className="error-message" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="ml-2">{errors.join(', ')}</span>
              </div>
            )}
            <div className="flex-center" style={{ gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (editingLetter ? 'Updating...' : 'Saving...') : (editingLetter ? 'Update Letter' : 'Save Letter')}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && <p className="text-center text-purple-700 text-lg">Loading letters...</p>}
      {errors.length > 0 && !isLoading && (
        <div className="error-message text-center" role="alert">
          <strong className="font-bold">Error loading letters!</strong>
          <span className="ml-2">{errors.join(', ')}</span>
        </div>
      )}
      {!isLoading && letters.length === 0 && !showForm && (
        <p className="text-center text-gray-600 text-lg">No letters found. Click "Write a New Letter" to get started!</p>
      )}

      {!isLoading && letters.length > 0 && (
        <div className="letters-grid"> 
          {letters.map(letter => (
            <div key={letter.id} className="letter-card card">
              <h3 className="text-xl font-bold text-indigo-700 mb-2">{letter.title}</h3>
              <p className="text-gray-700 text-sm mb-4" style={{ flexGrow: 1 }}>
                {letter.content.substring(0, 150)}{letter.content.length > 150 ? '...' : ''}
              </p>
              <p className="text-gray-500 text-sm">
                Created: {new Date(letter.created_at).toLocaleDateString()}
              </p>
              <div className="letter-card-actions flex-center mt-4" style={{ gap: '0.75rem' }}>
                <button
                  onClick={() => handleEditClick(letter)}
                  className="btn btn-secondary btn-sm" 
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(letter.id)}
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

export default LettersUnsent;
