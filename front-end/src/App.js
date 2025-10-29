import './App.css';
import SignIn from './SignIn';
import SignUp from "./SignUp";
import CallHistory from './CallHistory';
import TranslationLog from './TranslationLog';
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
        </Routes>
      </Router>
    </>
    
  );
}

export default App;
