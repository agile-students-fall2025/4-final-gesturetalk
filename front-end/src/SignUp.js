import './SignUp.css';
import { useNavigate } from "react-router-dom";
import { useState, useContext } from 'react';
import UserContext from './contexts/UserContext';

function SignUp(){
    const navigate = useNavigate();
    const { setCurrentUser } = useContext(UserContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toSignIn = () => {
        navigate("/"); 
    };

    const handleSignUp = async () => {
        if (!email || !password || !name) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!data.ok) {
                setError(data.error || 'Sign up failed');
                setLoading(false);
                return;
            }

            // Automatically sign in the user after signup
            setCurrentUser(data.user);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            navigate('/home');
        } catch (err) {
            console.error('Sign up error:', err);
            setError('Network error or server unavailable');
            setLoading(false);
        }
    };

    return(
        <div id="signup-content">
            <img src="./shuwaWsub.png"/>
            <div id="signup-form">
                <h1>Sign Up</h1>
                <input 
                    id='dNameInput' 
                    type='text' 
                    placeholder='display name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input 
                    type='email' 
                    placeholder='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input 
                    type='password' 
                    placeholder='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input 
                    type='password' 
                    placeholder='confirm password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
                <button id="signUpBtn" onClick={handleSignUp} disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </div>
            <a id='returnHomeBtn' onClick={toSignIn}>&lt;  Return to Sign In</a>
        </div>
    )

}

export default SignUp;