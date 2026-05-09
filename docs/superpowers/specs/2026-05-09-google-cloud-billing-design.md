# Design Spec - Google Cloud Billing Node

## Overview
Add a new n8n node for Google Cloud Billing using the official `@google-cloud/billing` Node.js library. Initial implementation will focus on Billing Accounts and use OAuth2 for authentication.

## Goals
- Provide a user-friendly way to interact with Google Cloud Billing API.
- Support OAuth2 authentication.
- Implement Billing Account resources (List and Get).

## Architecture
- **Credential**: `GoogleCloudBillingOAuth2Api` (OAuth2).
- **Node**: `GoogleCloudBilling` (Programmatic-style).
- **Library**: `@google-cloud/billing`.

## Detailed Design

### 1. Credentials
- **Name**: `googleCloudBillingOAuth2Api`
- **Display Name**: `Google Cloud Billing OAuth2 API`
- **Extends**: `oAuth2Api`
- **Properties**:
  - `authUrl`: `https://accounts.google.com/o/oauth2/v2/auth`
  - `accessTokenUrl`: `https://oauth2.googleapis.com/token`
  - `scope`: `https://www.googleapis.com/auth/cloud-billing.readonly https://www.googleapis.com/auth/cloud-platform.read-only` (Default to read-only for now, can be expanded).
- **Authentication**: Handled by n8n's `oAuth2Api`.

### 2. Node Description
- **Display Name**: `Google Cloud Billing`
- **Name**: `googleCloudBilling`
- **Icon**: A custom Google Cloud Billing icon (SVG).
- **Resources**:
  - `billingAccount`
- **Operations**:
  - `list`: List all billing accounts.
  - `get`: Get details of a specific billing account.

### 3. Logic (Programmatic Style)
- In `execute()`:
  - Get credentials.
  - Initialize `CloudBillingClient`.
  - Iterate over input items.
  - For each item:
    - Get `resource` and `operation`.
    - If `resource === 'billingAccount'`:
      - If `operation === 'list'`: Call `client.listBillingAccounts()`.
      - If `operation === 'get'`: Call `client.getBillingAccount({ name: accountName })`. Note: `accountName` must be in the format `billingAccounts/{ACCOUNT_ID}`.
    - Map responses to `INodeExecutionData[]`.
    - Handle errors with `NodeApiError` or `NodeOperationError`.

### 4. Implementation Details
- **Dependency**: Add `@google-cloud/billing` to `package.json`.
- **Files**:
  - `nodes/GoogleCloudBilling/GoogleCloudBilling.node.ts`
  - `credentials/GoogleCloudBillingOAuth2Api.credentials.ts`
  - `nodes/GoogleCloudBilling/google-cloud-billing.svg`

## Testing Strategy
- **Manual Testing**: Create a workflow with the node and verify it can list/get billing accounts.
- **Unit Testing**: Mock the `@google-cloud/billing` client to verify node logic.

## Success Criteria
- Node appears in n8n.
- Users can authenticate via OAuth2.
- Users can list and get billing accounts.
