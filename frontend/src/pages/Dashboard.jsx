import React from 'react';
export default function Dashboard({ onNavigate }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => onNavigate("menu")}>Go to Menu</button>
    </div>
  );
}

