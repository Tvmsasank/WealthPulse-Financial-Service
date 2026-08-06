import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '40px auto', background: '#1E293B', color: '#F8FAFC', borderRadius: '12px', border: '1px solid #EF4444', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#EF4444', marginTop: 0 }}>Something went wrong loading the app</h2>
          <pre style={{ background: '#0F172A', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', color: '#FCA5A5' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button
            style={{ marginTop: '16px', padding: '10px 20px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
