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
const deleteOldUrl = (path: string): Promise<Response> => {
	const fetchUrl = `https://vhl.ink`;
	// Using https://github.com/node-fetch/node-fetch#post-with-form-parameters
	const params = new URLSearchParams();
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
		const deleteKW: string | undefined = params?.delete;
		const path: string | undefined = params?.path;
		const key: string | undefined = params?.key;

		if (deleteKW && path && key && deleteKW == "delete" && key == SECRET_KEY) {
			const response = await deleteOldUrl(path);
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

		throw new Error("Parameter mismatch! Please ensure that the format is `/shorten delete <path> <key>`");
	} catch (err) {
		const errorText =
			'The request failed, please ensure that you are supplying options in the format `/shorten <path> <url>`.';
		return new Response(err.message || errorText);
	}
};
