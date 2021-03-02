import {
	constructSlackMessage,
	FETCH_URL
} from '../utils';

/**
 * Sends GET to link shortening service to get links.
 *
 * @param path – parsed path string
 * @param url - parsed url string
 */
const getListUrl = (): Promise<Response> => {
	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		'x-preshared-key': SECRET_KEY,
	});

	return fetch(`${FETCH_URL}`, {
		method: 'GET',
		headers
	});
};

/**
 * Handles getting link list.
 * `/shorten`, and result is list of links.
 */
export default async () => {
	try {
		const response = await getListUrl();
		const shortenerText = await response.text();

		const blocks = constructSlackMessage(shortenerText);

		return new Response(
			JSON.stringify({
				blocks,
				response_type: 'in_channel',
			}),
			{ headers: { 'Content-type': 'application/json' } },
		);
	} catch (err) {
		const errorText =
			'The request failed, please try again in a minute`.';
		return new Response(err.message || errorText);
	}
};
