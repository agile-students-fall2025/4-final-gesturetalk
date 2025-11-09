import './App.css';
import SignIn from './SignIn';
import SignUp from "./SignUp";
import CallHistory from './CallHistory';
import TranslationLog from './TranslationLog';
import Meeting from './Meeting';
import Home from './Home';
import Profile from './Profile';
import DummyGestureCall from './DummyGestureCall';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
        <Routes>
           {/* sign in's the first page users land on */}
          <Route path="/" element={<div className="App"><SignIn /></div>} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/call-history" element={<CallHistory/>} />
          <Route path="/translation-log/:meetingId" element={<TranslationLog/>} />
          <Route path="/meeting" element={<Meeting />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          {/* to add: unique meeting page routes to ID */}
          <Route path="/dummy" element={<DummyGestureCall />} />
        </Routes>
      </Router>
    </>

  );
}

export default App;
