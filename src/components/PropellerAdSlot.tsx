import {useEffect, useRef, useState} from 'react';

type PropellerAdSlotProps = {
  scriptSrc?: string;
  zoneId?: string;
  label: string;
  className?: string;
  minHeight?: number;
  key?: string | number;
};

const runtimeEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' && process.env
      ? process.env
      : ({} as Record<string, boolean | string | undefined>));

function shouldShowDevPlaceholder(scriptSrc?: string) {
  return Boolean(runtimeEnv.DEV) && !scriptSrc;
}

export default function PropellerAdSlot({
  scriptSrc,
  zoneId,
  label,
  className = '',
  minHeight = 250,
}: PropellerAdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    if (!scriptSrc || !containerRef.current) {
      return;
    }

    setIsAdLoaded(false);

    const script = document.createElement('script');
    script.async = true;
    script.src = scriptSrc;
    script.setAttribute('data-cfasync', 'false');
    if (zoneId) {
      script.dataset.zone = zoneId;
      script.setAttribute('data-zone', zoneId);
    }

    const container = containerRef.current;
    container.innerHTML = '';
    container.appendChild(script);

    // Setup MutationObserver to watch if the script renders anything inside the container
    const observer = new MutationObserver(() => {
      const children = Array.from(container.children);
      // If there's any element other than our script tag, then the ad has injected elements
      const hasContent = children.some((child) => (child as Element).tagName !== 'SCRIPT');
      if (hasContent) {
        setIsAdLoaded(true);
      }
    });

    observer.observe(container, {childList: true, subtree: true});

    // Also verify if there is already content (in case it loaded synchronously or before observer starts)
    const initialChildren = Array.from(container.children);
    if (initialChildren.some((child) => (child as Element).tagName !== 'SCRIPT')) {
      setIsAdLoaded(true);
    }

    // Set a fallback timeout: if the script is loaded, set it as loaded so it doesn't stay hidden
    script.onload = () => {
      // Small delay to allow the script to append elements
      setTimeout(() => {
        setIsAdLoaded(true);
      }, 500);
    };

    return () => {
      observer.disconnect();
      if (container.contains(script)) {
        container.removeChild(script);
      }
      container.innerHTML = '';
    };
  }, [scriptSrc, zoneId]);

  if (!scriptSrc && !shouldShowDevPlaceholder(scriptSrc)) {
    return null;
  }

  const isDev = shouldShowDevPlaceholder(scriptSrc);
  const showCardStyle = isDev || isAdLoaded;

  return (
    <section
      aria-label={label}
      className={`propeller-slot ${className} ${showCardStyle ? 'ad-visible' : 'ad-collapsed'}`.trim()}
      data-ad-label={label}
      style={{
        minHeight: showCardStyle ? minHeight : 0,
        height: showCardStyle ? 'auto' : 0,
        opacity: showCardStyle ? 1 : 0,
        visibility: showCardStyle ? 'visible' : 'hidden',
        margin: showCardStyle ? undefined : '0 auto',
        padding: showCardStyle ? undefined : 0,
        border: showCardStyle ? undefined : 'none',
        boxShadow: showCardStyle ? undefined : 'none',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {showCardStyle ? (
        <div className="propeller-slot-header">
          <span>Sponsored</span>
        </div>
      ) : null}
      <div className="propeller-slot-body" ref={containerRef} style={{padding: showCardStyle ? undefined : 0}}>
        {isDev ? <div className="propeller-slot-placeholder">{label} ad slot</div> : null}
      </div>
    </section>
  );
}

