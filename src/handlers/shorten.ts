import qs from 'qs'

// interface ShortenParams {
//     path: string
//     url: string
// }

const parseShortenString = (text: string): RegExpMatchArray | null => {
  return text.match('(?<path>\w*)\s+(?<url>.*)')
}

const postNewUrl = (path: string, url: string): Promise<Response> => {
  const fetchUrl = `https://vhl.ink`
  const body = new URLSearchParams()
  body.set('url', url)
  body.set('path', path)
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-preshared-key': SECRET_KEY,
  })
  return fetch(fetchUrl, { body, headers })
}

const compact = (array: string[]) => array.filter((el) => el)

export const constructSlackMessage = (text: string) => {
  //   const issue_link = `<${issue.html_url}|${issue_string}>`
  //   const user_link = `<${issue.user.html_url}|${issue.user.login}>`

  const text_lines = [text]

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: compact(text_lines).join('\n'),
      },
    },
  ]
}

/**
 * Handles shortening links. Expects the text to look like:
 * `/shorten <path> <url>`, and result in `vhl.ink/path`
 */
export default async (request: Request) => {
  try {
    const body = await request.text()
    const queryParams: qs.ParsedQs = qs.parse(body)
    const text = queryParams['text']

    // Ensure that we process a valid string
    if (typeof text === 'string') {
      const params: { [key: string]: string } | undefined = parseShortenString(
        text,
      )?.groups
      const path: string | undefined = params?.path
      const url: string | undefined = params?.url

      if (path && url) {
        const response = await postNewUrl(path, url)
        const res = await response.json()

        const blocks = constructSlackMessage(text)

        return new Response(
          JSON.stringify({
            blocks,
            response_type: 'in_channel',
          }),
          { headers: { 'Content-type': 'application/json' } },
        )
      }

      throw new Error()
    }
    throw new Error('Expected a string to be included in request.')
  } catch (err) {
    const errorText =
      'The request failed, please ensure that you are supplying options in the format `/shorten <path> <url>`.'
    return new Response(err.message || errorText)
  }
}
