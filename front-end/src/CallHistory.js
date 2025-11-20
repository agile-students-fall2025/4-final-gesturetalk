// For CallHistory maybe add meeting searching function?
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './CallHistory.css'
import UserContext from './contexts/UserContext';

const CallHistory = () => {
    
    // meeting info
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();
    const { currentUser } = useContext(UserContext);

    // remove this when deploying
    const baseURL = "http://localhost:3001/api"
    const token = localStorage.getItem("authToken")

    useEffect(() => {
        if (!currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);


    // fetch meeting data from backend 
    useEffect(() => {
        const fetchCallHistory = async () => {
            try{
                // fetch call history from backend
                const res = await fetch(`${baseURL}/call-history/`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json', 
                        Authorization: `Bearer ${token}` 
                    },
                });
                const data = await res.json();
                if (data.ok) {
                    // assuming that data inlcudes meetings (an array of meetings) here 
                    setMeetings(data.meetings); 
                    console.log('Call history loaded successfully');
                }
            } catch (err) {
                console.error('Call history fetch error:', err);
            }
        }
        fetchCallHistory();

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
                                    <li key={meeting._id} className="meeting-item">
                                        <div className='meeting-title-wrap'>
                                            <h1 className='meeting-title'>{meeting.meetingName}</h1>
                                        </div>
                                        <div className='log-button-wrap'>
                                            <button className="log-button" onClick={() => handleClick(meeting.meetingId)}>
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