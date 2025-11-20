import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
import './TranslationLog.css'
import UserContext from './contexts/UserContext';

const TranslationLog = () => {

    const { meetingId } = useParams();
    const navigate = useNavigate();

    const [meetingTitle, setMeetingTitle] = useState('');
    const [logData, setLogData] = useState([]);
    const { currentUser } = useContext(UserContext);
    const token = localStorage.getItem("authToken")
    // remove this when deploying
    const baseURL = "http://localhost:3001/api"
    

    useEffect(() => {
        if (!currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);// user not signed in, redirect to sign in

    // use effect to fetch meeting infromation by meetingId
    useEffect(() => {
        // fetch data from backend
        const getTranslationLog = async () => {
            try {
                const res = await fetch(`${baseURL}/translation-log/${meetingId}`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}` 
                    }
                })
                const data = await res.json();
                if (data.ok) {
                    // how do we update here
                    setMeetingTitle(data.meetingName);
                    setLogData(data.translationLogs);
                }
                console.log('Translation Log loaded successfully')
            } catch (err) {
                console.error('Translation Log fetch error:', err);
            }
        }
        getTranslationLog();
    }, []);

    return (
        <div className="translation-log">
            <div className="header">
                <button onClick={() => navigate('/call-history')} className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 79 71" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M31.9527 15.6582C33.2382 16.8135 33.2382 18.6866 31.9527 19.8419L17.8219 32.5417H69.1252C70.9431 32.5417 72.4168 33.8662 72.4168 35.5C72.4168 37.1339 70.9431 38.4584 69.1252 38.4584H17.8219L31.9527 51.1582C33.2382 52.3135 33.2382 54.1866 31.9527 55.3419C30.6672 56.4972 28.5831 56.4972 27.2976 55.3419L7.5476 37.5919C6.26213 36.4366 6.26213 34.5635 7.5476 33.4082L27.2976 15.6582C28.5831 14.5029 30.6672 14.5029 31.9527 15.6582Z" fill="black"/></svg>
                </button>
                <h1 className='title'>{meetingTitle} Translation Log</h1>
            </div>
            <div className="inner-translation-log">
                <div className="log-container">
                    <div className='log-list-container'>

                        {logData.map((entry, index) => {
                            const colorClass = ["color1", "color2"][index % 2];

                            return (
                                <div
                                    key={entry._id}
                                    className={`log-entry ${colorClass}`}
                                >
                                    <div className="entry-header">
                                        <span className="display-name">{entry.senderId}</span>
                                        <span className="timestamp">
                                            {new Date(entry.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="entry-text">{entry.text}</p>
                                </div>
                            );
                        })}

                    </div>
                </div>
            </div>   
        </div>
    );

};

export default TranslationLog;