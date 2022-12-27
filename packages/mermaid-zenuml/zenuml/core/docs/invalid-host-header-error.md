# Error message: Invalid Host header

It appears when we expose http://localhost:8080 as https://air.zenuml.com via Cloudflare
tunnels. We see this error on Chrome, Safari and Firefox.

## Where is this from?

It only happens when the site is served via `yarn start` and not when we serve it via
`http-server dist`. So it is most likely a configuration with the dev server.

## Solution

According to [this answer on StackOverflow](https://stackoverflow.com/a/43647767/529187),
we can add the following to `vue.config.js`:

```js
devServer: {
  allowedHosts: ['air.zenuml.com'];
}
```
