export const validSlackRequest = async (request: Request): Promise<boolean> => {
	try {
		// Grab raw body
		const requestBody = request.body;
		const timestamp = request.headers.get('X-Slack-Request-Timestamp');

		// Protect against replay attacks by checking if it's a request that's older than 5 minutes
		if (
			timestamp &&
			Date.now() - new Date(timestamp).getTime() > 5 * 60 * 1000
		) {
			throw new Error('The request is old.');
		}

		const sigBasestring = `v0:${timestamp}:${requestBody}`;

		// Hash the basestring using signing secret as key, taking hex digest of hash. Uses Cloudflare's Web Crypto https://developers.cloudflare.com/workers/runtime-apis/web-crypto

		const encoder = new TextEncoder();
		const msgUint8 = encoder.encode(sigBasestring);
        // Refer to https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
        
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(SLACK_SIGNING_SECRET),
            { name: "HMAC", hash: "SHA-256"},
            false,
            ["verify"]
		)

		const signatureHeader = request.headers.get('X-Slack-Signature')?.split("=");
		const version = signatureHeader?.[0]
		const slackSignature = signatureHeader?.[1]

		if (version && slackSignature) {
			const signatureUint8 = encoder.encode(slackSignature)
			// We want to verify that hte slack signature matches what we hash with the key we made
			const result = await crypto.subtle.verify({name: "HMAC", hash: "SHA-256"}, key, signatureUint8, msgUint8);
			console.log(slackSignature)
			return result;
		}

		throw new Error('The signature was missing version or signature.')
	} catch (err) {
		console.log(err.message)
		return false;
	}
};

const shortenRegex = /(?<path>\w*)\s+(?<url>[\S]+)/;
/**
 * Handles separating text passed with the slash command into path and url
 *
 * @param text - The text that came with the slash command, should look like <path> <url>
 */
export const parseShortenString = (text: string): RegExpMatchArray | null => {
	return text.trim().match(shortenRegex);
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
