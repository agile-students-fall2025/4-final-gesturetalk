import "./Profile.css";
import { useNavigate } from "react-router-dom";
import React, { useContext, useState, useEffect } from "react";
import UserContext from './contexts/UserContext';

function Profile() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useContext(UserContext);

  if (!currentUser) {
    navigate("/");
  } // user not signed in, redirect to sign in

  // Local editable copies of profile fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || '');
      setEmail(currentUser.email || '');
    } else {
      setDisplayName('');
      setEmail('');
    }
  }, [currentUser]);

  const handleSave = async () => {
    // Update the app-level user object with edited fields
    const updated = { ...(currentUser || {}), name: displayName, email };
    setCurrentUser(updated);
    try {
      localStorage.setItem('currentUser', JSON.stringify(updated));
    } catch (e) {}
    
    // If password was changed, send update to backend
    if (password) {
      try {
        const res = await fetch('http://localhost:3001/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id || currentUser.email,
            newPassword: password,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          // Clear password field after successful update
          setPassword('');
          console.log('Password updated successfully');
          // Optional: show success message to user
          alert('Password updated successfully');
        } else {
          console.error('Password update failed:', data.error);
          alert('Password update failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Password update error:', err);
        alert('Network error updating password');
      }
    }
    
    console.log('Profile saved');
  };

  const handleLogout = () => {
    // Clear app-level user state
    setCurrentUser(null);

    // Clear any stored user info in localStorage (if used)
    try {
      localStorage.removeItem('currentUser');
    } catch (e) {}

    // If Google Identity Services is loaded, disable auto-select and revoke selection for this user
    try {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // Prevent automatic selection on future visits
        if (typeof window.google.accounts.id.disableAutoSelect === 'function') {
          window.google.accounts.id.disableAutoSelect();
        }

        // Attempt to revoke one-tap selection for this user's email (best-effort)
        if (currentUser && currentUser.email && typeof window.google.accounts.id.revoke === 'function') {
          window.google.accounts.id.revoke(currentUser.email, () => {
            console.log('Google selection revoked for', currentUser.email);
          });
        }
      }
    } catch (err) {
      console.warn('Error calling Google API on logout', err);
    }

    navigate("/");
  };

  const handleEditPictureClick = () => {
    setShowUploadModal(true);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!currentUser || (!currentUser.id && !currentUser.email)) {
      setUploadError('User not authenticated');
      return;
    }

    setUploadLoading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('picture', file);
      // Send either MongoDB ID or email (for Google OAuth users)
      formData.append('userId', currentUser.id || currentUser.email);

      const res = await fetch('http://localhost:3001/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.ok) {
        setUploadError(data.error || 'Upload failed');
        setUploadLoading(false);
        return;
      }

      // Update currentUser with new picture
      const updated = { ...currentUser, picture: data.user.picture };
      setCurrentUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
      setShowUploadModal(false);
      console.log('Profile picture uploaded successfully');
    } catch (err) {
      console.error(err);
      setUploadError('Network error');
    }
    setUploadLoading(false);
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
            <img src={currentUser?.picture || "/profile.svg"} alt="Profile" />
          </div>
          <div id="edit-icon" onClick={handleEditPictureClick} style={{ cursor: 'pointer' }}>
            <img src="https://api.builder.io/api/v1/image/assets/TEMP/7ab26d711e5b1698c187297b382ad3436d9786b9" alt="Edit" />
          </div>
        </div>

        <p id="username">{displayName || 'Username'}</p>

        <input type="text" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {currentUser?.authMethod !== 'google' && (
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <button className="save-btn" onClick={handleSave}>Save</button>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowUploadModal(false)}>✕</button>
            <h2 className="modal-title">Upload Profile Picture</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              disabled={uploadLoading}
              id="file-upload-input"
              style={{ display: 'none' }}
            />
            {uploadError && <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginBottom: '12px' }}>{uploadError}</div>}
            {uploadLoading && <div style={{ color: '#1976d2', fontSize: '0.85rem', marginBottom: '12px' }}>Uploading...</div>}
            <button 
              className="create-btn" 
              onClick={() => document.getElementById('file-upload-input').click()}
              disabled={uploadLoading}
              style={{ marginTop: '20px' }}
            >
              {uploadLoading ? 'Uploading...' : 'Select File'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
