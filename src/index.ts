import Router from './router';
import shorten from './handlers/shorten';
import list from './handlers/list';

import {
	validSlackRequest,
} from './utils';

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function route(request: Request) {
	try {
		if (!(await validSlackRequest(request))) {
			throw new Error('Request did not come from Slack.');
		}

		const formData = await request.formData();
		const text = formData.get('text');

		if (typeof text === 'string') {
			const args = text.split(" ");

			if (args.length == 0) {
				return list(request, text);
			} else if (args.length == 2) {
				return shorten(request, text);
			} else if (args.length == 3) {
				// DELETE route
			}

			throw new Error();
		}

		throw new Error();
	} catch (err) {
		const errorText =
			'The request failed; please ensure that you are supplying options correctly.';
		return new Response(err.message || errorText);
	}
	
}

async function handleRequest(request: Request): Promise<Response> {
	const router = new Router();
	router.post('/shorten', route);

	let response = await router.route(request);

	if (!response) {
		response = new Response('Not found', { status: 404 });
	}

	return response;
}
