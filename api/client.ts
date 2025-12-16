
import { API_BASE_URL, USE_MOCK_API } from '../config';
import { handleMockRequest } from './mockService';

export const getAuthToken = () => localStorage.getItem('authToken');
export const setAuthToken = (token: string) => localStorage.setItem('authToken', token);
export const clearAuthToken = () => localStorage.removeItem('authToken');

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
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
      // Wrap mock errors in ApiError for consistency
      throw new ApiError(error.message || 'Mock API Error', 500);
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
          // Dispatch event or callback could be better, but reload works for now
          window.location.reload();
        }
        throw new ApiError('Unauthorized', 401);
      }

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        let errorData = null;
        try {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            errorData = errorJson;
            if (errorJson.message) errorMessage = errorJson.message;
            else if (errorJson.error) errorMessage = errorJson.error;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) { /* ignore */ }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`[API Request Failed] ${url}`, error);
      // Network errors (fetch failed) typically don't have a status code, so we use 0 or 503
      throw new ApiError('Network Error: Failed to connect to server', 0);
    }
  }
}
