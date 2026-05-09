# Google Cloud Billing Task 2 Fixes and Task 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix lint errors in credentials and example node, and implement the main Google Cloud Billing node structure.

**Architecture:** Programmatic node style for Google Cloud Billing, following n8n standards for resource/operation mapping.

**Tech Stack:** TypeScript, n8n-workflow, Google Cloud Billing API client.

---

### Task 1: Fix Task 2 Lint Errors in Credentials

**Files:**
- Modify: `credentials/GoogleCloudBillingOAuth2Api.credentials.ts`

- [ ] **Step 1: Add icon and update documentationUrl**

```typescript
import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GoogleCloudBillingOAuth2Api implements ICredentialType {
	name = 'googleCloudBillingOAuth2Api';
	extends = [
		'oAuth2Api',
	];
	displayName = 'Google Cloud Billing OAuth2 API';
	documentationUrl = 'https://cloud.google.com/billing/docs/apis';
	icon = 'file:google-cloud-billing.svg';
	properties: INodeProperties[] = [
// ... rest remains same
```

- [ ] **Step 2: Commit fixes**

```bash
git add credentials/GoogleCloudBillingOAuth2Api.credentials.ts
git commit -m "fix(credentials): add icon and update documentationUrl"
```

### Task 2: Fix Lint Errors in Example Node

**Files:**
- Modify: `nodes/Example/Example.node.ts`

- [ ] **Step 1: Add subtitle to Example node description**

```typescript
export class Example implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Example',
		name: 'example',
		icon: { light: 'file:example.svg', dark: 'file:example.dark.svg' },
		group: ['input'],
		version: [1],
		subtitle: '={{$parameter["myString"]}}',
		description: 'Basic Example Node',
// ...
```

- [ ] **Step 2: Commit fixes**

```bash
git add nodes/Example/Example.node.ts
git commit -m "fix(nodes): add subtitle to Example node"
```

### Task 3: Create Google Cloud Billing Node Assets

**Files:**
- Create: `nodes/GoogleCloudBilling/google-cloud-billing.svg`

- [ ] **Step 1: Create placeholder SVG**

```bash
mkdir -p nodes/GoogleCloudBilling
cat <<EOF > nodes/GoogleCloudBilling/google-cloud-billing.svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="#4285F4" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
</svg>
EOF
```

- [ ] **Step 2: Commit SVG**

```bash
git add nodes/GoogleCloudBilling/google-cloud-billing.svg
git commit -m "feat(nodes): add Google Cloud Billing icon"
```

### Task 4: Implement Google Cloud Billing Node Structure

**Files:**
- Create: `nodes/GoogleCloudBilling/GoogleCloudBilling.node.ts`

- [ ] **Step 1: Implement basic programmatic node structure**

```typescript
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class GoogleCloudBilling implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Cloud Billing',
		name: 'googleCloudBilling',
		icon: 'file:google-cloud-billing.svg',
		group: ['transform'],
		version: [1],
		description: 'Consume Google Cloud Billing API',
		defaults: {
			name: 'Google Cloud Billing',
		},
		inputs: ['main'],
		outputs: ['main'],
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
						resource: [
							'billingAccount',
						],
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
						name: 'Get All',
						value: 'getAll',
						description: 'Retrieve all billing accounts',
						action: 'Get all billing accounts',
					},
				],
				default: 'getAll',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Placeholder for Task 4+ implementation
		return [[]];
	}
}
```

- [ ] **Step 2: Commit node implementation**

```bash
git add nodes/GoogleCloudBilling/GoogleCloudBilling.node.ts
git commit -m "feat(nodes): implement Google Cloud Billing node structure"
```

### Task 5: Register Node and Finalize

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add node to package.json**

```json
		"nodes": [
			"dist/nodes/Example/Example.node.js",
			"dist/nodes/GoogleCloudBilling/GoogleCloudBilling.node.js"
		]
```

- [ ] **Step 2: Run lint to verify fixes**

Run: `npm run lint`

- [ ] **Step 3: Commit and Finish**

```bash
git add package.json
git commit -m "chore(package): register GoogleCloudBilling node"
```
