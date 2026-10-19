import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

export default function EditProfilePopup({ onClose }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Edit Profile</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl">
                KS
              </div>
              <button className="text-xs text-primary hover:underline transition-colors">
                Change Photo
              </button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-text-secondary mb-1.5">Full Name</label>
                <input
                  type="text"
                  defaultValue="Krishna Singh"
                  className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-text-secondary mb-1.5">Email Address</label>
                <input
                  type="email"
                  defaultValue="krishna@example.com"
                  className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Role</label>
                <select className="w-full appearance-none px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
                  <option>Administrator</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Organization</label>
                <input
                  type="text"
                  defaultValue="Nervix Inc"
                  className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Timezone</label>
                <select className="w-full appearance-none px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
                  <option>Asia/Kolkata</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Language</label>
                <select className="w-full appearance-none px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-dark-border pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Change Password</h3>
            <div className="space-y-3">
              {[
                { label: 'Current Password', show: showCurrent, setShow: setShowCurrent, placeholder: 'Enter current password' },
                { label: 'New Password', show: showNew, setShow: setShowNew, placeholder: 'Enter new password' },
                { label: 'Confirm New Password', show: showConfirm, setShow: setShowConfirm, placeholder: 'Confirm new password' },
              ].map(({ label, show, setShow, placeholder }) => (
                <div key={label}>
                  <label className="block text-sm text-text-secondary mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 pr-10 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
