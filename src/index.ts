import Router from './router';
import shorten from './handlers/shorten';

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
	const router = new Router();
	router.post('/shorten', shorten);

	let response = await router.route(request);

	if (!response) {
		response = new Response('Not found', { status: 404 });
	}

	return response;
}
