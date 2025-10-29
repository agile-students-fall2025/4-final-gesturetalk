import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './CallHistory.css'

const CallHistory = () => {
    
    // meeting info
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);


    // fetch meeting data from backend (update later)
    useEffect(() => {
        // dummy data
        const tempData = [
            { id: 1, title: 'Meeting Name 01', date: '2025-10-25T09:00:00Z', duration: 45 },
            { id: 2, title: 'Meeting Name 02', date: '2025-10-26T11:30:00Z', duration: 60 },
            { id: 3, title: 'Meeting Name 03', date: '2025-10-27T14:00:00Z', duration: 30 },
            { id: 4, title: 'Meeting Name 04', date: '2025-10-28T10:00:00Z', duration: 90 },
            { id: 5, title: 'Meeting Name 05', date: '2025-10-29T16:00:00Z', duration: 25 },
            { id: 6, title: 'Meeting Name 06', date: '2025-10-30T09:30:00Z', duration: 40 },
            { id: 7, title: 'Meeting Name 07', date: '2025-11-01T13:00:00Z', duration: 55 },
            { id: 8, title: 'Meeting Name 08', date: '2025-11-02T15:30:00Z', duration: 35 },
            { id: 9, title: 'Meeting Name 09', date: '2025-11-03T12:00:00Z', duration: 70 },
        ];
        
        setMeetings(tempData);

    }, []);

    const handleClick = (meetingId) => {
        navigate(`/translation-log/${meetingId}`);
    }

    const handleBack = () => {
        navigate(`/home}`);
    }

    return (
        <div>
            <button onclick={handleBack}></button>
            <h1 className="title">Call History</h1>
            <div className="meetinglistbox">
                {meetings.length === 0 ? (
                    <p>No calls found.</p>
                ):(
                    <ul>
                        {meetings.map((meeting) => (
                            <li key={meeting.id} className="meeting-item">
                                <h1>{meeting.title}</h1>
                                <button onclick={() => handleClick(meeting.id)}>
                                    Translation Log
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CallHistory;