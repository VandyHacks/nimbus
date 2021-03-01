export const validSlackRequest = async (request: Request): Promise<boolean> => {
	try {
		// Grab raw body
		const requestBody = await request.clone().text(); // Have to clone since body can only be read once
		const timestamp = request.headers.get('X-Slack-Request-Timestamp');
		const [version, slackSignature] = request.headers.get('X-Slack-Signature')?.split("=") as String[];

		// Protect against replay attacks by checking if it's a request that's older than 5 minutes
		if (
			!timestamp ||
			Date.now() - new Date(timestamp).getTime() > 5 * 60 * 1000
		) {
			throw new Error('The request is old.');
		}

		const sigBasestring = `${version}:${timestamp}:${requestBody}`;

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

		if (version && slackSignature) {
			// Convert hex digest to Uint8Array
			const signatureUint8 = new Uint8Array(slackSignature.length / 2);
			for(let i = 0; i < slackSignature.length; i += 2) {
				signatureUint8[i / 2] = parseInt(slackSignature.slice(i, i + 2), 16);
			}

			// We want to verify that the slack signature matches what we hash with the key we made
			const result = await crypto.subtle.verify({name: "HMAC", hash: "SHA-256"}, key, signatureUint8, msgUint8);
			return result;
		}

		throw new Error('The signature was missing version or signature.')
	} catch (err) {
		console.log(err.message)
		return false;
	}
};

// Regex to match /shorten <path> <url>
const shortenRegex = /(?<path>[\w\d-]+)\s+(?<url>[\S]+)/;
/**
 * Handles separating text passed with the slash command into path and url
 *
 * @param text - The text that came with the slash command, should look like <path> <url>
 */
export const parseShortenString = (text: string): RegExpMatchArray | null => {
	return text.trim().match(shortenRegex);
};

// Regex to match /shorten delete <path> <key>
const deleteRegex = /(?<delete>[\w\d-]+)\s+(?<path>[\S]+)\s+(?<key>[\S]+)/;
/**
 * Handles separating text passed with the slash command into path, url, and key
 *
 * @param text - The text that came with the slash command, should look like <path> <url> <key>
 */
export const parseDeleteString = (text: string): RegExpMatchArray | null => {
	return text.trim().match(deleteRegex);
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

export const sendBotStatusMessage = async (text: string): Promise<Response> => {
	const resObject = {
		text,
		response_type: 'in_channel',
	};

	const botStatusResp = await fetch(SLACK_WEBHOOK_BOT_STATUS, {
		method: 'POST',
		body: JSON.stringify(resObject),
		headers: { 'Content-Type': 'application/json' },
	});

	if (botStatusResp.ok) {
		return botStatusResp;
	} else {
		throw new Error('Unable to send bot status message');
	}
};
