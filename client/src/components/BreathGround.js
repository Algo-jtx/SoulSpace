import React, { useState, useEffect } from 'react';

function BreathGround() {
  const [techniques, setTechniques] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const fetchTechniques = () => {
    setIsLoading(true);
    setErrors([]);

    fetch('/breath_ground')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => Promise.reject(errorData.errors || `Server responded with status: ${response.status}`));
      })
      .then(data => {
        setTechniques(data.techniques || []); 
      })
      .catch(err => {
        console.error("Error fetching breath & ground techniques:", err);
        setErrors(Array.isArray(err) ? err : ['Failed to load techniques. Please try again.']);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTechniques();
  }, []);

  return (
    <div className="container p-6">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Breath & Ground</h2>
      <p className="text-md text-gray-600 mb-8 text-center max-w-2xl home-subtitle">
        Simple techniques to help you calm your mind and connect with the present moment.
      </p>

      {isLoading && <p className="text-center text-purple-700 text-lg">Loading techniques...</p>}
      {errors.length > 0 && !isLoading && (
        <div className="error-message text-center" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="ml-2">{errors.join(', ')}</span>
        </div>
      )}
      {!isLoading && techniques.length === 0 && errors.length === 0 && (
        <p className="text-center text-gray-600 text-lg">No techniques available at the moment.</p>
      )}

      {!isLoading && techniques.length > 0 && (
        <div className="techniques-grid letters-grid">
          {techniques.map((technique, index) => (
            <div key={index} className="technique-card card">
              <h3 className="text-xl font-bold text-indigo-700 mb-2">{technique.name}</h3>
              <p className="text-gray-700 text-sm mb-2">{technique.instructions}</p>
              <p className="text-gray-500 text-sm technique-duration">Duration: {technique.duration}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BreathGround;
