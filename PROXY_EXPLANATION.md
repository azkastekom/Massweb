# API Request Proxy Configuration - Complete Explanation

## Your Question: "Why is just API keys that need proxy? Why other route no?"

Great question! The truth is **ALL API routes need the proxy**, but your codebase had inconsistent approaches:

### The Two Approaches Found

#### ❌ **Hardcoded URLs** (What was already there)
```typescript
// JobProgressTracker.tsx (OLD)
fetch(`http://localhost:3001/api/content-generator/jobs/${jobId}/status`)

// ExportMenu.tsx (OLD)  
fetch(`http://localhost:3001/api/content-generator/projects/${projectId}/export?format=${format}`)
```

**These worked in development** because they directly specified `localhost:3001`, BUT:
- ❌ Won't work in production (localhost doesn't exist on user machines)
- ❌ Hardcoded port number
- ❌ Not flexible for different environments
- ❌ Potential CORS issues

#### ✅ **Relative URLs** (What the proxy enables)
```typescript
// API Keys routes (NEW)
fetch(`/api/api-keys/organization/${organizationId}`)

// JobProgressTracker.tsx (NOW FIXED)
fetch(`/api/content-generator/jobs/${jobId}/status`)
```

**These require a proxy in development**, but they're the CORRECT approach because:
- ✅ Work in both development AND production
- ✅ No hardcoded URLs
- ✅ Respects same-origin policy
- ✅ Handles cookies/credentials properly

---

## What the Proxy Does

### vite.config.ts
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**How it works:**
1. Frontend runs on `http://localhost:5173` (Vite dev server)
2. Backend runs on `http://localhost:3001` (NestJS server)
3. When frontend makes a request to `/api/...`:
   - Vite intercepts it
   - Forwards it to `http://localhost:3001/api/...`
   - Returns the response to the frontend

**Without proxy:**
- Request to `/api/...` → tries `http://localhost:5173/api/...` ❌ (Vite has no API routes)

**With proxy:**
- Request to `/api/...` → proxied to `http://localhost:3001/api/...` ✅ (NestJS handles it)

---

## What We Fixed

### Files Updated to Use Relative URLs

1. **JobProgressTracker.tsx**
   ```diff
   - fetch(`http://localhost:3001/api/content-generator/jobs/${jobId}/status`)
   + fetch(`/api/content-generator/jobs/${jobId}/status`)
   ```

2. **ExportMenu.tsx**
   ```diff
   - fetch(`http://localhost:3001/api/content-generator/projects/${projectId}/export?format=${format}`)
   + fetch(`/api/content-generator/projects/${projectId}/export?format=${format}`)
   ```

3. **api.ts** (axios base URL)
   ```diff
   - const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
   + const API_URL = import.meta.env.VITE_API_URL || '/api';
   ```

### Files Left As-Is (And Why)

**$projectId_.api-docs.tsx**
- Uses `apiUrl` variable to **show documentation examples** to users
- SHOULD show full URL because it's teaching users how to call the API from external applications
- Correct as-is ✅

---

## Why This Matters

### Development
- ✅ All `/api` requests now properly routed to backend on port 3001
- ✅ Consistent approach across all components
- ✅ No hardcoded URLs

### Production
When you deploy:
- Frontend will be served from same origin as backend (e.g., `https://yourapp.com`)
- Requests to `/api/...` will go to `https://yourapp.com/api/...` automatically
- Or you can set `VITE_API_URL` environment variable to point to your production API

---

## Summary

**Before:** Mixed approaches - some used hardcoded URLs (`http://localhost:3001`), some used relative URLs (`/api`)

**After:** Standardized to relative URLs everywhere, with Vite proxy handling routing in development

**Result:** 
- ✅ Cleaner code
- ✅ Environment-agnostic
- ✅ Works in both dev and production
- ✅ Easier to maintain

The proxy wasn't "just for API keys" - it's for ALL API routes. API keys just happened to be the first feature written with the correct relative URL approach, which revealed that the proxy was missing!
