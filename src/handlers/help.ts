import {
	constructSlackMessage,
} from '../utils';

export default async () => {
	try {
		const blocks = constructSlackMessage(`
        \`/shorten help\`: show this help text
        \`/shorten list\`: list all shortened URLs
        \`/shorten <path> <url>\`: shorten \`<url>\` to https://vhl.ink/\`<path>\`
        \`/shorten delete <path> <key>\`: delete <path> (requires secret \`<key>\`)
        `);

		return new Response(
			JSON.stringify({
				blocks,
				response_type: 'in_channel',
			}),
			{ headers: { 'Content-type': 'application/json' } },
		);
	} catch (err) {
		const errorText =
			'The request failed, please yell in #dev.';
		return new Response(err.message || errorText);
	}
};
