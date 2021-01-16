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
		const msgUint8 = new TextEncoder().encode(sigBasestring);
        // Refer to https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
        
        const key = await crypto.subtle.importKey(
            "raw",
            SLACK_SIGNING_SECRET,
            { name: "HMAC", hash: "SHA-256"},
            false,
            ["verify"]
        )

        // const expirationMs = 60000
        // const expiry = Date.now() + expirationMs
        // const dataToAuthenticate = url.pathname + expiry

        const encoder = new TextEncoder();

        const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToAuthenticate))

        // `mac` is an ArrayBuffer, so we need to jump through a couple of hoops to get
        // it into a ByteString, and then a Base64-encoded string.
        const base64Mac = btoa(String.fromCharCode(...new Uint8Array(mac)))

		const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map(b => b.toString(16).padStart(2, '0'))
			.join('');

		// Prepend to get full signature
		const fullSignature = `v0=${hashHex}`;
		const slackSignature = request.headers.get('X-Slack-Signature');
		console.log(slackSignature);
        console.log(fullSignature);
        
        const hmac = crypto.createHmac('sha256', signingSecret);
        const [version, hash] = signature.split('=');
        hmac.update(`${version}:${ts}:${body}`);

        // if (!timingSafeCompare(hash, hmac.digest('hex'))) {
        // debug('request signature is not valid');
        // throw errorWithCode(
        //     new Error('Slack request signing verification failed'),
        //     ErrorCode.SignatureVerificationFailure,
        // );
        // }

		return fullSignature === slackSignature;
	} catch (err) {
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
