import {
	parseDeleteString,
	constructSlackMessage,
} from '../utils';

/**
 * Sends DELETE to link to delete it.
 *
 * @param path – parsed path string
 * @param url - parsed url string
 */
const deleteOldUrl = (path: string): Promise<Response> => {
	const fetchUrl = `https://vhl.ink/${path}`;

	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		'x-preshared-key': SECRET_KEY,
	});

	return fetch(`${fetchUrl}`, {
		method: 'DELETE',
		headers
	});
};

/**
 * Handles deleting links. Expects the text to look like:
 * `/shorten delete <path> <key>`, and deletes link when run.
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

		if (deleteKW === "delete" && path && key === SECRET_KEY) {
			await deleteOldUrl(path);
			return new Response(`${path} deleted!`);
		}

		throw new Error("Parameter mismatch! Please ensure that the format is `/shorten delete <path> <key>`");
	} catch (err) {
		const errorText =
			'The request failed, please ensure that you are supplying options in the format `/shorten <path> <url>`.';
		return new Response(err.message || errorText);
	}
};
