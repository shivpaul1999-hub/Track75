
import { API_BASE_URL, USE_MOCK_API } from '../config';
import { handleMockRequest } from './mockService';

export const getAuthToken = () => localStorage.getItem('authToken');
export const setAuthToken = (token: string) => localStorage.setItem('authToken', token);
export const clearAuthToken = () => localStorage.removeItem('authToken');

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // 1. Prepare Headers (Auth)
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 2. Handle Query Params
  let url = endpoint;
  if (options.params) {
    const queryString = new URLSearchParams(options.params).toString();
    url += `?${queryString}`;
  }

  // 3. Routing: Mock vs Real
  if (USE_MOCK_API) {
    console.groupCollapsed(`[Mock API] ${options.method || 'GET'} ${url}`);
    console.log('Payload:', options.body ? JSON.parse(options.body as string) : 'None');
    
    // Simulate network delay (300-600ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300)); 
    
    try {
      const response = await handleMockRequest<T>(url, options.method || 'GET', options.body);
      console.log('Response:', response);
      console.groupEnd();
      return response;
    } catch (error: any) {
      console.error('Error:', error);
      console.groupEnd();
      throw new Error(error.message || 'Mock API Error');
    }
  } else {
    // Real Fetch Implementation
    try {
      const fetchUrl = `${API_BASE_URL}${url}`;
      const response = await fetch(fetchUrl, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        clearAuthToken();
        if (!window.location.pathname.includes('login')) {
           window.location.reload(); 
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) errorMessage = errorJson.message;
            else if (errorJson.error) errorMessage = errorJson.error;
        } catch (e) { /* ignore */ }
        throw new Error(errorMessage);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Request Failed] ${url}`, error);
      throw error;
    }
  }
}
