import './SignIn.css';
import React, { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import UserContext from './contexts/UserContext';

function SignIn(){
        const navigate = useNavigate();
        const { setCurrentUser } = useContext(UserContext);

        const toSignUp = () => {
                navigate("/signup"); 
        };

        const toHome = () => {
                navigate("/home"); 
        };

        const checkPass = () => {
             // need to check email and password from db!!!
             // if no match, err message is "no account associated with email"
             // if pass no match email, err msg is "incorrect password"
             // ^ on that note must make err msg element & edit Sign in btn onClick checkPass
        };

        // on success from @react-oauth/google
        const handleGoogleSuccess = (credentialResponse) => {
            try {
                const jwt = credentialResponse?.credential;
                if (!jwt) return console.warn('No credential returned from Google');
                const payload = JSON.parse(atob(jwt.split('.')[1]));
                const user = {
                    id: payload.sub,
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture,
                };
                    setCurrentUser(user);
                    // persist a minimal user object so profile can survive reloads (optional)
                    try {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    } catch (e) {}
                navigate('/home');
            } catch (err) {
                console.error('Failed to decode Google credential', err);
            }
        };

        const handleGoogleError = () => {
            console.error('Google sign-in failed');
        };

        return(
                <div id="signin-content">
                        <p id="sub">the sign language to text converter meeting app</p>
                        <img src='./shuwa.png'/>
                        <p id="hook">get started by signing in</p>
                        <div id="signin-form">
                                <input id='usernameInput' type='username' placeholder='email'/>
                                <input type='password' placeholder='password'/>
                                <button onClick={toHome}>Sign in</button>
                                <a onClick={toSignUp}>Getting started? Sign Up Here</a>

                                <div style={{ marginTop: 12 }}>
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
                                </div>
                        </div>
                </div>
        )
}

export default SignIn;
