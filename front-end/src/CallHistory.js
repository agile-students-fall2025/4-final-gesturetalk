// For CallHistory maybe add meeting searching function?
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './CallHistory.css'

const CallHistory = () => {
    
    // meeting info
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

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
        navigate(`/home`);
    }

    return (
        <div className='call-history'>
            <div className="header">
                <button onClick={handleBack} className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 79 71" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M31.9527 15.6582C33.2382 16.8135 33.2382 18.6866 31.9527 19.8419L17.8219 32.5417H69.1252C70.9431 32.5417 72.4168 33.8662 72.4168 35.5C72.4168 37.1339 70.9431 38.4584 69.1252 38.4584H17.8219L31.9527 51.1582C33.2382 52.3135 33.2382 54.1866 31.9527 55.3419C30.6672 56.4972 28.5831 56.4972 27.2976 55.3419L7.5476 37.5919C6.26213 36.4366 6.26213 34.5635 7.5476 33.4082L27.2976 15.6582C28.5831 14.5029 30.6672 14.5029 31.9527 15.6582Z" fill="black"/></svg>
                </button>
                <h1 className="title">Call History</h1>
            </div>
            <div className="inner-call-history">
                <div className="meeting-box">
                    <div className="meeting-list-box">
                        {meetings.length === 0 ? (
                            <p>No calls found.</p>
                        ):(
                            <ul>
                                {meetings.map((meeting) => (
                                    <li key={meeting.id} className="meeting-item">
                                        <div className='meeting-title-wrap'>
                                            <h1 className='meeting-title'>{meeting.title}</h1>
                                        </div>
                                        <div className='log-button-wrap'>
                                            <button className="log-button" onClick={() => handleClick(meeting.id)}>
                                                Translation Log
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallHistory;