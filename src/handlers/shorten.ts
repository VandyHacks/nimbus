import {
	validSlackRequest,
	parseShortenString,
	constructSlackMessage,
	sendBotStatusMessage,
} from '../utils';

/**
 * Sends POST to link shortening service
 *
 * @param path – parsed path string
 * @param url - parsed url string
 */
const postNewUrl = (path: string, url: string): Promise<Response> => {
	const fetchUrl = `https://vhl.ink`;
	// Using https://github.com/node-fetch/node-fetch#post-with-form-parameters
	const params = new URLSearchParams();
	params.append('url', url);
	params.append('path', path);

	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		'x-preshared-key': SECRET_KEY,
	});

	return fetch(`${fetchUrl}`, {
		method: 'POST',
		headers,
		body: params,
	});
};

/**
 * Handles shortening links. Expects the text to look like:
 * `/shorten <path> <url>`, and result in `vhl.ink/path`
 */
export default async (request: Request) => {
	try {
		if (!(await validSlackRequest(request))) {
			throw new Error('Request did not come from Slack.');
		}

		// https://api.slack.com/tutorials/slash-block-kit is more updated than the Cloudflare tutorial
		const formData = await request.formData();
		const text = formData.get('text');
		const userName = formData.get('user_name');

		// Ensure that we process a valid string
		if (typeof text === 'string') {
			const params: { [key: string]: string } | undefined = parseShortenString(
				text,
			)?.groups;
			const path: string | undefined = params?.path;
			const url: string | undefined = params?.url;

			if (path && url) {
				const response = await postNewUrl(path, url);
				const shortenerText = await response.text();

				const blocks = constructSlackMessage(shortenerText);
				await sendBotStatusMessage(`${userName} shortened ${url} to https://vhl.link/${path}`);

				return new Response(
					JSON.stringify({
						blocks,
						response_type: 'in_channel',
					}),
					{ headers: { 'Content-type': 'application/json' } },
				);
			}

			throw new Error();
		}
		throw new Error('Expected a string to be included in request.');
	} catch (err) {
		const errorText =
			'The request failed, please ensure that you are supplying options in the format `/shorten <path> <url>`.';
		return new Response(err.message || errorText);
	}
};
