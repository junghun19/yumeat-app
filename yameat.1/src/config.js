const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const appHost = isLocalHost ? '127.0.0.1' : window.location.hostname;
const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${appHost}:8010`;
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || `${wsProtocol}://${appHost}:8010`;
export const STREAMLIT_BASE_URL = import.meta.env.VITE_STREAMLIT_BASE_URL || `http://${appHost}:8510`;
