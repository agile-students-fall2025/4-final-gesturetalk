import './SignUp.css';
import { useNavigate } from "react-router-dom";

function SignUp(){
    const navigate = useNavigate();

    const toSignIn = () => {
        navigate("/"); 
    };

    return(
        <div id="signup-content">
            <img src="./shuwaWsub.png"/>
            <div id="signup-form">
                <h1>Sign Up</h1>
                <input id='dNameInput' type='text' placeholder='display name'/>
                <input type='username' placeholder='email'/>
                <input type='password' placeholder='password'/>
                <input type='password' placeholder='confirm password'/>
                <button id="signUpBtn">Create Account</button>
                <button id="googleBtn">Sign Up with Google</button>
            </div>
            <a id='returnHomeBtn' onClick={toSignIn}>&lt;  Return to Sign In</a>
        </div>
    )

}

export default SignUp;