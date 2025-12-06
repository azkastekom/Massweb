# API Key Management Error Response Improvements

## Summary
Enhanced error response handling for all API key management operations to provide clear, actionable feedback to users. The improvements parse backend error responses and display specific error messages based on HTTP status codes and error types.

## Changes Made

### 1. API Keys Page (`$organizationId.api-keys.tsx`)

#### Load API Keys Function
- **Status Code 401 (Unauthorized)**: "Unauthorized. Please log in again."
- **Status Code 403 (Forbidden)**: "You do not have permission to view API keys for this organization"
- **Status Code 404 (Not Found)**: "Organization not found"
- **Network Errors**: "Network error. Please check your connection."
- **Other Errors**: Displays the error message from backend response

#### Revoke API Key Function
- **Status Code 404 (Not Found)**: "API key not found or already deleted"
- **Status Code 403 (Forbidden)**: "You do not have permission to revoke this API key"
- **Network Errors**: "Network error. Please try again."
- **Success**: "API key revoked successfully"
- **Other Errors**: Displays the error message from backend response

#### Delete API Key Function
- **Status Code 404 (Not Found)**: "API key not found or already deleted"
- **Status Code 403 (Forbidden)**: "You do not have permission to delete this API key"
- **Network Errors**: "Network error. Please try again."
- **Success**: "API key deleted successfully"
- **Other Errors**: Displays the error message from backend response

### 2. Create API Key Modal (`CreateApiKeyModal.tsx`)

#### Create API Key Function
- **Status Code 400 (Bad Request)**: "Validation error: {specific message from backend}"
- **Status Code 401 (Unauthorized)**: "Unauthorized. Please log in again."
- **Status Code 403 (Forbidden)**: "You do not have permission to create API keys for this organization"
- **Status Code 404 (Not Found)**: "Organization not found"
- **Network Errors**: "Network error. Please check your connection and try again."
- **Success**: "API key created successfully!"
- **Other Errors**: Displays the error message from backend response

## Technical Implementation

### Error Response Parsing
All API calls now follow this pattern:

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => null);
  const message = errorData?.message || 'Default error message';
  
  // Handle specific status codes
  if (response.status === 401) {
    toast.error('Unauthorized. Please log in again.');
  } else if (response.status === 403) {
    toast.error('Permission denied message...');
  }
  // ... more status codes
  else {
    toast.error(message);
  }
  return;
}
```

### Benefits

1. **User-Friendly**: Clear, actionable error messages instead of generic "Failed to..." messages
2. **Security**: Helps users understand authentication and authorization issues
3. **Debugging**: Specific messages help identify the root cause of failures
4. **Graceful Degradation**: Falls back to backend error message or default message if JSON parsing fails
5. **Network Resilience**: Distinguishes between network errors and API errors

## Backend Error Responses

The backend (NestJS) currently throws these exceptions:
- `NotFoundException`: When API keys or organizations are not found
- `BadRequestException`: For validation errors (not currently used but supported)
- Standard HTTP errors for authentication/authorization issues

All errors are now properly caught and displayed with appropriate context to the user.

## Testing Recommendations

To verify proper error handling, test these scenarios:

1. **Unauthorized Access**: Log out and try to access API keys
2. **Permission Denied**: Try to manage API keys for an organization you don't have access to
3. **Not Found**: Try to delete/revoke a non-existent API key
4. **Network Error**: Disconnect from the internet and attempt operations
5. **Validation Error**: Create an API key with invalid data (if backend validation is added)
