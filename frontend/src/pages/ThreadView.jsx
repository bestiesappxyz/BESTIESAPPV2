import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../contexts/ForumContext';
import {
  getThread,
  getReplies,
  updateReply,
  getUserThreadVote,
  getUserReplyVote
} from '../services/forumService';
import { formatDistanceToNow } from 'date-fns';

const ThreadView = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    voteOnThread,
    voteOnReply,
    createReply,
    deleteReply,
    deleteThread,
    togglePinThread,
    toggleLockThread,
    isAdmin,
    CATEGORY_LABELS,
    CATEGORY_COLORS
  } = useForum();

  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySortBy, setReplySortBy] = useState('oldest');
  const [submitting, setSubmitting] = useState(false);
  const [userThreadVote, setUserThreadVote] = useState(null);
  const [userReplyVotes, setUserReplyVotes] = useState({});
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadThread();
  }, [threadId]);

  useEffect(() => {
    if (thread) {
      loadReplies();
    }
  }, [thread, replySortBy]);

  const loadThread = async () => {
    setLoading(true);
    setError(null);
    try {
      const threadData = await getThread(threadId);
      setThread(threadData);

      // Load user's vote
      if (user) {
        const vote = await getUserThreadVote(threadId, user.uid);
        setUserThreadVote(vote);
      }
    } catch (err) {
      console.error('Error loading thread:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const repliesData = await getReplies(threadId, replySortBy);
      setReplies(repliesData);

      // Load user's votes for all replies
      if (user) {
        const votes = {};
        for (const reply of repliesData) {
          const vote = await getUserReplyVote(threadId, reply.id, user.uid);
          votes[reply.id] = vote;
        }
        setUserReplyVotes(votes);
      }
    } catch (err) {
      console.error('Error loading replies:', err);
    }
  };

  const handleVoteThread = async (voteValue) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const result = await voteOnThread(threadId, voteValue);
      setUserThreadVote(result);
      await loadThread(); // Reload to get updated counts
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleVoteReply = async (replyId, voteValue) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const result = await voteOnReply(threadId, replyId, voteValue);
      setUserReplyVotes(prev => ({ ...prev, [replyId]: result }));
      await loadReplies(); // Reload to get updated counts
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;

    if (!user) {
      alert('Please sign in to reply');
      return;
    }

    if (thread.isLocked && !isAdmin()) {
      alert('This thread is locked');
      return;
    }

    setSubmitting(true);
    try {
      await createReply(threadId, { content: replyContent });
      setReplyContent('');
      await loadReplies();
      await loadThread(); // Refresh thread to update reply count
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Error submitting reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReply = async (replyId) => {
    if (!editContent.trim()) return;

    try {
      await updateReply(threadId, replyId, { content: editContent });
      setEditingReplyId(null);
      setEditContent('');
      await loadReplies();
    } catch (error) {
      console.error('Error editing reply:', error);
      alert('Error editing reply. Please try again.');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      await deleteReply(threadId, replyId);
      await loadReplies();
      await loadThread(); // Refresh to update reply count
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Error deleting reply. Please try again.');
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm('Are you sure you want to delete this thread? This cannot be undone.')) return;

    try {
      await deleteThread(threadId);
      navigate('/forum');
    } catch (error) {
      console.error('Error deleting thread:', error);
      alert('Error deleting thread. Please try again.');
    }
  };

  const handleTogglePin = async () => {
    try {
      await togglePinThread(threadId, !thread.isPinned);
      await loadThread();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleToggleLock = async () => {
    try {
      await toggleLockThread(threadId, !thread.isLocked);
      await loadThread();
    } catch (error) {
      console.error('Error toggling lock:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-6 rounded-2xl text-center">
            <p className="font-quicksand font-semibold mb-4">Error: {error || 'Thread not found'}</p>
            <button
              onClick={() => navigate('/forum')}
              className="px-6 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all"
            >
              Back to Forum
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[thread.category] || 'bg-gray-500';
  const categoryLabel = CATEGORY_LABELS[thread.category] || thread.category;
  const isThreadAuthor = user?.uid === thread.authorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
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

        {/* Thread */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-start gap-6 mb-6">
            {/* Vote Section */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleVoteThread(1)}
                className={`p-3 rounded-xl transition-all ${
                  userThreadVote === 1
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-100'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              <div className={`font-bold text-2xl ${
                (thread.voteCount || 0) > 0 ? 'text-pink-500' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {thread.voteCount || 0}
              </div>

              <button
                onClick={() => handleVoteThread(-1)}
                className={`p-3 rounded-xl transition-all ${
                  userThreadVote === -1
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`${categoryColor} text-white text-sm font-semibold px-4 py-1 rounded-full`}>
                  {categoryLabel}
                </span>
                {thread.isPinned && (
                  <span className="bg-yellow-400 text-yellow-900 text-sm font-semibold px-4 py-1 rounded-full">
                    📌 Pinned
                  </span>
                )}
                {thread.isLocked && (
                  <span className="bg-gray-400 text-gray-900 text-sm font-semibold px-4 py-1 rounded-full">
                    🔒 Locked
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-fredoka font-bold text-gray-800 dark:text-white mb-4">
                {thread.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 font-quicksand mb-6">
                <div className="flex items-center gap-2">
                  {thread.authorAvatar ? (
                    <img
                      src={thread.authorAvatar}
                      alt={thread.authorName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                      {thread.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-gray-800 dark:text-white">{thread.authorName}</span>
                </div>
                <span>•</span>
                <span>{formatDate(thread.createdAt)}</span>
                <span>•</span>
                <span>{thread.viewCount || 0} views</span>
              </div>

              <div className="prose dark:prose-invert max-w-none font-quicksand text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {thread.content}
              </div>

              {/* Thread Images */}
              {thread.images && thread.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {thread.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Attachment ${idx + 1}`}
                      className="rounded-xl max-w-full h-auto"
                    />
                  ))}
                </div>
              )}

              {/* Moderation Tools */}
              {(isThreadAuthor || isAdmin()) && (
                <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {isAdmin() && (
                    <>
                      <button
                        onClick={handleTogglePin}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all text-sm font-quicksand"
                      >
                        {thread.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={handleToggleLock}
                        className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all text-sm font-quicksand"
                      >
                        {thread.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDeleteThread}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm font-quicksand"
                  >
                    Delete Thread
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-fredoka font-bold text-gray-800 dark:text-white">
              Replies ({replies.length})
            </h2>
            <select
              value={replySortBy}
              onChange={(e) => setReplySortBy(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none font-quicksand"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="top">Top Voted</option>
            </select>
          </div>

          {/* Reply Form */}
          {user && !thread.isLocked && (
            <form onSubmit={handleSubmitReply} className="mb-8">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-400 dark:focus:border-purple-500 focus:outline-none font-quicksand resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-quicksand font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          )}

          {thread.isLocked && !isAdmin() && (
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-4 rounded-xl text-center font-quicksand mb-8">
              🔒 This thread is locked. No new replies can be added.
            </div>
          )}

          {!user && (
            <div className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 p-4 rounded-xl text-center font-quicksand mb-8">
              <Link to="/login" className="font-semibold underline">Sign in</Link> to reply to this thread.
            </div>
          )}

          {/* Replies List */}
          <div className="space-y-6">
            {replies.map((reply) => {
              const isReplyAuthor = user?.uid === reply.authorId;
              const isEditing = editingReplyId === reply.id;

              return (
                <div
                  key={reply.id}
                  className="flex gap-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleVoteReply(reply.id, 1)}
                      className={`p-2 rounded-lg transition-all ${
                        userReplyVotes[reply.id] === 1
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-pink-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </button>

                    <div className={`font-bold ${
                      (reply.voteCount || 0) > 0 ? 'text-pink-500' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {reply.voteCount || 0}
                    </div>

                    <button
                      onClick={() => handleVoteReply(reply.id, -1)}
                      className={`p-2 rounded-lg transition-all ${
                        userReplyVotes[reply.id] === -1
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      <svg className="w-5 h-5 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </div>

                  {/* Reply Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {reply.authorAvatar ? (
                        <img
                          src={reply.authorAvatar}
                          alt={reply.authorName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                          {reply.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-gray-800 dark:text-white font-quicksand">
                        {reply.authorName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>

                    {isEditing ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:outline-none font-quicksand resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditReply(reply.id)}
                            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all text-sm font-quicksand"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditContent('');
                            }}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 transition-all text-sm font-quicksand"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 dark:text-gray-300 font-quicksand whitespace-pre-wrap">
                          {reply.content}
                        </p>

                        {reply.images && reply.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {reply.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Reply attachment ${idx + 1}`}
                                className="rounded-lg max-w-full h-auto"
                              />
                            ))}
                          </div>
                        )}

                        {(isReplyAuthor || isAdmin()) && (
                          <div className="flex gap-2 mt-3">
                            {isReplyAuthor && (
                              <button
                                onClick={() => {
                                  setEditingReplyId(reply.id);
                                  setEditContent(reply.content);
                                }}
                                className="text-sm text-pink-500 hover:text-pink-600 font-quicksand"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReply(reply.id)}
                              className="text-sm text-red-500 hover:text-red-600 font-quicksand"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {replies.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 font-quicksand py-8">
                No replies yet. Be the first to reply!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
