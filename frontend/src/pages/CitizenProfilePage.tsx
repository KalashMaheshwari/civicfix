import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdaptiveHeader } from '../components/AdaptiveHeader';
import { DesktopRail } from '../components/DesktopRail';
import { MobileDock } from '../components/MobileDock';
import {
  ShieldCheck,
  LogOut,
  Check,
  Search,
  ShieldAlert,
  CheckCircle2,
  Recycle,
  HardHat,
  Medal,
  Lock,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { calculateLevel, computeBadges, LEVEL_TIERS } from '../utils/gamification';
import { PointsIcon } from '../components/StarIcon';

export const CitizenProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [preferences, setPreferences] = useState({
    crewDispatch: true,
    verificationVote: true,
    monthlyDigest: false,
    soundAlerts: true,
    anonymousReporting: false,
    autoGeotag: true,
  });

  const [badgeTab, setBadgeTab] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const points = user?.civic_points ?? 10;
  const levelInfo = useMemo(() => calculateLevel(points), [points]);
  const badges = useMemo(() => computeBadges(user), [user]);

  const filteredBadges = badges.filter((b) => {
    if (badgeTab === 'UNLOCKED') return b.unlocked;
    if (badgeTab === 'LOCKED') return !b.unlocked;
    return true;
  });

  const verifiedReports = user?.verified_reports_count ?? 0;
  const verifiedVotes = user?.verifications_count ?? 0;
  const reputation = user?.reputation_score ?? 100;
  const impactScore = user?.impact_score ?? 0;
  const commutersAssisted = user?.commuters_assisted ?? ((verifiedReports * 80) + (verifiedVotes * 25));

  const getBadgeVisuals = (iconType: string, unlocked: boolean) => {
    const size = 20;
    switch (iconType) {
      case 'detective':
        return {
          icon: <Search size={size} color={unlocked ? '#0284C7' : '#94A3B8'} />,
          bg: unlocked ? '#E0F2FE' : '#F1F5F9',
          border: unlocked ? '#7DD3FC' : '#CBD5E1',
          accent: '#0284C7',
          tag: 'INVESTIGATIVE AUDIT',
        };
      case 'alert':
        return {
          icon: <ShieldAlert size={size} color={unlocked ? '#DC2626' : '#94A3B8'} />,
          bg: unlocked ? '#FEE2E2' : '#F1F5F9',
          border: unlocked ? '#FCA5A5' : '#CBD5E1',
          accent: '#DC2626',
          tag: 'HAZARD EARLY WARNING',
        };
      case 'verifier':
        return {
          icon: <CheckCircle2 size={size} color={unlocked ? '#059669' : '#94A3B8'} />,
          bg: unlocked ? '#D1FAE5' : '#F1F5F9',
          border: unlocked ? '#6EE7B7' : '#CBD5E1',
          accent: '#059669',
          tag: 'COMMUNITY SIGN-OFF',
        };
      case 'eco':
        return {
          icon: <Recycle size={size} color={unlocked ? '#16A34A' : '#94A3B8'} />,
          bg: unlocked ? '#DCFCE7' : '#F1F5F9',
          border: unlocked ? '#86EFAC' : '#CBD5E1',
          accent: '#16A34A',
          tag: 'SANITATION & DRAINAGE',
        };
      case 'road':
        return {
          icon: <HardHat size={size} color={unlocked ? '#D97706' : '#94A3B8'} />,
          bg: unlocked ? '#FEF3C7' : '#F1F5F9',
          border: unlocked ? '#FCD34D' : '#CBD5E1',
          accent: '#D97706',
          tag: 'PUBLIC WORKS & ROADS',
        };
      case 'guardian':
      default:
        return {
          icon: <Medal size={size} color={unlocked ? '#7C3AED' : '#94A3B8'} />,
          bg: unlocked ? '#EDE9FE' : '#F1F5F9',
          border: unlocked ? '#C4B5FD' : '#CBD5E1',
          accent: '#7C3AED',
          tag: 'CIVIC HONORS MASTERY',
        };
    }
  };

  return (
    <div className="app-layout" style={{ background: 'var(--bg-canvas, #EEF5FB)', minHeight: '100vh' }}>
      <DesktopRail />

      <main className="app-stage" style={{ background: 'transparent' }}>
        <AdaptiveHeader />

        <div className="stage-container" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 60 }}>
          {/* ─── 1. EXECUTIVE CITIZEN CREDENTIAL CARD (TOP HERO) ─── */}
          <div
            style={{
              position: 'relative',
              background: '#FFFFFF',
              border: '1px solid #D0E0EF',
              borderRadius: 14,
              padding: '24px 28px',
              marginBottom: 20,
              boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Top Security Line Accents */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: '#0284C7',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              {/* Left Identity Lockup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src="/citizen.png"
                    alt="Citizen"
                    style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      background: '#059669',
                      border: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Aadhaar & GPS Geo-verified"
                  >
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                      {user?.full_name || 'Resident'}
                    </h1>
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ShieldCheck size={12} color="#059669" /> Verified Resident
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <img src="/location.png" alt="Ward" style={{ width: 14, height: 14, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <strong>Ward-04</strong> (Sector B, South Delhi)
                    </span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#64748B' }}>#{user?.id ? user.id.substring(0, 8).toUpperCase() : 'CF-7489'}</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#64748B' }}>{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Right Level & Points Lockup */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    CURRENT LEVEL {levelInfo.level}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                    {levelInfo.title}
                  </div>
                </div>

                <div style={{ width: 1, height: 36, background: '#E2E8F0' }} />

                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    CIVIC BALANCE
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0284C7', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <PointsIcon size={20} />
                    <span>{points.toLocaleString()}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Level XP Linear Road Track */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>
                  Advancing toward <strong>Level {levelInfo.level + 1} ({LEVEL_TIERS[levelInfo.level]?.title || 'Zonal Inspector'})</strong>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#0284C7', fontWeight: 700 }}>
                  {points} / {levelInfo.nextLevelPoints} pts ({levelInfo.progressPercent}% achieved)
                </span>
              </div>
              <div style={{ height: 8, width: '100%', background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${levelInfo.progressPercent}%`,
                    background: '#0284C7',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ─── 2. RADIAL TRUST GAUGES & CITIZEN IMPACT METRICS ─── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Metric 1: Reputation Trust Score */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #D0E0EF',
                padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Circular Radial Gauge */}
              <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3.2"
                    strokeDasharray={`${reputation}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: '#059669',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {reputation}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reputation Trust Index
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {verifiedReports > 0 || verifiedVotes > 0 ? 'Verified Genuine' : 'Identity Verified'}
                </div>
                <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 1 }}>
                  {verifiedReports > 0 || verifiedVotes > 0
                    ? `${verifiedReports} Reports • 0 Disputes`
                    : 'Clean Resident Standing'}
                </div>
              </div>
            </div>

            {/* Metric 2: Community Impact Score */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #D0E0EF',
                padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={impactScore > 0 ? '#D97706' : '#94A3B8'}
                    strokeWidth="3.2"
                    strokeDasharray={`${impactScore || 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: impactScore > 0 ? '#D97706' : '#94A3B8',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {impactScore}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Community Impact Score
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {impactScore >= 75
                    ? 'High Remediation Impact'
                    : impactScore >= 30
                    ? 'Active Ward Contributor'
                    : impactScore > 0
                    ? 'Emerging Contributor'
                    : 'New Resident Contributor'}
                </div>
                <div style={{ fontSize: 11.5, color: '#D97706', fontWeight: 600, marginTop: 1 }}>
                  {impactScore > 0
                    ? `~${commutersAssisted.toLocaleString()} Commuters Assisted`
                    : 'File first issue to earn impact'}
                </div>
              </div>
            </div>

            {/* Metric 3: Verified Filings */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #D0E0EF',
                padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: '#EFF6FF',
                  border: '1px solid #BAE6FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={22} color="#0284C7" />
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI-Verified Filings
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {verifiedReports} <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Issues</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                  100% Geo-tagged Precision
                </div>
              </div>
            </div>

            {/* Metric 4: Resolution Sign-offs */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #D0E0EF',
                padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={22} color="#059669" />
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sign-Off Audits Cast
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {verifiedVotes} <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Votes</span>
                </div>
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 1 }}>
                  Zero Dispute Overturns
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. OFFICIAL SERVICE HONORS & BADGES (INTERACTIVE GRID) ─── */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #D0E0EF',
              padding: '24px',
              marginBottom: 20,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                marginBottom: 18,
                paddingBottom: 14,
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Award size={16} color="#0284C7" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    MUNICIPAL SERVICE HONORS
                  </span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Civic Recognition Badges
                </h2>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  Granted automatically as you file high-precision evidence and audit contractor repair proofs.
                </div>
              </div>

              {/* Segmented Filter Pills */}
              <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBadgeTab(tab)}
                    style={{
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      background: badgeTab === tab ? '#FFFFFF' : 'transparent',
                      color: badgeTab === tab ? '#0F172A' : '#64748B',
                      boxShadow: badgeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab === 'ALL' ? `All Badges (${badges.length})` : tab === 'UNLOCKED' ? `Awarded (${badges.filter((b) => b.unlocked).length})` : `In Progress (${badges.filter((b) => !b.unlocked).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: 14,
              }}
            >
              {filteredBadges.map((badge) => {
                const visuals = getBadgeVisuals(badge.icon, badge.unlocked);
                return (
                  <div
                    key={badge.id}
                    style={{
                      background: badge.unlocked ? '#FFFFFF' : '#F8FAFC',
                      border: `1px solid ${visuals.border}`,
                      borderRadius: 10,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: badge.unlocked ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Badge Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 10,
                              background: visuals.bg,
                              border: `1px solid ${visuals.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {visuals.icon}
                          </div>

                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                              {badge.name}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: visuals.accent, letterSpacing: '0.04em' }}>
                              {visuals.tag}
                            </div>
                          </div>
                        </div>

                        {badge.unlocked ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: '#ECFDF5',
                              color: '#065F46',
                              border: '1px solid #A7F3D0',
                              padding: '2px 7px',
                              borderRadius: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Check size={10} strokeWidth={3} /> EARNED
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: '#F1F5F9',
                              color: '#64748B',
                              border: '1px solid #CBD5E1',
                              padding: '2px 7px',
                              borderRadius: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Lock size={10} /> IN PROGRESS
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.45, margin: '4px 0 12px' }}>
                        {badge.description}
                      </p>
                    </div>

                    {/* Progress Bar for In-Progress badges */}
                    {badge.maxProgress && badge.maxProgress > 1 && (
                      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>
                          <span>Completion Progress</span>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>
                            {badge.progress} / {badge.maxProgress}
                          </span>
                        </div>
                        <div style={{ height: 6, width: '100%', background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.round(((badge.progress || 0) / badge.maxProgress) * 100))}%`,
                              background: badge.unlocked ? visuals.accent : '#0284C7',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── 4. RECENT VERIFIED CIVIC POINT EVENTS ─── */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #D0E0EF',
              padding: '22px 24px',
              marginBottom: 20,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#0284C7" />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Recent Verified Point Audits
                </h3>
              </div>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Audit Log ID: 04-DL-2026</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(user?.recent_audits && user.recent_audits.length > 0
                ? user.recent_audits
                : [
                    ...(verifiedReports > 0
                      ? [{
                          action: `${verifiedReports} Civic Hazard${verifiedReports > 1 ? 's' : ''} Verified by AI Vision`,
                          location: 'Designated Ward Area, South Delhi',
                          points: `+${verifiedReports * 20} Pts`,
                          time: 'Active Reports',
                          type: 'positive',
                        }]
                      : []),
                    ...(verifiedVotes > 0
                      ? [{
                          action: `${verifiedVotes} Community Sign-Off Audit${verifiedVotes > 1 ? 's' : ''} Cast`,
                          location: 'Remediated Municipal Works',
                          points: `+${verifiedVotes * 15} Pts`,
                          time: 'Verified Audits',
                          type: 'positive',
                        }]
                      : []),
                    {
                      action: 'Aadhaar Identity Verified Resident Registration',
                      location: 'South Delhi Division Registry',
                      points: '+10 Pts',
                      time: 'Joined & Verified',
                      type: 'positive',
                    },
                  ]
              ).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#F8FAFC',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.type === 'positive' ? '#059669' : '#0284C7',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.action}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>{item.location} &bull; {item.time}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: item.type === 'positive' ? '#059669' : '#0284C7',
                      background: item.type === 'positive' ? '#ECFDF5' : '#EFF6FF',
                      border: `1px solid ${item.type === 'positive' ? '#A7F3D0' : '#BAE6FD'}`,
                      padding: '3px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <PointsIcon size={12} />
                    <span>{item.points}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── 5. JURISDICTION, SYSTEM PREFERENCES & HELPLINE ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Identity & Aadhaar Record */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #D0E0EF', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <img src="/citizen.png" alt="Citizen Record" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Verified Identity Record</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Full Legal Name</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{user?.full_name || 'Resident'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Registered Email</div>
                  <div style={{ fontSize: 13, color: '#0F172A', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SMS Dispatch Phone</div>
                  <div style={{ fontSize: 13, color: '#0F172A', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{user?.phone || '+91 98765 43210'}</div>
                </div>
              </div>
            </div>

            {/* Jurisdiction */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #D0E0EF', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <img src="/location.png" alt="Jurisdiction" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Designated Ward Jurisdiction</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: 10, border: '1px solid #BAE6FD', borderRadius: 6, background: '#EFF6FF' }}>
                  <div style={{ fontSize: 10, color: '#0284C7', fontWeight: 700, textTransform: 'uppercase' }}>Primary Residential Ward</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Ward-04 (Sector B, South Delhi)</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Zonal Base: South MCD Division 4</div>
                </div>
                <div style={{ padding: 10, border: '1px solid #E2E8F0', borderRadius: 6, background: '#F8FAFC' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Monitored Adjoining Wards</div>
                  <div style={{ fontSize: 12.5, color: '#0F172A', marginTop: 1 }}>Ward-12 (Central Commercial), Ward-02 (East)</div>
                </div>
              </div>
            </div>

            {/* Notification & Dispatch Preferences */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #D0E0EF', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <img src="/notif.png" alt="Alerts" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Dispatch & Alert Preferences</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { key: 'crewDispatch' as const, label: 'Work Crew Dispatch SMS' },
                  { key: 'verificationVote' as const, label: 'Community Sign-Off Prompts' },
                  { key: 'autoGeotag' as const, label: 'High-Precision Geotag Attachment' },
                  { key: 'anonymousReporting' as const, label: 'Mask Name on Public Ledger' },
                ].map((item) => {
                  const isOn = preferences[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => togglePref(item.key)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 10px',
                        background: isOn ? '#FFFFFF' : '#F8FAFC',
                        borderRadius: 6,
                        border: `1px solid ${isOn ? '#BAE6FD' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontWeight: 500, color: '#0F172A' }}>{item.label}</span>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: isOn ? '#0284C7' : '#CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isOn && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Helpline & Session Sign Out */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #D0E0EF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                  <img src="/phone.png" alt="Helpline" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>MCD Central Line & Sign Out</h3>
                </div>
                <a
                  href="tel:155304"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 6,
                    textDecoration: 'none',
                    color: 'inherit',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#991B1B' }}>MCD Emergency Control Room</div>
                    <div style={{ fontSize: 11, color: '#7F1D1D' }}>Toll-Free 24x7: <strong style={{ fontFamily: 'var(--font-mono)' }}>155304</strong></div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#DC2626', color: '#FFFFFF', padding: '3px 8px', borderRadius: 4 }}>
                    Call
                  </span>
                </a>
              </div>

              <div style={{ paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', color: '#DC2626', borderColor: '#FECACA' }}
                >
                  <LogOut size={13} />
                  <span>Sign Out of Citizen Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileDock />
    </div>
  );
};
