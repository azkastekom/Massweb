# API Key Refresh and Expiration Features

## Summary
Added comprehensive API key refresh and expiration functionality to enhance security and key management.

## New Features

### 1. ✅ API Key Expiration

**Backend Changes:**
- Updated `ApiKeysService.createApiKey()` to accept optional `expiresAt` parameter
- Modified `ApiKeysController.create()` to accept `expiryDays` and calculate expiration date
- Updated entity type to properly handle nullable Date fields

**Frontend Changes:**
- Added expiration dropdown in Create API Key modal with options:
  - Never (default)
  - 30 days
  - 60 days
  - 90 days
  - 1 year
- Added EXPIRATION column to API keys table
- Display expiration status:
  - "Expired" (red text) if past expiration date
  - Expiration date (gray text) if not yet expired
  - "Never" (gray text) if no expiration set

### 2. ✅ API Key Refresh

**Backend Changes:**
- Added `refreshKey()` method to `ApiKeysService`
  - Generates new API key
  - Keeps all metadata (name, organization, expiration)
  - Reactivates key if it was revoked
  - Resets last used timestamp
- Added `/api/api-keys/:id/refresh` endpoint (PATCH)
  - Returns new plain key like create endpoint
  - Requires organizationId in body for security

**Frontend Changes:**
- Added Refresh button (blue with RefreshCw icon) next to each active API key
- Confirmation dialog warns that old key will stop working
- Shows refreshed key in modal with:
  - Warning message about old key being invalidated
  - Copy to clipboard functionality
  - Key name reference
- Full error handling with specific messages

## API Endpoints

### Create API Key with Expiration
```http
POST /api/api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production API Key",
  "organizationId": "uuid",
  "expiryDays": 90  // Optional: number of days until expiration
}
```

### Refresh API Key
```http
PATCH /api/api-keys/:id/refresh
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Production API Key",
  "isActive": true,
  "expiresAt": "2025-03-06T10:00:00.000Z",
  "createdAt": "2025-12-06T10:00:00.000Z",
  "lastUsedAt": null,
  "plainKey": "newly-generated-api-key-here"
}
```

## UI Features

### API Keys Table
- **EXPIRATION Column**: Shows expiration status
  - Red "Expired" badge for expired keys
  - Date for keys with future expiration
  - "Never" for keys without expiration

- **Actions**:
  - 🔄 **Refresh** (blue) - Regenerate the key
  - **Revoke** (orange) - Deactivate the key
  - 🗑️ **Delete** (red) - Permanently remove

### Create Modal
- Name input field
- Expiration dropdown:
  - Never
  - 30 days  
  - 60 days
  - 90 days
  - 1 year
- Success toast and key display with copy button

### Refresh Modal
- Shows new key after refresh
- Warning about old key invalidation
- Copy to clipboard button
- Key name reference

## Security Benefits

1. **Automatic Expiration**: Keys automatically become invalid after expiration date
2. **Easy Rotation**: One-click refresh maintains metadata while generating new key
3. **Compliance**: Supports security policies requiring regular key rotation
4. **Audit Trail**: Maintains created date and resets last used on refresh
5. **No Downtime**: Old key remains valid until refresh is complete

## Updated Security Best Practices

The UI now recommends:
- ✅ Refresh API keys immediately if compromised
- ✅ Set expiration dates for better security and compliance
- ✅ Regularly rotate your API keys using the refresh button
- ✅ Monitor API key usage through the "Last Used" column

## Error Handling

All operations include comprehensive error handling:
- 401: Unauthorized - token issues
- 403: Permission denied - insufficient permissions
- 404: Not found - API key doesn't exist
- Network errors: Connection issues

Each error shows a specific, user-friendly message via toast notifications.

## Testing Checklist

### Create with Expiration
- [ ] Create key without expiration (Never)
- [ ] Create key with 30-day expiration
- [ ] Create key with custom expiration
- [ ] Verify expiration date is calculated correctly

### Refresh Key
- [ ] Refresh active key
- [ ] Verify old key stops working
- [ ] Verify new key works  
- [ ] Copy new key to clipboard
- [ ] Check that metadata is preserved
- [ ] Check that lastUsedAt is reset

### Expiration Display
- [ ] Future expiration shows date
- [ ] Past expiration shows "Expired" in red
- [ ] No expiration shows "Never"
- [ ] Expired keys still show in table

### Permissions
- [ ] Can't refresh others' org keys
- [ ] Can't create keys without permission  
- [ ] Proper error messages for unauthorized actions
