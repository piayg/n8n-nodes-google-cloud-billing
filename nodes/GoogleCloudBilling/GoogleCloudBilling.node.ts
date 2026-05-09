import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { googleApiRequest, googleApiRequestAllItems } from './GenericFunctions';

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

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'billingAccount') {
					if (operation === 'get') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const responseData = await googleApiRequest.call(this, 'GET', name);
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					} else if (operation === 'getAll') {
						const accounts = await googleApiRequestAllItems.call(
							this,
							'billingAccounts',
							'GET',
							'billingAccounts',
						);
						const executionData = this.helpers.returnJsonArray(accounts);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					} else if (operation === 'update') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						const responseData = await googleApiRequest.call(this, 'PATCH', name, updateFields);
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					}
				} else if (resource === 'project') {
					if (operation === 'getBillingInfo') {
						let projectId = this.getNodeParameter('projectId', i) as string;
						// Sanitize project ID (remove 'projects/' prefix if present)
						projectId = projectId.startsWith('projects/') ? projectId.split('/')[1] : projectId;

						const endpoint = `projects/${projectId}/billingInfo`;
						const responseData = await googleApiRequest.call(this, 'GET', endpoint);
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					} else if (operation === 'listByAccount') {
						const name = this.getNodeParameter('billingAccountName', i) as string;
						const endpoint = `${name}/projects`;
						const projects = await googleApiRequestAllItems.call(
							this,
							'projectBillingInfo',
							'GET',
							endpoint,
						);
						const executionData = this.helpers.returnJsonArray(projects);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					} else if (operation === 'updateBillingInfo') {
						let projectId = this.getNodeParameter('projectId', i) as string;
						// Sanitize project ID
						projectId = projectId.startsWith('projects/') ? projectId.split('/')[1] : projectId;

						const newAccountName = this.getNodeParameter('newBillingAccountName', i) as string;
						const endpoint = `projects/${projectId}/billingInfo`;
						const body = {
							billingAccountName: newAccountName,
						};
						const responseData = await googleApiRequest.call(this, 'PUT', endpoint, body);
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					}
				} else if (resource === 'catalog') {
					if (operation === 'listServices') {
						const services = await googleApiRequestAllItems.call(this, 'services', 'GET', 'services');
						const executionData = this.helpers.returnJsonArray(services);
						for (const data of executionData) {
							data.pairedItem = { item: i };
						}
						returnData.push(...executionData);
					} else if (operation === 'listSkus') {
						const parent = this.getNodeParameter('serviceName', i) as string;
						const endpoint = `${parent}/skus`;
						const skus = await googleApiRequestAllItems.call(this, 'skus', 'GET', endpoint);
						const executionData = this.helpers.returnJsonArray(skus);
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
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
