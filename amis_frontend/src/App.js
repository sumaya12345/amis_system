import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginPage from './LoginPage';
import S1Dashboard from './S1Dashboard';
import S2Dashboard from './S2Dashboard'; 
import S3Dashboard from './S3Dashboard';
import S4Dashboard from './S4Dashboard';
import Horinta1 from './Horinta1'; 
import Horinta2 from './Horinta2'; 
import Horinta3 from './Horinta3'; 
import Horinta4 from './Horinta4'; 
import Urur from './Urur'; 
import MedicalDashboard from './MedicalDashboard'; 
import { initGlobalTheme } from './designSystem';
import AdminApp from './AdminApp';

// Global Axios Request Interceptor
axios.interceptors.request.use((config) => {
  const sessionId = sessionStorage.getItem('sessionId') || localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global Axios Response Interceptor to handle unauthorized access
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isInvalidSession = error.response?.status === 401
      && /session|invalid|expired/i.test(error.response.data?.message || '');
    if (isInvalidSession) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Native navigate helper
  const navigate = (path, replace = false) => {
    if (replace) {
      window.history.replaceState(null, null, path);
    } else {
      window.history.pushState(null, null, path);
    }
    setCurrentPath(path);
  };

  // Popstate event listener for browser navigation (Back/Forward)
  useEffect(() => {
    initGlobalTheme();
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const roleRoutes = {
    'S1': '/s1',
    'S2': '/s2',
    'S3': '/s3',
    'S4': '/s4',
    'H1': '/h1',
    'H2': '/h2',
    'H3': '/h3',
    'H4': '/h4',
    'Urur': '/urur',
    'medic': '/medical',
    'admin': '/admin/dashboard',
  };

  // 1. Function-kan u baas dashboard-yada si qofku marka uu Logout dhoho xogta looga tirtiro browser-ka
  const handleLogout = async () => {
    const sessionId = sessionStorage.getItem('sessionId') || localStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await axios.post('http://localhost:5000/api/logout');
      } catch (e) {}
    }
    sessionStorage.clear();
    localStorage.clear();
    setCurrentUser(null);
    setUserData(null);
    navigate('/login', true);
  };

  const handleLogin = (role, data, sessionId) => {
    // Only use sessionStorage for per-tab session isolation
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('user', JSON.stringify(data));
    sessionStorage.setItem('currentUser', role);
    setUserData(data);
    setCurrentUser(role);

    const targetPath = roleRoutes[role] || '/login';
    navigate(targetPath);
  };

  // 2. Marka uu system-ku dhasho ama refresh dhaco, xaqiiji session-ka backend-ka
  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (sessionId) {
      axios.post('http://localhost:5000/api/verify-session')
        .then(res => {
          if (res.data.success && res.data.user) {
            const savedUser = sessionStorage.getItem('user');
            const parsedUser = savedUser ? JSON.parse(savedUser) : res.data.user;
            setCurrentUser(res.data.user.role);
            setUserData(parsedUser);
          } else {
            handleLogout();
          }
          setIsVerifying(false);
        })
        .catch(() => {
          handleLogout();
          setIsVerifying(false);
        });
    } else {
      setIsVerifying(false);
    }
  }, []);

  // 3. Route constraints enforcement
  useEffect(() => {
    if (isVerifying) return;

    if (!currentUser) {
      if (currentPath !== '/login') {
        navigate('/login', true);
      }
    } else {
      const allowedPath = roleRoutes[currentUser];
      if (allowedPath && currentPath !== allowedPath) {
        navigate(allowedPath, true);
      }
    }
  }, [currentUser, currentPath, isVerifying]);

  // 4. browser Back button / bfcache handler
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        const sessionId = sessionStorage.getItem('sessionId') || localStorage.getItem('sessionId');
        if (!sessionId) {
          window.location.reload();
        }
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // 5. Listen for real-time user updates across all components
  useEffect(() => {
    const handleUserUpdated = (e) => {
      if (e.detail) {
        setUserData(e.detail);
      }
    };
    window.addEventListener('amis_user_updated', handleUserUpdated);
    return () => window.removeEventListener('amis_user_updated', handleUserUpdated);
  }, []);

  if (isVerifying) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif', color: '#1a2a6c' }}>
        <h3>AMIS System Verification...</h3>
      </div>
    );
  }

  // Haddii uusan qofku soo login-gareyn (ama xog laga helin localStorage), tusi bogga Login-ka
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      {currentUser === 'S1' && currentPath === '/s1' && <S1Dashboard user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'medic' && currentPath === '/medical' && <MedicalDashboard user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'S2' && currentPath === '/s2' && <S2Dashboard user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'S3' && currentPath === '/s3' && <S3Dashboard user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'S4' && currentPath === '/s4' && <S4Dashboard user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'H1' && currentPath === '/h1' && <Horinta1 user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'H2' && currentPath === '/h2' && <Horinta2 user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'H3' && currentPath === '/h3' && <Horinta3 user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'H4' && currentPath === '/h4' && <Horinta4 user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'Urur' && currentPath === '/urur' && <Urur user={userData} onLogout={handleLogout} onUpdateUser={setUserData} />}
      {currentUser === 'admin' && currentPath.startsWith('/admin') && <AdminApp currentPath={currentPath} navigate={navigate} onLogout={handleLogout} />}
    </div>
  );
}

export default App;