import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				// Placeholder for Task 4+ implementation
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(i)[0].json, error, pairedItem: i });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
