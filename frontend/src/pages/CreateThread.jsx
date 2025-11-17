import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../contexts/ForumContext';

const CreateThread = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createThread, CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, isAdmin } = useForum();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: CATEGORIES.GENERAL,
    tags: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (formData.category === CATEGORIES.ANNOUNCEMENT && !isAdmin()) {
      setError('Only admins can create announcements');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newThread = await createThread(formData);
      navigate(`/forum/thread/${newThread.id}`);
    } catch (err) {
      console.error('Error creating thread:', err);
      setError(err.message || 'Error creating thread. Please try again.');
      setSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const categoryOptions = Object.entries(CATEGORY_LABELS)
    .filter(([key]) => key !== CATEGORIES.ANNOUNCEMENT || isAdmin())
    .map(([key, label]) => ({
      value: key,
      label,
      color: CATEGORY_COLORS[key]
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 font-quicksand font-semibold mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Forum
        </Link>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-fredoka font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
            Create New Thread
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-quicksand">
            Share your thoughts, ideas, or questions with the community
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-quicksand font-semibold mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter a descriptive title..."
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-400 dark:focus:border-purple-500 focus:outline-none font-quicksand"
                required
              />
              <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/200
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-quicksand font-semibold mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryOptions.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-4 rounded-xl font-quicksand font-semibold transition-all ${
                      formData.category === cat.value
                        ? `${cat.color} text-white shadow-lg scale-105`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Category Descriptions */}
              <div className="mt-4 p-4 bg-pink-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm font-quicksand text-gray-600 dark:text-gray-300">
                  {formData.category === CATEGORIES.GENERAL && (
                    <>💬 <strong>General:</strong> Casual discussions about BESTIES</>
                  )}
                  {formData.category === CATEGORIES.FEATURE_REQUEST && (
                    <>💡 <strong>Feature Request:</strong> Suggest new features and vote on ideas</>
                  )}
                  {formData.category === CATEGORIES.BUG_REPORT && (
                    <>🐛 <strong>Bug Report:</strong> Report issues or bugs you've encountered</>
                  )}
                  {formData.category === CATEGORIES.HELP && (
                    <>❓ <strong>Help:</strong> Ask for help or support from the community</>
                  )}
                  {formData.category === CATEGORIES.ANNOUNCEMENT && (
                    <>📢 <strong>Announcement:</strong> Official announcements (admins only)</>
                  )}
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-quicksand font-semibold mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your post here... You can use plain text or markdown formatting."
                rows={12}
                maxLength={50000}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-400 dark:focus:border-purple-500 focus:outline-none font-quicksand resize-none"
                required
              />
              <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.content.length}/50000
              </div>

              {/* Formatting Tips */}
              <div className="mt-2 p-3 bg-purple-50 dark:bg-gray-700 rounded-xl">
                <p className="text-xs font-quicksand text-gray-600 dark:text-gray-300">
                  <strong>Formatting Tips:</strong> Use **bold** for emphasis, create lists with dashes (-), and add code blocks with backticks (`)
                </p>
              </div>
            </div>

            {/* Tags (Optional) */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-quicksand font-semibold mb-2">
                Tags (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tags..."
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-400 dark:focus:border-purple-500 focus:outline-none font-quicksand"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all font-quicksand font-semibold"
                >
                  Add
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-sm font-quicksand flex items-center gap-2"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-pink-500 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-xl font-quicksand">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-quicksand font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Thread'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/forum')}
                disabled={submitting}
                className="px-8 py-4 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-quicksand font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-fredoka font-bold text-gray-800 dark:text-white mb-4">
            Community Guidelines
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 font-quicksand">
            <li className="flex items-start gap-2">
              <span className="text-pink-500">✓</span>
              Be respectful and kind to all community members
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">✓</span>
              Use clear, descriptive titles that reflect your post content
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">✓</span>
              Choose the most appropriate category for your thread
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">✓</span>
              Search for existing threads before creating duplicates
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">✓</span>
              Vote on feature requests to help prioritize development
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateThread;
