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
    // Save name to database
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/profile/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: currentUser.id || currentUser.email,
          name: displayName,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Update local state with response from server
        const updated = { ...currentUser, name: data.user.name };
        setCurrentUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        console.log('Profile name saved to database');
      } else {
        console.error('Profile update failed:', data.error);
        alert('Failed to save profile: ' + (data.error || 'Unknown error'));
        return;
      }
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Network error saving profile');
      return;
    }
    
    // If password was changed, send update to backend
    if (password) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/update-password`, {
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

      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/profile/upload`, {
        method: 'POST',
        headers,
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
      <header id="profile-header">
        <h1 className="logo1" id="logoHome1">shuwa</h1>
      </header>

      <div id="profile-card">
        
        <button className="close-btn" id="profileCloseBtn" onClick={() => navigate("/home")}>
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

        <button className="save-btn" id="profileSaveBtn" onClick={handleSave}>Save</button>
        <button className="logout-btn" id="profileLogoutBtn" onClick={handleLogout}>Logout</button>
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
