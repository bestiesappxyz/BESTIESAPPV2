import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';

const BadgesPage = () => {
  const { currentUser } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [badgeStats, setBadgeStats] = useState({});
  const [loading, setLoading] = useState(true);

  const allBadges = [
    // Guardian Badges (people who added you)
    { 
      id: 'guardian_1', 
      name: 'Guardian Sprout', 
      category: 'guardian', 
      tier: 1,
      requirement: 1,
      icon: '🌱',
      description: '1 person trusts you to watch over them'
    },
    { 
      id: 'guardian_5', 
      name: 'Guardian Bloom', 
      category: 'guardian', 
      tier: 2,
      requirement: 5,
      icon: '🌸',
      description: '5 people trust you to watch over them'
    },
    { 
      id: 'guardian_10', 
      name: 'Guardian Tree', 
      category: 'guardian', 
      tier: 3,
      requirement: 10,
      icon: '🌳',
      description: '10 people trust you - you\'re a pillar of safety!'
    },

    // Bestie Badges (total besties)
    { 
      id: 'besties_3', 
      name: 'Friend Squad', 
      category: 'besties', 
      tier: 1,
      requirement: 3,
      icon: '💕',
      description: 'You have 3 besties'
    },
    { 
      id: 'besties_5', 
      name: 'Safety Circle', 
      category: 'besties', 
      tier: 2,
      requirement: 5,
      icon: '💖',
      description: 'You completed your safety circle!'
    },
    { 
      id: 'besties_10', 
      name: 'Safety Network', 
      category: 'besties', 
      tier: 3,
      requirement: 10,
      icon: '💝',
      description: 'You have a full safety network!'
    },

    // Check-in Badges
    { 
      id: 'checkin_5', 
      name: 'Safety Starter', 
      category: 'checkins', 
      tier: 1,
      requirement: 5,
      icon: '⭐',
      description: '5 completed check-ins'
    },
    { 
      id: 'checkin_25', 
      name: 'Safety Pro', 
      category: 'checkins', 
      tier: 2,
      requirement: 25,
      icon: '🌟',
      description: '25 completed check-ins'
    },
    { 
      id: 'checkin_50', 
      name: 'Safety Master', 
      category: 'checkins', 
      tier: 3,
      requirement: 50,
      icon: '✨',
      description: '50 completed check-ins - you\'re a pro!'
    },

    // Donor Badges
    { 
      id: 'donor_first', 
      name: 'Kind Heart', 
      category: 'donor', 
      tier: 1,
      requirement: 1,
      icon: '💗',
      description: 'Made your first donation'
    },
    { 
      id: 'donor_25', 
      name: 'Generous Soul', 
      category: 'donor', 
      tier: 2,
      requirement: 25,
      icon: '💓',
      description: 'Donated $25 total'
    },
    { 
      id: 'donor_100', 
      name: 'Champion', 
      category: 'donor', 
      tier: 3,
      requirement: 100,
      icon: '👑',
      description: 'Donated $100+ - you\'re a legend!'
    },
  ];

  useEffect(() => {
    loadBadges();
  }, [currentUser]);

  const loadBadges = async () => {
    if (!currentUser) return;

    try {
      const badgesDoc = await getDoc(doc(db, 'badges', currentUser.uid));
      if (badgesDoc.exists()) {
        const data = badgesDoc.data();
        setEarnedBadges(data.badges || []);
        setBadgeStats(data.stats || {});
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading badges:', error);
      setLoading(false);
    }
  };

  const earnedBadgeIds = earnedBadges.map(b => b.id);

  const categories = {
    guardian: { name: 'Guardian', color: 'from-blue-400 to-cyan-500' },
    besties: { name: 'Besties', color: 'from-pink-400 to-purple-500' },
    checkins: { name: 'Check-ins', color: 'from-green-400 to-emerald-500' },
    donor: { name: 'Supporter', color: 'from-yellow-400 to-orange-500' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Your Badges</h1>
          <p className="text-text-secondary">
            Collect badges by using Besties and helping keep people safe!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="card p-6 mb-6">
          <h2 className="font-display text-xl text-text-primary mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-display text-blue-500">
                {badgeStats.guardianCount || 0}
              </div>
              <div className="text-sm text-text-secondary">People Protected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-pink-500">
                {badgeStats.bestiesCount || 0}
              </div>
              <div className="text-sm text-text-secondary">Total Besties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-green-500">
                {badgeStats.checkinCount || 0}
              </div>
              <div className="text-sm text-text-secondary">Check-ins Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-yellow-500">
                ${badgeStats.donationTotal || 0}
              </div>
              <div className="text-sm text-text-secondary">Donated</div>
            </div>
          </div>
        </div>

        {/* Badge Categories */}
        {Object.entries(categories).map(([categoryKey, category]) => {
          const categoryBadges = allBadges.filter(b => b.category === categoryKey);
          const earnedCount = categoryBadges.filter(b => earnedBadgeIds.includes(b.id)).length;

          return (
            <div key={categoryKey} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display text-text-primary">
                  {category.name} Badges
                </h2>
                <div className="badge badge-primary">
                  {earnedCount}/{categoryBadges.length}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {categoryBadges.map((badge) => {
                  const isEarned = earnedBadgeIds.includes(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={`card p-4 text-center transition-all ${
                        isEarned
                          ? `bg-gradient-to-br ${category.color} text-white`
                          : 'opacity-50 grayscale'
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <div className={`font-semibold text-sm mb-1 ${isEarned ? 'text-white' : 'text-text-primary'}`}>
                        {badge.name}
                      </div>
                      <div className={`text-xs mb-2 ${isEarned ? 'text-white/80' : 'text-text-secondary'}`}>
                        {badge.description}
                      </div>
                      {!isEarned && (
                        <div className="text-xs font-semibold text-primary">
                          Need {badge.requirement}
                        </div>
                      )}
                      {isEarned && (
                        <div className="text-xs font-semibold text-white">
                          Tier {badge.tier}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Total Progress */}
        <div className="card p-6 bg-gradient-primary text-white text-center">
          <div className="text-4xl font-display mb-2">
            {earnedBadges.length}/{allBadges.length}
          </div>
          <div className="text-lg">Badges Collected</div>
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${(earnedBadges.length / allBadges.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgesPage;
