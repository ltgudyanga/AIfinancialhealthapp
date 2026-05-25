'use client';

import { useEffect } from 'react';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);
    color: #f1f5f9;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
  }
  .bg-grid {
    background-image: 
      linear-gradient(to right, rgba(59, 130, 246, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    position: fixed;
    inset: 0;
    z-index: -1;
  }
  .glass-panel {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 2rem;
    padding: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  }
  .glass-input {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #f1f5f9;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    width: 100%;
    font-size: 0.875rem;
  }
  .glass-input:focus:not(:disabled) {
    border-color: #3b82f6;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    outline: none;
    background: rgba(30, 41, 59, 0.8);
  }
  .stat-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 58, 138, 0.2) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 1rem;
    padding: 1.25rem;
    transition: all 0.3s ease;
  }
  .stat-card:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
  }
  .animate-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  /* Add all other utility classes from the previous style block */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .gap-2 { gap: 0.5rem; }
  .p-4 { padding: 1rem; }
  /* ... etc ... include all classes from the long list */
`;

export default function StylesInjector() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = styles;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}