import { CloudBillingClient, CloudCatalogClient, protos } from '@google-cloud/billing';
import { OAuth2Client } from 'google-auth-library';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface GoogleOAuth2Credentials extends IDataObject {
	oauthTokenData?: {
		access_token?: string;
		refresh_token?: string;
		expires_in?: number;
		token_type?: string;
	};
}

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
					{
						name: 'Catalog',
						value: 'catalog',
					},
					{
						name: 'Project',
						value: 'project',
					},
				],
				default: 'billingAccount',
			},

			// --- Billing Account Operations ---
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
						description: 'Retrieve many billing accounts',
						action: 'Get many billing accounts',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a billing account',
						action: 'Update a billing account',
					},
				],
				default: 'getAll',
			},

			// --- Project Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
				options: [
					{
						name: 'Get Billing Info',
						value: 'getBillingInfo',
						description: 'Get the billing information for a project',
						action: 'Get project billing info',
					},
					{
						name: 'Get Many',
						value: 'listByAccount',
						description: 'Lists the projects associated with a billing account',
						action: 'Get many projects',
					},
					{
						name: 'Update Billing Info',
						value: 'updateBillingInfo',
						description: 'Update the billing information for a project',
						action: 'Update project billing info',
					},
				],
				default: 'getBillingInfo',
			},

			// --- Catalog Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['catalog'],
					},
				},
				options: [
					{
						name: 'Get Many Services',
						value: 'listServices',
						description: 'List all public cloud services',
						action: 'Get many services',
					},
					{
						name: 'Get Many SKUs',
						value: 'listSkus',
						description: 'List all publicly available SKUs for a given cloud service',
						action: 'Get many skus',
					},
				],
				default: 'listServices',
			},

			// --- Parameters ---

			// billingAccountName (used for billingAccount:get, billingAccount:update, project:listByAccount)
			{
				displayName: 'Billing Account Name or ID',
				name: 'billingAccountName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['billingAccount', 'project'],
						operation: ['get', 'update', 'listByAccount'],
					},
				},
				description:
					'The resource name of the billing account. Format: billingAccounts/{ACCOUNT_ID}.',
			},

			// projectId (used for project:getBillingInfo, project:updateBillingInfo)
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['getBillingInfo', 'updateBillingInfo'],
					},
				},
				description: 'The ID of the project',
			},

			// serviceName (used for catalog:listSkus)
			{
				displayName: 'Service Name',
				name: 'serviceName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['listSkus'],
					},
				},
				description: 'The name of the service. Format: services/{SERVICE_ID}.',
			},

			// --- Update Fields ---

			// billingAccount:update
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['billingAccount'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Display Name',
						name: 'displayName',
						type: 'string',
						default: '',
						description: 'The display name for the billing account',
					},
				],
			},

			// project:updateBillingInfo
			{
				displayName: 'New Billing Account Name',
				name: 'newBillingAccountName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['updateBillingInfo'],
					},
				},
				description:
					'The name of the billing account to associate with the project. Format: billingAccounts/{ACCOUNT_ID}. To disassociate, use an empty string.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials(
			'googleCloudBillingOAuth2Api',
		)) as GoogleOAuth2Credentials;
		const accessToken = credentials.oauthTokenData?.access_token;

		if (!accessToken) {
			throw new NodeOperationError(this.getNode(), 'No access token found in credentials.');
		}

		// Initialize Standard OAuth2Client from google-auth-library
		// We pass it via 'authClient' in options, which is the correct property for an AuthClient instance.
		const authClient = new OAuth2Client();
		authClient.setCredentials({ access_token: accessToken });

		// Configure the clients to use REST mode and the provided auth client
		const clientOptions = {
			fallback: true,
			authClient,
		};

		const billingClient = new CloudBillingClient(clientOptions);
		const catalogClient = new CloudCatalogClient(clientOptions);

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'billingAccount') {
					if (operation === 'get') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const [response] = await billingClient.getBillingAccount({ name });
						returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
					} else if (operation === 'getAll') {
						const [accounts] = await billingClient.listBillingAccounts();
						const executionData = this.helpers.returnJsonArray(accounts as IDataObject[]);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					} else if (operation === 'update') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						const [response] = await billingClient.updateBillingAccount({
							name,
							account: updateFields as protos.google.cloud.billing.v1.IBillingAccount,
						});
						returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
					}
				} else if (resource === 'project') {
					if (operation === 'getBillingInfo') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						const name = `projects/${projectId}`;
						const [response] = await billingClient.getProjectBillingInfo({ name });
						returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
					} else if (operation === 'listByAccount') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const [projects] = await billingClient.listProjectBillingInfo({ name });
						const executionData = this.helpers.returnJsonArray(projects as IDataObject[]);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					} else if (operation === 'updateBillingInfo') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						const newAccountName = this.getNodeParameter('newBillingAccountName', i) as string;
						const name = `projects/${projectId}`;
						const [response] = await billingClient.updateProjectBillingInfo({
							name,
							projectBillingInfo: {
								billingAccountName: newAccountName,
							},
						});
						returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
					}
				} else if (resource === 'catalog') {
					if (operation === 'listServices') {
						const [services] = await catalogClient.listServices();
						const executionData = this.helpers.returnJsonArray(services as IDataObject[]);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					} else if (operation === 'listSkus') {
						const parent = this.getNodeParameter('serviceName', i) as string;
						const [skus] = await catalogClient.listSkus({ parent });
						const executionData = this.helpers.returnJsonArray(skus as IDataObject[]);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
