# Google Cloud Billing Node Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new n8n node for Google Cloud Billing with OAuth2 authentication and Billing Account resource support (List/Get).

**Architecture:** Programmatic-style n8n node using the official `@google-cloud/billing` library. Authentication is handled via a dedicated OAuth2 credential.

**Tech Stack:** TypeScript, n8n-workflow, @google-cloud/billing.

---

### Task 1: Project Setup & Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependency to package.json**

Add `@google-cloud/billing` to `dependencies` (or `devDependencies` if it's a peer dependency in your environment, but usually `dependencies` for community nodes).

```json
"dependencies": {
  "@google-cloud/billing": "^5.2.0"
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/@google-cloud/billing` exists.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add @google-cloud/billing dependency"
```

---

### Task 2: Google Cloud Billing OAuth2 Credentials

**Files:**
- Create: `credentials/GoogleCloudBillingOAuth2Api.credentials.ts`
- Modify: `package.json` (to register credentials if needed, though usually automatic via folder scanning in some setups, but we should check n8n config)

- [ ] **Step 1: Create the credential class**

```typescript
import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GoogleCloudBillingOAuth2Api implements ICredentialType {
	name = 'googleCloudBillingOAuth2Api';
	extends = ['oAuth2Api'];
	displayName = 'Google Cloud Billing OAuth2 API';
	documentationUrl = 'https://cloud.google.com/billing/docs/how-to/billing-access';
	properties: INodeProperties[] = [
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://accounts.google.com/o/oauth2/v2/auth',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://oauth2.googleapis.com/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'https://www.googleapis.com/auth/cloud-billing.readonly https://www.googleapis.com/auth/cloud-platform.read-only',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'access_type=offline&prompt=consent',
		},
	];
}
```

- [ ] **Step 2: Register credentials in package.json**

Check `package.json` and add to `n8n.credentials` if necessary.

- [ ] **Step 3: Commit**

```bash
git add credentials/GoogleCloudBillingOAuth2Api.credentials.ts package.json
git commit -m "feat: add Google Cloud Billing OAuth2 credentials"
```

---

### Task 3: Google Cloud Billing Node Structure & Description

**Files:**
- Create: `nodes/GoogleCloudBilling/GoogleCloudBilling.node.ts`
- Create: `nodes/GoogleCloudBilling/google-cloud-billing.svg`

- [ ] **Step 1: Add SVG icon** (Placeholder or copy from existing if available, here we'll assume a basic SVG)

- [ ] **Step 2: Create node class with description**

```typescript
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class GoogleCloudBilling implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Cloud Billing',
		name: 'googleCloudBilling',
		icon: 'file:google-cloud-billing.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Google Cloud Billing API',
		defaults: {
			name: 'Google Cloud Billing',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'googleCloudBillingOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Billing Account',
						value: 'billingAccount',
					},
				],
				default: 'billingAccount',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['billingAccount'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a billing account',
						action: 'Get a billing account',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many billing accounts',
						action: 'Get many billing accounts',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Billing Account Name or ID',
				name: 'billingAccountName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['billingAccount'],
						operation: ['get'],
					},
				},
				description: 'The resource name of the billing account to retrieve. Format: billingAccounts/{ACCOUNT_ID}.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Implementation in next task
		return [[]];
	}
}
```

- [ ] **Step 3: Register node in package.json**

Add `dist/nodes/GoogleCloudBilling/GoogleCloudBilling.node.js` to `n8n.nodes`.

- [ ] **Step 4: Commit**

```bash
git add nodes/GoogleCloudBilling/ package.json
git commit -m "feat: add Google Cloud Billing node description"
```

---

### Task 4: Node Implementation Logic

**Files:**
- Modify: `nodes/GoogleCloudBilling/GoogleCloudBilling.node.ts`

- [ ] **Step 1: Implement execute method**

```typescript
import { CloudBillingClient } from '@google-cloud/billing';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

// ... inside GoogleCloudBilling class ...

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('googleCloudBillingOAuth2Api');
		const client = new CloudBillingClient({
			authClient: await this.helpers.getOAuth2AccessToken('googleCloudBillingOAuth2Api'),
		});

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'billingAccount') {
					if (operation === 'get') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const [response] = await client.getBillingAccount({ name });
						returnData.push({ json: response, pairedItem: { item: i } });
					} else if (operation === 'getAll') {
						const [accounts] = await client.listBillingAccounts();
						const executionData = this.helpers.returnJsonArray(accounts);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
```

- [ ] **Step 2: Commit**

```bash
git add nodes/GoogleCloudBilling/GoogleCloudBilling.node.ts
git commit -m "feat: implement Google Cloud Billing node logic"
```

---

### Task 5: Build and Verification

**Files:**
- None (Command line only)

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: `dist/` directory contains the new node and credentials.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
# No changes to commit usually, unless lint fix was needed
```
