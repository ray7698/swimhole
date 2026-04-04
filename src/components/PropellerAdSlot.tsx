import {useEffect, useRef} from 'react';

type PropellerAdSlotProps = {
  scriptSrc?: string;
  label: string;
  className?: string;
  minHeight?: number;
};

function shouldShowDevPlaceholder(scriptSrc?: string) {
  return import.meta.env.DEV && !scriptSrc;
}

export default function PropellerAdSlot({
  scriptSrc,
  label,
  className = '',
  minHeight = 250,
}: PropellerAdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scriptSrc || !containerRef.current) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = scriptSrc;
    script.setAttribute('data-cfasync', 'false');

    const container = containerRef.current;
    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
      container.innerHTML = '';
    };
  }, [scriptSrc]);

  if (!scriptSrc && !shouldShowDevPlaceholder(scriptSrc)) {
    return null;
  }

  return (
    <section
      aria-label={label}
      className={`propeller-slot ${className}`.trim()}
      data-ad-label={label}
      style={{minHeight}}
    >
      <div className="propeller-slot-header">
        <span>Sponsored</span>
      </div>
      <div className="propeller-slot-body" ref={containerRef}>
        {!scriptSrc ? <div className="propeller-slot-placeholder">{label} ad slot</div> : null}
      </div>
    </section>
  );
}
