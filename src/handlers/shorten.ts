const shortenRegex = /(?<path>\w*)\s+(?<url>[\S]+)/;
/**
 * Handles separating text passed with the slash command into path and url
 * 
 * @param text - The text that came with the slash command, should look like <path> <url>
 */
const parseShortenString = (text: string): RegExpMatchArray | null => {
	return text.trim().match(shortenRegex);
};

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

const compact = (array: string[]) => array.filter(el => el);

export const constructSlackMessage = (text: string) => {
	const text_lines = [text];

	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: compact(text_lines).join('\n'),
			},
		},
	];
};

const validSlackRequest = async (request: Request): Promise<boolean> => {
  try {
    // Grab raw body
    const requestBody = request.body;
    const timestamp = request.headers.get('X-Slack-Request-Timestamp')

    // Protect against replay attacks by checking if it's a request that's older than 5 minutes
    if (timestamp && Date.now() - new Date(timestamp).getTime() > 5 * 60 * 1000) {
      throw new Error("The request is old.")
    }

    const sigBasestring = `v0:${timestamp}:${requestBody}`;

    // Hash the basestring using signing secret as key, taking hex digest of hash. Uses Cloudflare's Web Crypto https://developers.cloudflare.com/workers/runtime-apis/web-crypto
    const msgUint8 = new TextEncoder().encode(sigBasestring)
    // Refer to https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Prepend to get full signature
    const fullSignature = `v0=${hashHex}`
    const slackSignature = request.headers.get('X-Slack-Signature')

    return fullSignature === slackSignature;
  } catch (err) {
    return false;
  }
}

/**
 * Handles shortening links. Expects the text to look like:
 * `/shorten <path> <url>`, and result in `vhl.ink/path`
 */
export default async (request: Request) => {
	try {
    if (!(await validSlackRequest(request))) {
      throw new Error("Request did not come from Slack.")
    }

		// https://api.slack.com/tutorials/slash-block-kit is more updated than the Cloudflare tutorial
		const formData = await request.formData();
    const text = formData.get('text');

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
