import './SignIn.css';
import { useNavigate } from "react-router-dom";

function SignIn(){
    const navigate = useNavigate();

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
            </div>
        </div>
    )
}

export default SignIn;
