import './SignIn.css';
import React, { useContext, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import UserContext from './contexts/UserContext';

function SignIn(){
        const navigate = useNavigate();
        const { setCurrentUser } = useContext(UserContext);
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);

        const toSignUp = () => {
                navigate("/signup"); 
        };

        const toHome = () => {
                navigate("/home"); 
        };

        const handleEmailSignIn = async () => {
            if (!email || !password) { setError('Enter email and password'); return; }
            setLoading(true); setError('');
            try {
                const res = await fetch('http://localhost:3001/api/auth/signin', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!data.ok) { setError(data.error || 'Sign in failed'); setLoading(false); return; }
                
                // store jwt token
                const token = data.token;
                if (token) {
                    localStorage.setItem('authToken', token); 
                }
                
                setCurrentUser(data.user);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                navigate('/home');
            } catch (e) {
                console.error(e);
                setError('Network error');
                setLoading(false); 
            }
        };

        const checkPass = () => {
             // need to check email and password from db!!!
             // if no match, err message is "no account associated with email"
             // if pass no match email, err msg is "incorrect password"
             // ^ on that note must make err msg element & edit Sign in btn onClick checkPass
        };

        // on success from @react-oauth/google
        const handleGoogleSuccess = async (credentialResponse) => {
            try {
                const googleToken = credentialResponse?.credential;
                if (!googleToken) return console.warn('No credential returned from Google');
                
                // send Google token to your backend
                const res = await fetch("http://localhost:3001/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ googleToken })
                });
                
                const data = await res.json();
                if (!data.ok) {
                    console.error("Google backend login failed:", data.error);
                    setError("Google login failed");
                    return;
                }

                const { user, token } = data;

                setCurrentUser(user);
                // persist a minimal user object so profile can survive reloads (optional)
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem("token", token);
                
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
                                <input id='usernameInput' type='email' placeholder='email' value={email} onChange={e=>setEmail(e.target.value)} />
                                <input type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} />
                                {error && <div style={{color:'red', fontSize:12}}>{error}</div>}
                                <button onClick={handleEmailSignIn} disabled={loading}>{loading? 'Signing in...':'Sign in'}</button>
                                <a onClick={toSignUp}>Getting started? Sign Up Here</a>

                                <div style={{ marginTop: 12 }}>
                                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
                                </div>
                        </div>
                </div>
        )
}

export default SignIn;
