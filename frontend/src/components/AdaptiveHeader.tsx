import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, MapPin, List, User, PlusCircle, AlertCircle, ArrowUpRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { fetchIncidents } from '../services/api';
import type { Incident } from '../types/incident';
import { NotificationDrawer } from './NotificationDrawer';

interface AdaptiveHeaderProps {
  onSearchClick?: () => void;
  onSelectIncident?: (incident: Incident) => void;
}

export const AdaptiveHeader: React.FC<AdaptiveHeaderProps> = ({ onSelectIncident }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const isOfficial = user?.role === 'official' || user?.role === 'admin';
  const avatarIcon = isOfficial ? '/mcd.png' : '/citizen.png';
  const prefix = isOfficial ? '/gov' : '/citizen';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    // Pre-fetch reports for instant live search
    fetchIncidents().then(setIncidents).catch(() => {});
  }, []);

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectRoute = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectIncident = (inc: Incident) => {
    if (onSelectIncident) {
      onSelectIncident(inc);
    } else {
      navigate(`${prefix}/tickets`);
    }
    setIsOpen(false);
    setQuery('');
  };

  // Filtered reports matching debounced query
  const matchingIncidents = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return incidents.filter((i) => {
      return (
        i.title?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.address?.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        `#cf-${i.id.substring(0, 6).toLowerCase()}`.includes(q)
      );
    }).slice(0, 5);
  }, [debouncedQuery, incidents]);

  return (
    <header className="adaptive-header">
      {/* Mobile Brand (hidden on desktop) */}
      <Link to="/" className="header-brand">
        <img 
          src="/logo.jpg" 
          alt="CivicFix" 
          style={{ width: 26, height: 26, objectFit: 'contain' }} 
        />
        <span>CivicFix</span>
      </Link>

      {/* Integrated Apple Spotlight Search Bar with Direct Dropdown */}
      <div className="header-search-slot" ref={containerRef}>
        <div className={`apple-search-pill ${isOpen ? 'active' : ''}`}>
          <Search size={15} className="apple-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="apple-search-input"
            placeholder={t('search_placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {query && (
            <button 
              className="apple-search-clear" 
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Apple-style Dropdown Drawer */}
        {isOpen && (
          <div className="apple-search-dropdown">
            {/* Live Search Results */}
            {query.trim() !== '' && (
              <div className="search-dropdown-section">
                <div className="search-dropdown-label">Matching Municipal Reports ({matchingIncidents.length})</div>
                {matchingIncidents.length === 0 ? (
                  <div className="search-dropdown-empty">
                    <AlertCircle size={14} />
                    <span>No reports matching &ldquo;{query}&rdquo;</span>
                  </div>
                ) : (
                  matchingIncidents.map((inc) => (
                    <div 
                      key={inc.id} 
                      className="search-dropdown-item" 
                      onClick={() => handleSelectIncident(inc)}
                    >
                      <div className="search-item-icon">
                        <MapPin size={15} color="var(--primary)" />
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-title">{inc.title || inc.category.replace(/_/g, ' ')}</div>
                        <div className="search-item-subtitle">
                          #CF-{inc.id.substring(0,6).toUpperCase()} &bull; {inc.address || 'Ward-04'}
                        </div>
                      </div>
                      <span className="search-item-badge">{inc.status.replace(/_/g, ' ')}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Quick Navigation Routes */}
            <div className="search-dropdown-section">
              <div className="search-dropdown-label">Quick Actions & Routes</div>
              
              {!isOfficial && (
                <div 
                  className="search-dropdown-item" 
                  onClick={() => handleSelectRoute('/citizen/new')}
                >
                  <div className="search-item-icon">
                    <PlusCircle size={15} color="#10B981" />
                  </div>
                  <div className="search-item-info">
                    <div className="search-item-title">Lodge New Civic Report</div>
                    <div className="search-item-subtitle">File road hazard, water leak, or streetlight outage</div>
                  </div>
                  <ArrowUpRight size={14} className="search-item-arrow" />
                </div>
              )}

              <div 
                className="search-dropdown-item" 
                onClick={() => handleSelectRoute(`${prefix}/tickets`)}
              >
                <div className="search-item-icon">
                  <List size={15} color="#6366F1" />
                </div>
                <div className="search-item-info">
                  <div className="search-item-title">{isOfficial ? 'MCD Work Order Queue' : 'Public Reports Ledger'}</div>
                  <div className="search-item-subtitle">Browse all active and resolved ward issues</div>
                </div>
                <ArrowUpRight size={14} className="search-item-arrow" />
              </div>

              <div 
                className="search-dropdown-item" 
                onClick={() => handleSelectRoute(`${prefix}/profile`)}
              >
                <div className="search-item-icon">
                  <User size={15} color="#F59E0B" />
                </div>
                <div className="search-item-info">
                  <div className="search-item-title">Account & Jurisdiction Preferences</div>
                  <div className="search-item-subtitle">Manage residential ward, SMS alerts & dispatch profile</div>
                </div>
                <ArrowUpRight size={14} className="search-item-arrow" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Edge Actions */}
      <div className="header-actions">
        {/* Language Switcher Pill */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="header-notif-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-xs, 6px)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-subtle)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
          title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
        >
          <Globe size={13} color="var(--primary)" />
          <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
        </button>

        <button className="header-notif-btn" title="Notifications" onClick={() => setNotifOpen(!notifOpen)}>
          <img src="/notif.png" alt="Notifications" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span className="header-notif-badge" />
        </button>

        <Link to={isOfficial ? "/gov/profile" : "/citizen/profile"} style={{ textDecoration: 'none' }}>
          <div className="header-user-btn" title="View Profile">
            <div className="header-user-avatar-wrap">
              <img 
                src={avatarIcon} 
                alt={isOfficial ? 'MCD Official' : 'Citizen'} 
                className="header-user-avatar"
              />
            </div>
            
            <div className="header-user-info">
              <span className="header-user-name">
                {user?.full_name?.split(' ')[0] || (isOfficial ? 'MCD Engineer' : 'Resident')}
              </span>
              
              <svg 
                className="verified-check-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M10.29 2.308a2.43 2.43 0 0 1 3.42 0l.66.643a2.43 2.43 0 0 0 2.06.67l.914-.145a2.43 2.43 0 0 1 2.768 2.011l.145.914a2.43 2.43 0 0 0 .67 2.06l.643.66a2.43 2.43 0 0 1 0 3.42l-.643.66a2.43 2.43 0 0 0-.67 2.06l-.145.914a2.43 2.43 0 0 1-2.768 2.011l-.914-.145a2.43 2.43 0 0 0-2.06.67l-.66.643a2.43 2.43 0 0 1-3.42 0l-.66-.643a2.43 2.43 0 0 0-2.06-.67l-.914.145a2.43 2.43 0 0 1-2.768-2.011l-.145-.914a2.43 2.43 0 0 0-.67-2.06l-.643-.66a2.43 2.43 0 0 1 0-3.42l.643-.66a2.43 2.43 0 0 0 .67-2.06l.145-.914a2.43 2.43 0 0 1 2.768-2.011l.914.145a2.43 2.43 0 0 0 2.06-.67l.66-.643Z" 
                  fill="#0095F6" 
                />
                <path 
                  d="m8.5 12 2.5 2.5 5-5" 
                  stroke="#FFFFFF" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
};
