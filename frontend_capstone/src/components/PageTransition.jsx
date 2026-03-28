import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * Wraps children with a subtle fade-in on route change.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    // Trigger fade-in on next frame
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div className={`transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      {children}
    </div>
  );
}
