import {
	parseDeleteString,
	constructSlackMessage,
} from '../utils';

/**
 * Sends POST to link shortening service
 *
 * @param path – parsed path string
 * @param url - parsed url string
 */
const deleteOldUrl = (path: string, url: string): Promise<Response> => {
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
		method: 'DELETE',
		headers,
		body: params,
	});
};

/**
 * Handles shortening links. Expects the text to look like:
 * `/shorten <path> <url>`, and result in `vhl.ink/path`
 */
export default async (request: Request, text: string) => {
	try {
		// https://api.slack.com/tutorials/slash-block-kit is more updated than the Cloudflare tutorial
		const params: { [key: string]: string } | undefined = parseDeleteString(
			text,
		)?.groups;
		const path: string | undefined = params?.path;
		const url: string | undefined = params?.url;
		const key: string | undefined = params?.key;

		if (path && url && key && key == SECRET_KEY) {
			const response = await deleteOldUrl(path, url);
			const shortenerText = await response.text();

			const blocks = constructSlackMessage(shortenerText);

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
