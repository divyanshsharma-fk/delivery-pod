import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PODSubmission from './components/PODSubmission';
import AdminView from './components/AdminView';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [driver, setDriver] = useState(null);
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('pod_driver');
    if (saved) {
      try {
        setDriver(JSON.parse(saved));
        setScreen('dashboard');
      } catch {
        localStorage.removeItem('pod_driver');
      }
    }
  }, []);

  const handleLogin = (driverData) => {
    localStorage.setItem('pod_driver', JSON.stringify(driverData));
    setDriver(driverData);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('pod_driver');
    setDriver(null);
    setScreen('login');
  };

  const handleSelectPoint = (point, assignment) => {
    setSelectedData({ point, assignment });
    setScreen('pod');
  };

  const handlePODDone = () => {
    setSelectedData(null);
    setScreen('dashboard');
  };

  switch (screen) {
    case 'admin':
      return <AdminView onBack={() => setScreen('login')} />;
    case 'login':
      return <Login onLogin={handleLogin} onAdmin={() => setScreen('admin')} />;
    case 'dashboard':
      return (
        <Dashboard
          driver={driver}
          onSelectPoint={handleSelectPoint}
          onLogout={handleLogout}
        />
      );
    case 'pod':
      return (
        <PODSubmission
          driver={driver}
          point={selectedData.point}
          assignment={selectedData.assignment}
          onDone={handlePODDone}
        />
      );
    default:
      return <Login onLogin={handleLogin} onAdmin={() => setScreen('admin')} />;
  }
}
