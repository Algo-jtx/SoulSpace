import React, { useState, useEffect } from 'react';

function LoopBreaker() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const fetchNewPrompt = () => {
    setIsLoading(true);
    setErrors([]);
    setPrompt(''); 

    fetch('/loop_breaker/prompt')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors || `Server responded with status: ${response.status}`));
      })
      .then(data => {
        setPrompt(data.prompt);
      })
      .catch(err => {
        console.error("Error fetching loop breaker prompt:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to load a prompt. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchNewPrompt();
  }, []);

  return (
    <div className="container p-6 flex-column flex-center" style={{ minHeight: '60vh' }}>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Loop Breaker</h2>
      <p className="text-md text-gray-600 mb-8 text-center max-w-2xl home-subtitle">
        A gentle redirection when you find yourself caught in repetitive thought patterns.
      </p>

      <div className="card max-w-2xl form-modal-spacing text-center">
        {isLoading ? (
          <p className="text-xl text-purple-700 font-semibold">Generating prompt...</p>
        ) : errors.length > 0 ? (
          <div className="error-message" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="ml-2">{errors.join(', ')}</span>
          </div>
        ) : prompt ? (
          <p className="text-xl text-gray-800 font-medium">{prompt}</p>
        ) : (
          <p className="text-xl text-gray-600">Click the button to get a new prompt.</p>
        )}
      </div>

      <div className="text-center mt-6">
        <button onClick={fetchNewPrompt} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Breaking...' : 'Break Loop'}
        </button>
      </div>
    </div>
  );
}

export default LoopBreaker;
