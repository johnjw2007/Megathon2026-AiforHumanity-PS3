import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import './index.css'
import { setupGlobalFetchInterceptor } from './services/mockBackend.js'

// Initialize resilient API interceptor for local, cloud, and standalone Vercel environments
setupGlobalFetchInterceptor();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-950 text-red-400 font-mono text-xs min-h-screen">
          <h2 className="text-lg font-bold text-red-500 mb-2">AeroGuard Console Encountered a Render Error</h2>
          <div className="bg-slate-900 border border-red-500/40 p-4 rounded mb-4 text-white">
            {this.state.error && this.state.error.toString()}
          </div>
          <pre className="text-[11px] text-slate-400 overflow-auto max-h-96">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-sky-500 text-black font-bold px-4 py-2 rounded"
          >
            Reload Console
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
  </React.StrictMode>,
)
