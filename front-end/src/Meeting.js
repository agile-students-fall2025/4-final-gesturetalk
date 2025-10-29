import './Meeting.css';
import { useNavigate } from "react-router-dom";

function Meeting(){
    const navigate = useNavigate();

    const endCall = () => {
        navigate("/home"); 
    };

    return(
        <div id="page-content">
            <div id="meeting-section">
                <h1>Meeting Section</h1>
                <div id="video-feed">
                    <h1>Video Feed</h1>
                </div>
                <div id="translation-log">
                <h1>Translation Log</h1>
                </div>
                <div id="meeting-controls">
                    <h1>Meeting Controls</h1>
                    <button>Mute/Unmute</button>
                    <button>Start/Stop Video</button>
                    <button onClick={endCall}>End Call</button>
                </div>
            </div>
            
        </div>
    )

}

export default Meeting;