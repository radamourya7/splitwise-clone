import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const Placeholder = ({ title }) => <div className="p-8 flex justify-center items-center h-screen bg-gray-50"><h1 className="text-3xl font-bold text-gray-400">{title} Component Placeholder</h1></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><Placeholder title="Group Detail" /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<div className="p-8 text-center mt-20"><h1 className="text-4xl font-bold text-gray-800">404</h1><p className="text-gray-500 mt-2">Page not found</p></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
