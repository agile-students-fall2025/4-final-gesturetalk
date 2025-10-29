import './SignIn.css';
import { useNavigate } from "react-router-dom";
import './SignUp';

function SignIn(){
    const navigate = useNavigate();

    const toSignUp = () => {
        navigate("/signup"); 
    };

    return(
        <div id="signin-content">
            <p id="sub">the sign language to text converter meeting app</p>
            <img src='./shuwa.png'/>
            <p id="hook">get started by signing in</p>
            <div id="signin-form">
                <input type='username' placeholder='email'/>
                <input type='password' placeholder='password'/>
                <button>Sign in</button>
                <a onClick={toSignUp}>Getting started? Sign Up Here</a>
            </div>
        </div>
    )
}

export default SignIn;
