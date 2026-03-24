import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setJustCameBack(true);
      setTimeout(() => setJustCameBack(false), 4000);
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="offline-banner"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100000 }}
        >
          ◉ &nbsp; SIGNAL LOST — NO NETWORK CONNECTION &nbsp; ◉
        </motion.div>
      )}
      {justCameBack && isOnline && (
        <motion.div
          key="back"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100000,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            background: 'rgba(61,255,154,0.08)',
            borderBottom: '1px solid rgba(61,255,154,0.3)',
            color: '#3dff9a',
            textAlign: 'center',
            padding: '0.4rem',
          }}
        >
          ◈ &nbsp; SIGNAL RESTORED — CONNECTION BACK ONLINE &nbsp; ◈
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
