import {
	parseShortenString,
	constructSlackMessage,
	sendBotStatusMessage,
	FETCH_URL,
} from '../utils';

/**
 * Sends POST to link shortening service
 *
 * @param path – parsed path string
 * @param url - parsed url string
 */
const postNewUrl = (path: string, url: string): Promise<Response> => {
	// Using https://github.com/node-fetch/node-fetch#post-with-form-parameters
	const params = new URLSearchParams();
	params.append('url', url);
	params.append('path', path);

	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		'x-preshared-key': SECRET_KEY,
	});

	return fetch(`${FETCH_URL}`, {
		method: 'POST',
		headers,
		body: params,
	});
};

/**
 * Handles shortening links. Expects the text to look like:
 * `/shorten <path> <url>`, and result in `vhl.ink/path`
 */
export default async (formData: FormData, text: string) => {
	try {
		// https://api.slack.com/tutorials/slash-block-kit is more updated than the Cloudflare tutorial
		const params: { [key: string]: string } | undefined = parseShortenString(
			text,
		)?.groups;
		const path: string | undefined = params?.path;
		const url: string | undefined = params?.url;
    
		const userName = formData.get('user_name');

		if (path && url) {
			const response = await postNewUrl(path, url);
			const shortenerText = await response.text();

			const blocks = constructSlackMessage(shortenerText);
			await sendBotStatusMessage(`${userName} shortened ${url} to ${FETCH_URL}/${path}`);

			return new Response(
				JSON.stringify({
					blocks,
					response_type: 'in_channel',
				}),
				{ headers: { 'Content-type': 'application/json' } },
			);
		}

		throw new Error();
	} catch (err) {
		const errorText =
			'The request failed, please ensure that you are supplying options in the format `/shorten <path> <url>`.';
		return new Response(err.message || errorText);
	}
};
