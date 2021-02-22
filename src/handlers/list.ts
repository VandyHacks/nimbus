import {
	constructSlackMessage,
} from '../utils';

/**
 * Sends POST to link shortening service
 *
 * @param path – parsed path string
 * @param url - parsed url string
 */
const getListUrl = (): Promise<Response> => {
	const fetchUrl = `https://vhl.ink`;
	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		'x-preshared-key': SECRET_KEY,
	});

	return fetch(`${fetchUrl}`, {
		method: 'GET',
		headers
	});
};

/**
 * Handles shortening links. Expects the text to look like:
 * `/shorten <path> <url>`, and result in `vhl.ink/path`
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
