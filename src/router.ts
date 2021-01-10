// Credits: https://github.com/13rac1/cloudflare-ts-worker-template-router

// Preliminary TS definitions
type HandlerCallback = (req: Request) => Promise<Response> | Response
type Condition = (req: Request) => boolean
interface Route {
  conditions: Condition | Array<Condition>
  handler: HandlerCallback
}

/**
 * Conditions are helper functions that when passed a request
 * will return a boolean for if that request uses
 * that method, header, etc..
 *
 * Since slash commands will only send POST requests to the specified URL, we
 * only really need to handle POST requests for now
 */
const Method = (method: string) => (req: Request) =>
  req.method.toLowerCase() === method.toLowerCase()
const Get = Method('get')
const Post = Method('post')
// const Patch = Method('patch')
// const Delete = Method('delete')
// const Head = Method('patch')
// const Put = Method('put')
// const Connect = Method('connect')
// const Options = Method('options')

// const Header = (header: string, val: string) => (req: Request) => req.headers.get(header) === val
// const Host = (host: string) => Header('host', host.toLowerCase())
// const Referrer = (host: string) => Header('referrer', host.toLowerCase())

const Path = (regExp: string) => (req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname
  const match = path.match(regExp) || []
  return match[0] === path
}

/**
 * Router handles the logic of what handler is matched given conditions
 * for each request
 */
export class Router {
  routes: Array<Route>
  constructor() {
    this.routes = []
  }

  handle(conditions: Condition | Array<Condition>, handler: HandlerCallback) {
    this.routes.push({
      conditions,
      handler,
    })
    return this
  }

  //   get(url: string, handler: HandlerCallback) {
  //     return this.handle([Get, Path(url)], handler)
  //   }

  post(url: string, handler: HandlerCallback) {
    return this.handle([Post, Path(url)], handler)
  }

  //   patch(url: string, handler: HandlerCallback) {
  //     return this.handle([Patch, Path(url)], handler)
  //   }

  //   delete(url: string, handler: HandlerCallback) {
  //     return this.handle([Delete, Path(url)], handler)
  //   }

  all(handler: HandlerCallback) {
    return this.handle([], handler)
  }

  route(req: Request): Promise<Response> | Response {
    const route = this.resolve(req)

    if (route) {
      return route.handler(req)
    }

    return new Response('resource not found', {
      status: 404,
      statusText: 'not found',
      headers: {
        'content-type': 'text/plain',
      },
    })
  }

  // resolve returns the matching route that returns true for
  // all the conditions if any
  resolve(req: Request) {
    return this.routes.find((r: Route) => {
      if (!r.conditions || (Array.isArray(r) && !r.conditions.length)) {
        return true
      }

      if (typeof r.conditions === 'function') {
        return r.conditions(req)
      }

      return r.conditions.every((c) => c(req))
    })
  }
}

export default Router
