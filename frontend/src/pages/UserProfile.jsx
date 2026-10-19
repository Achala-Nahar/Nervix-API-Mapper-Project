import React, { useState } from 'react';
import { ArrowLeft, Edit2, Shield, User, Clock, Bell } from 'lucide-react';
import EditProfilePopup from './EditProfilePopup';
import { supabase } from '../supabaseClient';

export default function UserProfile({ userData, onBack, onNavigate }) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate("login");
  };

  const user = {

      name: userData?.fullName || '',
      email: userData?.email || '',
      role: userData?.role || '',
      initials:
        userData?.fullName
          ?.split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase() || '',
      memberSince: 'May 10, 2024',
      timezone: 'Asia/Kolkata',
      language: 'English',
      organization: 'Nervix Inc',
    };

   return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">User Profile</h1>
            </div>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors"
          >
            <Edit2 size={14} />
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl mb-4">
                {user.initials}
              </div>
              <h2 className="text-lg font-semibold text-text-primary">{user.name}</h2>
              <p className="text-sm text-text-muted">{user.email}</p>
              <span className="mt-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">{user.role}</span>
              <div className="mt-4 text-xs text-text-muted flex items-center gap-1">
                <Clock size={12} />
                Member since {user.memberSince}
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: user.name },
                { label: 'Email Address', value: user.email },
                { label: 'Role', value: user.role },
                { label: 'Organization', value: user.organization },
                { label: 'Timezone', value: user.timezone },
                { label: 'Language', value: user.language },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="block text-sm text-text-muted mb-1.5">{label}</label>
                  <input
                    type="text"
                    defaultValue={value}
                    readOnly
                    className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bell size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Email Notifications</div>
                  <div className="text-xs text-text-muted">Receive alerts and updates via email</div>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-dark-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-success" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Two-Factor Authentication</div>
                  <div className="text-xs text-text-muted">Add extra security to your account</div>
                </div>
              </div>
              <button
                onClick={() => setTwoFactor(!twoFactor)}
                className={`w-12 h-6 rounded-full transition-colors relative ${twoFactor ? 'bg-success' : 'bg-dark-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <User size={16} className="text-warning" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Change Password</div>
                  <div className="text-xs text-text-muted">Update your account password</div>
                </div>
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                className="text-sm text-primary hover:underline"
              >
                Change
              </button>
            </div>
            <div>
                <button
                   onClick={handleLogout}
                   className="px-4 py-2 bg-red-600 rounded-lg">
                   Logout
                </button>
            </div>

          </div>
        </div>

        {showEditProfile && <EditProfilePopup onClose={() => setShowEditProfile(false)} />}
      </div>
    );
  }