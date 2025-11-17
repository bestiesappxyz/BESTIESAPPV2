import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserThreadVote } from '../services/forumService';
import { formatDistanceToNow } from 'date-fns';

const ThreadCard = ({ thread }) => {
  const { user } = useAuth();
  const { voteOnThread, CATEGORY_LABELS, CATEGORY_COLORS, isAdmin } = useForum();
  const [userVote, setUserVote] = useState(null);
  const [localVoteCount, setLocalVoteCount] = useState(thread.voteCount || 0);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const loadUserVote = async () => {
      if (user) {
        const vote = await getUserThreadVote(thread.id, user.uid);
        setUserVote(vote);
      }
    };
    loadUserVote();
  }, [thread.id, user]);

  const handleVote = async (voteValue) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    try {
      // Optimistic update
      const previousVote = userVote;
      const previousCount = localVoteCount;

      if (previousVote === voteValue) {
        // Removing vote
        setUserVote(null);
        setLocalVoteCount(prev => prev - voteValue);
      } else if (previousVote === null) {
        // Adding new vote
        setUserVote(voteValue);
        setLocalVoteCount(prev => prev + voteValue);
      } else {
        // Changing vote
        setUserVote(voteValue);
        setLocalVoteCount(prev => prev + (voteValue * 2)); // Remove old, add new
      }

      const result = await voteOnThread(thread.id, voteValue);

      // Update with actual result if different from optimistic
      if (result !== userVote) {
        setUserVote(result);
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on error
      setUserVote(userVote);
      setLocalVoteCount(localVoteCount);
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const categoryColor = CATEGORY_COLORS[thread.category] || 'bg-gray-500';
  const categoryLabel = CATEGORY_LABELS[thread.category] || thread.category;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 ${
      thread.isPinned ? 'border-4 border-yellow-400' : ''
    } animate-fade-in`}>
      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className={`p-2 rounded-lg transition-all ${
              userVote === 1
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>

          <div className={`font-bold text-xl ${
            localVoteCount > 0 ? 'text-pink-500' : localVoteCount < 0 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'
          }`}>
            {localVoteCount}
          </div>

          <button
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            className={`p-2 rounded-lg transition-all ${
              userVote === -1
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6 rotate-180" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Thread Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`${categoryColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                  {categoryLabel}
                </span>
                {thread.isPinned && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    📌 Pinned
                  </span>
                )}
                {thread.isLocked && (
                  <span className="bg-gray-400 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    🔒 Locked
                  </span>
                )}
              </div>

              <Link to={`/forum/thread/${thread.id}`}>
                <h2 className="text-2xl font-fredoka font-bold text-gray-800 dark:text-white hover:text-pink-500 dark:hover:text-pink-400 transition-colors line-clamp-2">
                  {thread.title}
                </h2>
              </Link>
            </div>
          </div>

          {/* Preview */}
          <p className="text-gray-600 dark:text-gray-300 font-quicksand line-clamp-2 mb-4">
            {thread.content.substring(0, 200)}
            {thread.content.length > 200 ? '...' : ''}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 font-quicksand">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {thread.authorAvatar ? (
                  <img
                    src={thread.authorAvatar}
                    alt={thread.authorName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {thread.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold">{thread.authorName}</span>
              </div>

              <span>•</span>
              <span>{formatDate(thread.createdAt)}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{thread.replyCount || 0}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{thread.viewCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCard;
