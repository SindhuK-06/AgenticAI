import { useEffect } from 'react';
import '../styles/globals.css';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../services/socket';

export default function App({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
    getSocket();
  }, [initAuth]);

  return <Component {...pageProps} />;
}
