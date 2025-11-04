import { RemoteConfig, RemoteEncryptedPayload } from '../types';

// --- Configuration ---
// Set to true to use mock data for development and testing
const USE_MOCK_API = false;

// --- Mock Data ---
const mockRemoteConfigs: RemoteConfig[] = [
    {
        date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        data: { salt: "mock-salt-1", nonce: "mock-nonce-1", ciphertext: "mock-ciphertext-1" }
    },
    {
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        data: { salt: "mock-salt-2", nonce: "mock-nonce-2", ciphertext: "mock-ciphertext-2" }
    }
];

// --- Remote Storage API Service ---
export const fetchRemoteConfigs = async (serverUrl: string, username: string): Promise<RemoteConfig[]> => {
    if (USE_MOCK_API) {
        console.log("Using MOCK API for fetchRemoteConfigs", { serverUrl, username });
        if (username) {
             return new Promise(resolve => setTimeout(() => resolve(mockRemoteConfigs), 500));
        }
        return Promise.resolve([]);
    }
    
    const response = await fetch(`${serverUrl}?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
    }
    const data = await response.json();
    if (data && Array.isArray(data.records)) {
        return data.records;
    }
    throw new Error('Invalid data format from server.');
};

export const saveRemoteConfig = async (serverUrl: string, username: string, data: RemoteEncryptedPayload): Promise<Response> => {
    if (USE_MOCK_API) {
        console.log("Using MOCK API for saveRemoteConfig", { serverUrl, username, data });
        return new Promise(resolve => setTimeout(() => resolve(new Response(JSON.stringify({ success: true, message: "Mock save successful" }), { status: 200 })), 500));
    }

    const response = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, data }),
    });

    if (!response.ok) {
        const resText = await response.text();
        throw new Error(`Server responded with status: ${response.status}. ${resText}`);
    }
    return response;
};
