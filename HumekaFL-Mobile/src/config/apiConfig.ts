// Replace 192.168.1.X with your actual local network IP address
const DEV_API_URL = 'http://192.168.1.80:5000'; 
const PROD_API_URL = 'https://your-production-api.com';

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const ENDPOINTS = {
    cry: '/cries',
    baby: '/babies',
    hospital: '/hospitals',
    professional: '/professionals',
    device: '/devices'
};
