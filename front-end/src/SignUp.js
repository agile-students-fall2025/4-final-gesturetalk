import './SignUp.css';
import { useNavigate } from "react-router-dom";
import { useContext, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import UserContext from './contexts/UserContext';

function SignUp(){
    const navigate = useNavigate();
    const { setCurrentUser } = useContext(UserContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toSignIn = () => { navigate('/'); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { setError('Please fill all fields'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('http://localhost:3001/api/auth/signup', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!data.ok) { setError(data.error || 'Signup failed'); setLoading(false); return; }
            
            // store jwt token
            const token = data.token;
            if (token) {
                localStorage.setItem('authToken', token);
            }

            setCurrentUser(data.user);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            navigate('/home');
        } catch (err) { console.error(err); setError('Network error'); setLoading(false); }
    }

    return(
        <div id="signup-content">
            <img src="./shuwaWsub.png"/>
            <form id="signup-form" onSubmit={handleSubmit}>
                <h1>Sign Up</h1>
                <input id='dNameInput' type='text' placeholder='display name' value={name} onChange={e=>setName(e.target.value)} />
                <input type='email' placeholder='email' value={email} onChange={e=>setEmail(e.target.value)} />
                <input type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} />
                <input type='password' placeholder='confirm password' value={confirm} onChange={e=>setConfirm(e.target.value)} />
                {error && <div style={{color:'red', fontSize:12}}>{error}</div>}
                <button id="signUpBtn" type='submit' disabled={loading}>{loading? 'Creating...':'Create Account'}</button>
                <button id="googleBtn" type='button'>Sign Up with Google</button>
            </form>
            <a id='returnHomeBtn' onClick={toSignIn}>&lt;  Return to Sign In</a>
        </div>
    )

}

export default SignUp;