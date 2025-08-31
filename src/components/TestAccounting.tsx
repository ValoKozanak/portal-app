import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestAccounting: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('Navigating to /accounting');
    navigate('/accounting');
  };

  return (
    <div className="p-4">
      <h1>Test Accounting</h1>
      <button 
        onClick={handleClick}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Accounting Navigation
      </button>
    </div>
  );
};

export default TestAccounting;
