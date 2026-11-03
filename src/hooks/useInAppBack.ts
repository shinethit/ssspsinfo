import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Shared "back" behaviour (v24.15, P15).
 * window.history.length counts the WHOLE browser tab session, not in-app
 * navigation — a direct visit from Facebook/Messenger/Google (length > 1)
 * used to exit the app. This hook tracks whether the user has navigated
 * inside the app since this page loaded (location.key changes on in-app
 * navigation, and stays 'default' on a direct load).
 * Returns a goBack() that goes -1 only when in-app navigation happened,
 * and '/' otherwise. Use it for EVERY back button in the app.
 */
export function useInAppBack(): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  const firstKey = useRef(location.key);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (location.key !== firstKey.current) {
      navigatedRef.current = true;
    }
  }, [location.key]);

  return () => {
    if (navigatedRef.current) navigate(-1);
    else navigate('/');
  };
}
