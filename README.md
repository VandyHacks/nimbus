# Nimbus

Slack bot that works with slash commands and a [URL shortener, namely vhl.ink](https://github.com/VandyHacks/vhl.ink).

## Setup

- First, install packages in the directory of this repository running in the terminal:

`npm i`

- Read through [Cloudflare's Getting started guide](https://developers.cloudflare.com/workers/learning/getting-started) to begin setting up wrangler.
- Configure development and secret keys by running `wrangler login` and replacing the `account_id` in [wrangler.toml](./wrangler.toml) with your `account_id` as mentioned in the getting started guide.

### Secrets

You will need some secrets in order to make everything run properly. We use GitHub repository secrets, and you can use Cloudflare Wrangler Secrets for local secret development.

- Cloudflare API key with Wrangler permissions, as [described here](https://support.cloudflare.com/hc/en-us/articles/200167836-Managing-API-Tokens-and-Keys).
- The `SECRET_KEY` of the [URL shortener](https://github.com/VandyHacks/vhl.ink)
- Slack Signing Secret to verify requests. Refer to the section in the [block kit documentation linked above](https://api.slack.com/tutorials/slash-block-kit).

### Development

- Begin development on your local machine with:
  `wrangler dev`

## Other information

- Generally, we followed this [Slack bot on Workers tutorial](https://developers.cloudflare.com/workers/tutorials/build-a-slackbot) published by Cloudflare, but using TypeScript rather than vanilla JavaScript. Some of its information on Slack's slash commands are deprecated – [an article updated in January 2020 on Slack's Block Kit is more up-to-date.](https://api.slack.com/tutorials/slash-block-kit)
- [Slack's reference on slash commands](https://api.slack.com/interactivity/slash-commands) also is very useful.

## Slash command usage

- `/shorten` or `/shorten help` prints out slash command usage information.
- `/shorten <path> <url>` tells the link shortener to make `vhl.ink/path` go to `url`.
- `/shorten list` lists out all existing link paths.
- `/shorten delete <path> <key>` deletes `vhl.ink/path`, given that the correct secret `key` is passed in.

## Credits

- [TypeScript Cloudflare Workers template](https://github.com/cloudflare/worker-typescript-template)
- [TypeScript Wrangler Router Example](https://github.com/13rac1/cloudflare-ts-worker-template-router)
