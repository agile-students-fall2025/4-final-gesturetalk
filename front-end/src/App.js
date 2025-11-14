import './App.css';
import React, { useState, useEffect } from 'react';
import SignIn from './SignIn';
import SignUp from "./SignUp";
import CallHistory from './CallHistory';
import TranslationLog from './TranslationLog';
import Meeting from './Meeting';
import Home from './Home';
import Profile from './Profile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import UserContext from './contexts/UserContext';

const GOOGLE_CLIENT_ID = '701676482246-gb7dhjv31hpm0ekr3agiucbei4bm5ivv.apps.googleusercontent.com';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Rehydrate user from localStorage so Google login persists across reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.warn('Failed to rehydrate currentUser from localStorage', e);
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <UserContext.Provider value={{ currentUser, setCurrentUser }}>
        <Router>
          <Routes>
            {/* sign in's the first page users land on */}
            <Route path="/" element={<div className="App"><SignIn /></div>} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/call-history" element={<CallHistory/>} />
            <Route path="/translation-log/:meetingId" element={<TranslationLog/>} />
            <Route path="/meeting/:meetingId" element={<Meeting/>} />
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            {/* to add: unique meeting page routes to ID */}
          </Routes>
        </Router>
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default App;
