# API Keys Authentication Fix

## Problem
API Keys endpoints were returning **401 Unauthorized** even though the user was logged in, while all other routes (projects, content, user, org) worked fine.

## Root Cause
Your application uses **two different methods** for making API requests:

### ✅ Working Routes (Projects, Content, User, Org)
Use the **axios client** (`api.ts`):
```typescript
// api.ts has an interceptor that automatically adds the auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### ❌ Broken Routes (API Keys)
Use **plain fetch()** without the Authorization header:
```typescript
// BEFORE - Missing Authorization header
const response = await fetch('/api/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, organizationId }),
});
```

### What `credentials: 'include'` Does
- **Does NOT** send JWT tokens from localStorage
- **Only** sends cookies with the request
- Your app uses **JWT authentication in localStorage**, not cookies

## Solution
Added the **Authorization header with Bearer token** to all API keys fetch requests:

```typescript
// AFTER - With Authorization header
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/api-keys', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ name, organizationId }),
});
```

## Files Updated

1. **`$organizationId.api-keys.tsx`**
   - ✅ `loadApiKeys()` - Added auth header
   - ✅ `handleRevoke()` - Added auth header
   - ✅ `handleDelete()` - Added auth header

2. **`CreateApiKeyModal.tsx`**
   - ✅ `handleCreate()` - Added auth header

## Why This Happened
The API keys feature was implemented using plain `fetch()` instead of the existing `api.ts` axios client, which meant it didn't benefit from the automatic auth token injection.

## Best Practice Going Forward
**Option 1 (Recommended):** Use the existing `api.ts` axios client for consistency
```typescript
import { api } from '@/lib/api';

// All requests automatically include auth headers
await api.get('/api-keys/organization/...');
await api.post('/api-keys', { name, organizationId });
```

**Option 2:** If using fetch, always include the auth token manually
```typescript
const token = localStorage.getItem('auth_token');
await fetch('/api/...', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
});
```

## Testing
After this fix, API keys endpoints should now work correctly:
- ✅ Load API keys
- ✅ Create new API key
- ✅ Revoke API key
- ✅ Delete API key

All requests will include the proper authentication headers.
