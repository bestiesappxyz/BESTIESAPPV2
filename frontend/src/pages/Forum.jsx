import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import ThreadCard from '../components/ThreadCard';

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    threads,
    loading,
    error,
    stats,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    loadThreads,
    loadStats,
    CATEGORIES,
    CATEGORY_LABELS,
    CATEGORY_COLORS,
    SORT_OPTIONS
  } = useForum();

  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(localSearch);
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories', color: 'bg-gradient-to-r from-pink-500 to-purple-500' },
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      value: key,
      label,
      color: CATEGORY_COLORS[key]
    }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-fredoka font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
            BESTIES Forum
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-quicksand">
            Connect, share ideas, and help shape the future of BESTIES
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex justify-center gap-6 mt-6 flex-wrap">
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-lg">
                <div className="text-2xl font-bold text-pink-500">{stats.totalThreads}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Threads</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-lg">
                <div className="text-2xl font-bold text-purple-500">{stats.totalReplies}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Replies</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-lg">
                <div className="text-2xl font-bold text-blue-500">{stats.totalViews}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search threads..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full px-6 py-4 pr-12 rounded-2xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-pink-400 dark:focus:border-purple-500 focus:outline-none shadow-lg transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Filters and Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap justify-center">
            {categoryOptions.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl font-quicksand font-semibold transition-all ${
                  selectedCategory === cat.value
                    ? `${cat.color} text-white shadow-lg scale-105`
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
                }`}
              >
                {cat.label}
                {cat.value !== 'all' && stats?.categoryStats?.[cat.value] && (
                  <span className="ml-2 opacity-75">({stats.categoryStats[cat.value]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.value)}
              className="px-4 py-2 rounded-xl border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none font-quicksand"
            >
              <option value={SORT_OPTIONS.RECENT}>Recent</option>
              <option value={SORT_OPTIONS.TOP}>Top Voted</option>
            </select>

            <button
              onClick={() => navigate('/forum/new')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-xl font-quicksand font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              New Thread
            </button>
          </div>
        </div>

        {/* Thread List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-6 rounded-2xl text-center">
            <p className="font-quicksand font-semibold">Error: {error}</p>
            <button
              onClick={() => loadThreads()}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
            >
              Retry
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-quicksand text-lg mb-4">
              No threads found in this category.
            </p>
            <button
              onClick={() => navigate('/forum/new')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-xl font-quicksand font-semibold hover:shadow-lg transition-all"
            >
              Create the first thread!
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;
