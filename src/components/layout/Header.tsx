import React, { useEffect, useRef, useState } from 'react';
import designSystem from '../../designSystem';
import { Share2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoAuthSafe } from '../../contexts/DemoAuthContext';

interface HeaderProps {
  title: string;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
  onMobileSidebarToggle: () => void;
  isMobile: boolean;
  restaurant: any;
}

const Header: React.FC<HeaderProps> = ({ title, onSidebarToggle, sidebarCollapsed, onMobileSidebarToggle, isMobile, restaurant }) => {
  const isDemoUser = !!useDemoAuthSafe();
  const menuLinks = React.useMemo(() => {
    if (!restaurant?.id) return [];
    if (isDemoUser) {
      return [
        {
          label: 'Menu Link',
          icon: <ExternalLink size={18} className="mr-2" />,
          href: `/demo-public-menu/${restaurant.id}`,
          variant: 'outline',
        },
        {
          label: 'Order Link',
          icon: <Share2 size={18} className="mr-2" />,
          href: `/demo-public-order/${restaurant.id}`,
          variant: 'gold',
        },
      ];
    } else {
      return [
        {
          label: 'Menu Link',
          icon: <ExternalLink size={18} className="mr-2" />,
          href: `/public-menu/${restaurant.id}`,
          variant: 'outline',
        },
        {
          label: 'Order Link',
          icon: <Share2 size={18} className="mr-2" />,
          href: `/public-order/${restaurant.id}`,
          variant: 'gold',
        },
      ];
    }
  }, [restaurant, isDemoUser]);

  // For mobile slideshow
  const [slideIndex, setSlideIndex] = useState(0);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);
  const [paused, setPaused] = useState(false);
  const [toggleHover, setToggleHover] = useState(false);

  useEffect(() => {
    // No slideshow needed anymore, but keep effect for future if needed
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, []);

  // Button styles
  const menuButtonBase = {
    height: 40,
    minWidth: 120,
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    transition: 'background 0.15s, color 0.15s',
    boxShadow: 'none',
    outline: 'none',
    borderWidth: 1,
    borderStyle: 'solid',
    cursor: 'pointer',
    marginLeft: 12,
    marginRight: 0,
    gap: 8,
    userSelect: 'none',
  } as React.CSSProperties;

  // Simple outlined split box icon for sidebar toggle
  const ToggleIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        stroke: toggleHover ? designSystem.colors.accent : designSystem.colors.text,
        strokeWidth: 2,
        transition: 'stroke 0.15s',
      }}
    >
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" fill="none" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" />
    </svg>
  );

  return (
    <header
      className="sticky top-0 z-50 w-full flex items-center justify-between px-4 py-3 shadow border-b"
      style={{ background: designSystem.colors.white, borderColor: designSystem.colors.borderLightGray }}
    >
      {/* Left: Toggle, name */}
      <div className="flex items-center min-w-0">
        {/* Sidebar toggle */}
        <button
          className="mr-2 p-2 rounded-md transition md:block"
          style={{
            background: toggleHover ? designSystem.colors.accent : 'transparent',
            color: toggleHover ? designSystem.colors.white : designSystem.colors.text,
            border: 'none',
          }}
          onClick={isMobile ? onMobileSidebarToggle : onSidebarToggle}
          aria-label="Toggle sidebar"
          onMouseEnter={() => setToggleHover(true)}
          onMouseLeave={() => setToggleHover(false)}
        >
          {ToggleIcon}
        </button>
        <div className="flex flex-col min-w-0">
          <span
            className="font-bold text-base"
            style={{
              color: designSystem.colors.text,
              ...(isMobile ? {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                textAlign: 'left',
                display: 'block',
                width: '100%',
              } : {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                width: '100%',
              })
            }}
          >
            {'Restaurant Management'}
          </span>
        </div>
      </div>
      {/* Center: Page title */}
      <div className="flex items-center mx-4 flex-1 min-w-0">
        <span
          className="font-bold text-lg truncate"
          style={{
            color: designSystem.colors.text,
            ...(isMobile ? {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              textAlign: 'center',
              display: 'block',
              width: '100%',
            } : {})
          }}
        >
          {title}
        </span>
      </div>
      {/* Right: Menu/Order links or mobile slideshow */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <div
            className="relative w-36 h-12 flex items-center justify-center"
            style={{ minWidth: 120, justifyContent: 'center', display: 'flex' }}
          >
            {menuLinks.filter(link => link.variant === 'gold').map((link) => {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  style={{
                    ...menuButtonBase,
                    fontSize: 'clamp(11px, 3vw, 14px)',
                    padding: '0 6px',
                    position: 'static',
                    width: '90%',
                    height: '80%',
                    background: designSystem.colors.accent,
                    color: designSystem.colors.text,
                    borderColor: designSystem.colors.accent,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    margin: '0 auto',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = designSystem.colors.text;
                    e.currentTarget.style.color = designSystem.colors.white;
                    e.currentTarget.style.borderColor = designSystem.colors.text;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = designSystem.colors.accent;
                    e.currentTarget.style.color = designSystem.colors.text;
                    e.currentTarget.style.borderColor = designSystem.colors.accent;
                  }}
                >
                  {link.icon}
                  {link.label}
                </a>
              );
            })}
          </div>
        ) : (
          <>
            {menuLinks.map((link) => {
              const isGold = link.variant === 'gold';
              return (
                <a
                  key={link.label}
                  href={link.href}
                  style={{
                    ...menuButtonBase,
                    background: isGold ? designSystem.colors.accent : designSystem.colors.white,
                    color: isGold ? designSystem.colors.text : designSystem.colors.text,
                    borderColor: isGold ? designSystem.colors.accent : designSystem.colors.borderLightGray,
                  }}
                  onMouseEnter={e => {
                    if (!isGold) {
                      e.currentTarget.style.background = designSystem.colors.accent;
                      e.currentTarget.style.color = designSystem.colors.text;
                      e.currentTarget.style.borderColor = designSystem.colors.accent;
                    }
                    if (isGold) {
                      e.currentTarget.style.background = designSystem.colors.text;
                      e.currentTarget.style.color = designSystem.colors.white;
                      e.currentTarget.style.borderColor = designSystem.colors.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isGold) {
                      e.currentTarget.style.background = designSystem.colors.white;
                      e.currentTarget.style.color = designSystem.colors.text;
                      e.currentTarget.style.borderColor = designSystem.colors.borderLightGray;
                    }
                    if (isGold) {
                      e.currentTarget.style.background = designSystem.colors.accent;
                      e.currentTarget.style.color = designSystem.colors.text;
                      e.currentTarget.style.borderColor = designSystem.colors.accent;
                    }
                  }}
                >
                  {link.icon}
                  {link.label}
                </a>
              );
            })}
          </>
        )}
      </div>
    </header>
  );
};

export default Header; 