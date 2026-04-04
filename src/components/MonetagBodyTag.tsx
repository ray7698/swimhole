import {useEffect} from 'react';

type MonetagBodyTagProps = {
  scriptSrc?: string;
  zoneId?: string;
};

export default function MonetagBodyTag({scriptSrc, zoneId}: MonetagBodyTagProps) {
  useEffect(() => {
    if (!scriptSrc || !zoneId || typeof document === 'undefined') {
      return;
    }

    const target = document.documentElement || document.body;
    if (!target) {
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.dataset.zone = zoneId;

    target.appendChild(script);

    return () => {
      if (target.contains(script)) {
        target.removeChild(script);
      }
    };
  }, [scriptSrc, zoneId]);

  return null;
}
