import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { createMeeting, joinMeeting } from "./services/meetingServices";
import UserContext from './contexts/UserContext';

export default function Home() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [meetingName, setMeetingName] = useState("");
  const [meetingCode, setMeetingCode] = useState("Code-123");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { currentUser } = useContext(UserContext);

  //  Update time + date
  useEffect(() => {
    function updateClock() {
      const timeEl = document.getElementById("time");
      const dateEl = document.getElementById("date");

      if (!timeEl || !dateEl) return;

      const now = new Date();
      const hours12 = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      const day = now.toLocaleDateString("en-US", { weekday: "long" });
      const month = now.toLocaleDateString("en-US", { month: "long" });
      const dayNum = now.getDate();

      timeEl.textContent = `${hours12}:${minutes} ${ampm}`;
      dateEl.textContent = `${day}, ${month} ${dayNum}`;
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingCode);
  };

  const handleJoin = async () => {
    try{
      const res = await joinMeeting(meetingCode);
      if (!res.ok) {
        throw new Error("Invalid meeting");
      }
      const data = await res.json();
      const meetingId = data.meetingId; 
      setShowJoinModal(false);
      alert(`Joining meeting: ${meetingId}`);
      navigate(`/meeting/${meetingId}`);

    } catch (err){
      console.error(err);
      alert("Invalid meeting code");
    }
  };

  return (
    <div className="home-container">
      <header>
        <h1 className="logo">shuwa</h1>
        <div className="profile" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
          <img src={currentUser?.picture || "/profile.svg"} alt="Profile" />
          <span>{currentUser?.name || 'Username'}</span>
        </div>
      </header>

      <main>
        <div className="greeting">
          <p className="hello">
            Hello <span className="user">{currentUser?.name || 'User'}</span>,
          </p>
          <p className="subtext">Great to see you back!</p>
        </div>

        <div className="content">
          {/* Left card */}
          <div className="card meeting-card">
            <div className="meeting-option" 
                onClick={() => setShowModal(true)}
            >

              <img
                src="/createmeeting.svg"
                alt="Create Meeting"
                className="option-icon"
              />
              <p>Create Meeting</p>
            </div>

            
            <div
              className="meeting-option"
              onClick={() => setShowJoinModal(true)}
            >
              <img
                src="/joinmeeting.svg"
                alt="Join Meeting"
                className="option-icon"
              />
              <p>Join Meeting</p>
            </div>

            <div
              className="meeting-option"
              onClick={() => navigate("/call-history")}
            >
              <img
                src="/callhistory.svg"
                alt="Call History"
                className="option-icon"
              />
              <p>Call History</p>
            </div>
          </div>

          {/* Right card */}
          <div className="card time-card">
            <h2 id="time">--:-- --</h2>
            <p id="date">Loading...</p>
          </div>
        </div>
      </main>

       {/* --- Modal --- */}
       {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()} // prevent background close
          >
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ✕
            </button>
            <h2 className="modal-title">Create Meeting</h2>

            <form action="/home/create" method="POST">
              <input
                type="text"
                className="modal-input"
                placeholder="Set Meeting Name"
                name="meetingName"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
              />

              <p className="modal-label">Meeting Code</p>
              <div className="code-box">
                <input type="text" readOnly name="meetingCode" value={meetingCode} />
                <button className="copy-btn" onClick={handleCopy}>
                <img src="/copy.svg" alt="Copy" className="copy-icon" />
                </button>
              </div>

            </form>

            <button
              className="create-btn"
              onClick={() => {
                alert(`Meeting "${meetingName}" created!`);
                setShowModal(false);
              }}
            >
              Create Meeting
            </button>
          </div>
        </div>
      )}

      
      {/* --- Join Meeting Modal --- */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowJoinModal(false)}>
              ✕
            </button>
            <h2 className="modal-title">Join Meeting</h2>

            <form action="/home/join" method="POST">
              <input
                type="text"
                className="modal-input"
                placeholder="Enter Meeting Code"
                name="meetingCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
            </form>

            <button
              className="create-btn"
              onClick={() => {
                if (!joinCode.trim()) {
                  alert("Please enter a meeting code.");
                } else {
                  handleJoin();
                }
              }}
            >
              Join Meeting
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
