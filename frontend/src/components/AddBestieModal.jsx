import React, { useState } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const AddBestieModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await apiService.sendBestieRequest(
      phone,
      name,
      message || null
    );
    setLoading(false);

    if (result.success) {
      toast.success('Bestie request sent! 💜');
      onClose();
    } else {
      toast.error(result.error || 'Failed to send request');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display text-text-primary">Add Bestie</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Their name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+61 400 000 000"
              required
            />
            <div className="text-xs text-text-secondary mt-1">
              Include country code (e.g., +61 for Australia)
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input min-h-[80px] resize-none"
              placeholder="Hey! I'd like you to be my safety bestie..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBestieModal;
