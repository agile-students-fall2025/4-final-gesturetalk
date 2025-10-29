import './App.css';
import SignIn from './SignIn';
import SignUp from "./SignUp";
import CallHistory from './CallHistory';
import TranslationLog from './TranslationLog';
import Meeting from './Meeting';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/call-history" element={<CallHistory/>} />
          <Route path="/translation-log/:meetingId" element={<TranslationLog/>} />
          {/* sign in's the first page users land on */}
          <Route path="/" element={<div className="App"><SignIn /></div>} />
          <Route path="/meeting" element={<Meeting />} />
          // to add: unique meeting page routes to ID
        </Routes>
      </Router>
    </>
    
  );
}

export default App;
