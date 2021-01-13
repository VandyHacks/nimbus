# Nimbus

Slackbot that works with slash commands and a [URL shortener](https://github.com/VandyHacks/vhl.ink).

## Setup

- First, install packages in the directory of this repository running in the terminal:

`npm i`

- Configure development and secret keys by running `wrangler login` and replacing the `account_id` in [wrangler.toml](./wrangler.toml) with the `account_id` that 

### Secrets
You will need some secrets in order to make everything run properly. We use GitHub repository secrets, and you can use Cloudflare Wrangler Secrets for local secret development.
- Cloudflare API key with Wrangler permissions, as [described here](https://support.cloudflare.com/hc/en-us/articles/200167836-Managing-API-Tokens-and-Keys).
- The `SECRET_KEY` of the [URL shortener](https://github.com/VandyHacks/vhl.ink)

### Development
- Begin development on your local machine with:
`wrangler dev`

## Other information
- Generally, we followed this [Slackbot on Workers tutorial](https://developers.cloudflare.com/workers/tutorials/build-a-slackbot) published by Cloudflare, but using TypeScript rather than vanilla JavaScript. Follow that tutorial to configure Slack's slash commands.
- [Slack's reference on slash commands](https://api.slack.com/interactivity/slash-commands) also is very useful.

## Sample slash command usage
`/shorten <path> <url>` tells the link shortener to make it such that `vhl.ink/path` goes to `url` provided.

## Credits
- [TypeScript Cloudflare Workers template](https://github.com/cloudflare/worker-typescript-template)
- [TypeScript Wrangler Router Example](https://github.com/13rac1/cloudflare-ts-worker-template-router)

## 🔋 Template Documentation

This template is meant to be used with [Wrangler](https://github.com/cloudflare/wrangler). If you are not already familiar with the tool, we recommend that you install the tool and configure it to work with your [Cloudflare account](https://dash.cloudflare.com). Documentation can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler/).

### 👩 💻 Developing

[`src/index.js`](./src/index.ts) calls the request handler in [`src/handler.ts`](./src/handler.ts), and will return the [request method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) for the given request.

### 🧪 Testing

This template comes with mocha tests which simply test that the request handler can handle each request method. `npm test` will run your tests.

### ✏️ Formatting

This template uses [`prettier`](https://prettier.io/) to format the project. To invoke, run `npm run format`.

### 👀 Previewing and Publishing

For information on how to preview and publish your worker, please see the [Wrangler docs](https://developers.cloudflare.com/workers/tooling/wrangler/commands/#publish).

## 🤢 Issues

If you run into issues with this specific project, please feel free to file an issue [here](https://github.com/cloudflare/workers-typescript-template/issues). If the problem is with Wrangler, please file an issue [here](https://github.com/cloudflare/wrangler/issues).

## ⚠️ Caveats

The `service-worker-mock` used by the tests is not a perfect representation of the Cloudflare Workers runtime. It is a general approximation. We recommend that you test end to end with `wrangler dev` in addition to a [staging environment](https://developers.cloudflare.com/workers/tooling/wrangler/configuration/environments/) to test things before deploying.
