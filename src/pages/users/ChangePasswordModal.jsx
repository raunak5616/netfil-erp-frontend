import React, { useState, useEffect } from 'react';
import { changeUserPassword } from '../../services/userService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { FormField, Input } from '../../components/ui/FormField';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

const ChangePasswordModal = ({ user, isOpen, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const validate = () => {
    if (!newPassword) {
      return 'New password is required.';
    }
    if (newPassword.length < 6) {
      return 'New password must be at least 6 characters long.';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match. Please re-enter passwords.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await changeUserPassword(user._id, { newPassword });
      if (res.success) {
        setSuccessMessage(`Password updated successfully for account '${user.username}'!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Failed to update user password.';
      setErrorMessage(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Change Password — ${user.username}`}
      maxWidth="460px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Update Password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        )}

        {successMessage && (
          <Alert type="success" message={successMessage} />
        )}

        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 mb-2">
          <KeyRound size={20} className="text-amber-600 shrink-0" />
          <div>
            <strong>Administrator Reset:</strong> Setting a new password will instantly override access credentials for user <code className="font-bold text-amber-900">{user.username}</code>.
          </div>
        </div>

        {/* New Password */}
        <FormField label="New Password" required helperText="Must be at least 6 characters">
          <div style={{ position: 'relative' }}>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={submitting}
              autoFocus
              style={{ paddingRight: '36px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--neutral-500)',
                padding: '4px',
              }}
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        {/* Confirm Password */}
        <FormField label="Confirm Password" required helperText="Re-type new password to confirm">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
