import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 

const TranslationLog = () => {
    const { meetingIdOld } = useParams();
    const meetingId = Number(meetingIdOld);
    const navigate = useNavigate();
    const [meetingTitle, setMeetingTitle] = useState('');
    const [logData, setLogData] = useState([]);

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
                }
            ],
        };

        setMeetingTitle(tempLogs.title);
        setLogData(tempLogs.logs);

    }, [meetingId]);

    return (
        <div className="translation-log">
            <button className="back-btn" onClick={() => navigate('/call-history')}>back</button>
            <h1>{meetingTitle} Translation Log</h1>
            <div className="log-container">
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
    );

};

export default TranslationLog;