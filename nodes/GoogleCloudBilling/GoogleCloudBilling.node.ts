import { CloudBillingClient } from '@google-cloud/billing';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionTypes,
} from 'n8n-workflow';

export class GoogleCloudBilling implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Cloud Billing',
		name: 'googleCloudBilling',
		icon: 'file:google-cloud-billing.svg',
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Consume Google Cloud Billing API',
		defaults: {
			name: 'Google Cloud Billing',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
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
						name: 'Get Many',
						value: 'getAll',
						description: 'Retrieve many billing accounts',
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
				description:
					'The resource name of the billing account to retrieve. Format: billingAccounts/{ACCOUNT_ID}.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials for the first item (assuming same credentials for all items in this execution)
		const credentials = await this.getCredentials('googleCloudBillingOAuth2Api');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const accessToken = (credentials as any).oauthTokenData?.access_token;

		const client = new CloudBillingClient({
			authClient: {
				getRequestHeaders: async () => ({
					Authorization: `Bearer ${accessToken}`,
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
		});

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'billingAccount') {
					if (operation === 'get') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const [response] = await client.getBillingAccount({ name });
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						returnData.push({ json: response as any, pairedItem: { item: i } });
					} else if (operation === 'getAll') {
						const [accounts] = await client.listBillingAccounts();
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const executionData = this.helpers.returnJsonArray(accounts as any);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					returnData.push({ json: { error: (error as any).message }, pairedItem: { item: i } });
					continue;
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
