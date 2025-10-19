import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPasswordChangeModal = ({ user, token, onPasswordChanged, onSkip }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate current password
    if (!currentPassword) {
      setErrors({ current: 'Please enter your current password' });
      return;
    }

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setErrors({ new: passwordErrors });
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      setErrors({ new: ['New password must be different from current password'] });
      return;
    }

    setLoading(true);

    try {
      // In production, this should call your backend API
      // const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     currentPassword,
      //     newPassword
      //   })
      // });

      // For now, simulate successful password change
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage that password has been changed
      localStorage.setItem('adminPasswordChanged', 'true');

      toast.success('Password changed successfully! 🔒', {
        duration: 4000,
        icon: '✅'
      });

      onPasswordChanged();
    } catch (error) {
      toast.error('Failed to change password. Please try again.');
      setErrors({ general: 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    // Store that user skipped password change
    localStorage.setItem('adminPasswordChangeSkipped', 'true');
    toast('You can change your password later from Settings', {
      icon: '⚠️',
      duration: 4000
    });
    onSkip();
  };

  const getPasswordStrength = (password) => {
    const errors = validatePassword(password);
    if (!password) return { strength: 0, label: '', color: '' };
    if (errors.length === 0) return { strength: 100, label: 'Strong', color: 'bg-green-500' };
    if (errors.length <= 2) return { strength: 60, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 30, label: 'Weak', color: 'bg-red-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleSkipForNow()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Security Alert</h2>
                  <p className="text-red-100">Change Your Default Password</p>
                </div>
              </div>
              <button
                onClick={handleSkipForNow}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Warning Message */}
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Default Password Detected</h3>
                <p className="text-sm text-red-800">
                  You're using the default password <code className="px-2 py-0.5 bg-red-100 rounded font-mono">admin@001</code>. 
                  For security reasons, please change it immediately to protect your admin account.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter admin@001"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.current ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.current && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{errors.current}</span>
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong password"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.new ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Password Strength</span>
                      <span className={`text-xs font-bold ${
                        passwordStrength.strength === 100 ? 'text-green-600' :
                        passwordStrength.strength >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {errors.new && (
                  <div className="mt-2 space-y-1">
                    {errors.new.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.confirm ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="mt-2 text-sm text-green-600 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Passwords match</span>
                  </p>
                )}
                {errors.confirm && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{errors.confirm}</span>
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Password Requirements:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>At least 8 characters long</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>One uppercase letter (A-Z)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>One lowercase letter (a-z)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>One number (0-9)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>One special character (!@#$%^&*)</span>
                  </li>
                </ul>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{errors.general}</span>
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Changing Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSkipForNow}
                  disabled={loading}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Skip for Now
                </button>
              </div>

              {/* Skip Warning */}
              <p className="text-xs text-gray-500 text-center">
                By skipping, you acknowledge the security risk of using the default password. 
                You can change it later from System Settings.
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminPasswordChangeModal;
