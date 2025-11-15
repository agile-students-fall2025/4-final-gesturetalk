import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
import './TranslationLog.css'
import UserContext from "./contexts/UserContext";

const TranslationLog = () => {
    const { meetingIdOld } = useParams();
    const meetingId = Number(meetingIdOld);
    const navigate = useNavigate();
    const [meetingTitle, setMeetingTitle] = useState('');
    const [logData, setLogData] = useState([]);
    const { currentUser } = useContext(UserContext);


    // use effect to fetch meeting infromation by meetingId
    useEffect(() => {
        // dummy data
        const tempLogs = {
            title: 'Meeting Name 01',
            logs: [
                {
                    id: 1,
                    displayName: 'Display Name_1',
                    time: '00:01:57',
                    text: 'Hello.',
                    isSender: true,
                },
                {
                    id: 2,
                    displayName: 'Display Name_2',
                    time: '00:03:27',
                    text: "Hi! What’s your favorite color?",
                    isSender: false,
                },
                {
                    id: 3,
                    displayName: 'Display Name_1',
                    time: '00:05:27',
                    text: "My favorite color is probably pink. Not the super bright kind, more like that pastel shade that looks like sunset or strawberry milk. It just feels cozy, like something you’d want around you when you’re in a good mood. What about you?",
                    isSender: true,
                },
                {
                    id: 4,
                    displayName: 'Display Name_2',
                    time: '00:06:21',
                    text: "My favorite color is blue because it’s kind of peaceful but not boring. It reminds me of the sky right before sunset or when you’re near the water and everything feels quiet for a second. I don’t know, it just feels easy to like.",
                    isSender: false,
                },
                {
                    id: 5,
                    displayName: 'Display Name_1',
                    time: '00:06:27',
                    text: "My favorite color is blue b",
                    isSender: true,
                },
                {
                    id: 6,
                    displayName: 'Display Name_2',
                    time: '00:06:40',
                    text: "Oh wow thanks for sharing.",
                    isSender: false,
                },
                {
                    id: 5,
                    displayName: 'Display Name_1',
                    time: '00:06:27',
                    text: "My favorite color is blue b",
                    isSender: true,
                },
                {
                    id: 6,
                    displayName: 'Display Name_2',
                    time: '00:06:40',
                    text: "Oh wow thanks for sharing.",
                    isSender: false,
                },
                {
                    id: 5,
                    displayName: 'Display Name_1',
                    time: '00:06:27',
                    text: "My favorite color is blue b",
                    isSender: true,
                },
                {
                    id: 6,
                    displayName: 'Display Name_2',
                    time: '00:06:40',
                    text: "Oh wow thanks for sharing.",
                    isSender: false,
                },
                {
                    id: 5,
                    displayName: 'Display Name_1',
                    time: '00:06:27',
                    text: "My favorite color is blue b",
                    isSender: true,
                },
                {
                    id: 6,
                    displayName: 'Display Name_2',
                    time: '00:06:40',
                    text: "Oh wow thanks for sharing.",
                    isSender: false,
                },
                {
                    id: 5,
                    displayName: 'Display Name_1',
                    time: '00:06:27',
                    text: "My favorite color is blue b",
                    isSender: true,
                },
                {
                    id: 6,
                    displayName: 'Display Name_2',
                    time: '00:06:40',
                    text: "Oh wow thanks for sharing.",
                    isSender: false,
                }
            ],
        };

        setMeetingTitle(tempLogs.title);
        setLogData(tempLogs.logs);

    }, [meetingId]);

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
                        {logData.map((entry) => (
                        <div
                            key={entry.id}
                            className={`log-entry ${entry.isSender ? 'sender' : 'receiver'}`}
                        >
                            <div className="entry-header">
                                <span className="display-name">{entry.displayName}</span>
                                <span className="timestamp">{entry.time}</span>
                            </div>
                            <p className="entry-text">{entry.text}</p>
                        </div>
                        ))}
                    </div>
                </div>
            </div>   
        </div>
    );

};

export default TranslationLog;