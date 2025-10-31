import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

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

  return (
    <div className="home-container">
      <header>
        <h1 className="logo">shuwa</h1>
        <div className="profile">
          <img src="/profile.jpg" alt="Profile" />
          <span>Username</span>
        </div>
      </header>

      <main>
        <div className="greeting">
          <p className="hello">
            Hello <span className="user">User</span>,
          </p>
          <p className="subtext">Great to see you back!</p>
        </div>

        <div className="content">
          {/* Left card */}
          <div className="card meeting-card">
            <div
              className="meeting-option"
              onClick={() => navigate("/meeting")}
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
              onClick={() => navigate("/join")}
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
    </div>
  );
}
