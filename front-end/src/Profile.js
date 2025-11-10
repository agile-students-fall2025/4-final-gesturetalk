import "./Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const handleSave = () => {
    console.log("Profile saved");
  };

  return (
    <div id="profile-content">
      <svg id="gradient-blob" width="1130" height="1024" viewBox="0 0 1130 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_f_164_18)">
          <path fillRule="evenodd" clipRule="evenodd" d="M1042.11 519.452C1017.13 572.13 960.641 599.772 917.84 639.336C879.644 674.644 850.204 721.158 802.224 741.195C754.548 761.105 700.953 746.306 649.549 751.377C590.993 757.153 531.253 795.158 476.624 773.315C422.616 751.72 398.252 689.074 368.56 639.023C340.906 592.408 318.408 543.376 308.582 490.054C298.825 437.103 294.423 381.561 311.718 330.561C328.645 280.646 368.927 243.771 405.094 205.449C439.861 168.61 475.012 131.897 520.397 109.444C566.605 86.5831 618.02 81.6188 669.109 74.8315C727.034 67.1359 792.166 36.2312 842.015 66.7155C892.787 97.7648 879.976 179.752 916.96 226.402C955.287 274.744 1035.14 284.124 1059.38 340.875C1083.15 396.551 1068.06 464.731 1042.11 519.452Z" fill="url(#paint0_linear_164_18)"/>
        </g>
        <defs>
          <filter id="filter0_f_164_18" x="0" y="-246.463" width="1371.26" height="1326.49" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_164_18"/>
          </filter>
          <linearGradient id="paint0_linear_164_18" x1="1048.42" y1="519.117" x2="311.664" y2="328.577" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ECDBF2"/>
            <stop offset="1" stopColor="#D2ABE7"/>
          </linearGradient>
        </defs>
      </svg>

      <p id="logo">shuwa</p>

      <div id="profile-card">
        <button className="close-btn" onClick={() => navigate("/home")}>
          ✕
        </button>
        <h2 id="profile-title">My Profile</h2>

        <div id="profile-image-container">
          <div id="profile-image">
            <img src="/profile.svg" alt="Profile" />
          </div>
          <div id="edit-icon">
            <img src="https://api.builder.io/api/v1/image/assets/TEMP/7ab26d711e5b1698c187297b382ad3436d9786b9" alt="Edit" />
          </div>
        </div>

        <p id="username">Username</p>

        <input type="text" placeholder="Display Name" />
        <input type="text" placeholder="Email" />
        <input type="password" placeholder="Password" />

        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

export default Profile;
