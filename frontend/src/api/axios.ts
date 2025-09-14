import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, 
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const originalReq = err.config;
    if (err.response?.status === 401 && !originalReq._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalReq.headers['Authorization'] = 'Bearer ' + token;
          return api(originalReq);
        }).catch(e => Promise.reject(e));
      }

      originalReq._retry = true;
      isRefreshing = true;

      try {
        const r = await axios.post('http://localhost:4000/auth/refresh', {}, { withCredentials: true });
        const newAccess = r.data.accessToken;
        localStorage.setItem('accessToken', newAccess);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
        processQueue(null, newAccess);
        return api(originalReq);
      } catch (e) {
        processQueue(e, null);
        // optionally logout
        localStorage.removeItem('accessToken');
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
