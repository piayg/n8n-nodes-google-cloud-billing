import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';

/**
 * Make an authenticated request to the Google Cloud Billing API.
 */
export async function googleApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const options: IHttpRequestOptions = {
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		url: `https://cloudbilling.googleapis.com/v1/${endpoint}`,
	};

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	return await this.helpers.httpRequestWithAuthentication.call(
		this,
		'googleCloudBillingOAuth2Api',
		options,
	);
}

/**
 * Make an authenticated request to the Google Cloud Billing API and return all items (pagination).
 */
export async function googleApiRequestAllItems(
	this: IExecuteFunctions,
	propertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const returnData: IDataObject[] = [];
	let responseData: IDataObject;
	const requestQs = { ...qs };
	requestQs.pageSize = 100;

	do {
		responseData = (await googleApiRequest.call(this, method, endpoint, body, requestQs)) as IDataObject;
		const items = responseData[propertyName] as IDataObject[];
		if (items) {
			returnData.push(...items);
		}
		requestQs.pageToken = responseData.nextPageToken as string | undefined;
	} while (requestQs.pageToken);

	return returnData;
}
