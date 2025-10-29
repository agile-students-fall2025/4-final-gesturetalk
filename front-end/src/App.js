import './App.css';
import SignIn from './SignIn';
import SignUp from "./SignUp";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          {/* sign in's the first page users land on */}
          <Route path="/" element={<div className="App"><SignIn /></div>} />
        </Routes>
      </Router>
    </>
    
  );
}

export default App;
