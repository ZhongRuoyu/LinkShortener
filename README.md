# LinkShortener

LinkShortener is a simple authorization-based URL shortener.

## Features

LinkShortener can handle both browser access and direct API calls.

For browser access, authorization is session-based; each successful login is assigned a session ID, which expires in 30 minutes or on password change.

For API calls, authorization is password-based. Credentials need to be sent as the message body in the HTML form format (`application/x-www-form-urlencoded`).

LinkShortener works only under HTTPS to ensure security. It automatically redirects non-HTTPS requests (typically HTTP) to HTTPS.

## API Usage

Accessing LinkShortener via API calls requires the following parameters:

| Key        | Value                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `username` | The username registered.                                                                             |
| `password` | The password registered.                                                                             |
| `url`      | The URL to be shortened.                                                                             |
| `alias`    | (Optional) The alias (path) of the shortened URL. If not supplied, a random alias will be generated. |

A caller may expect one of the following responses:

| Response status code      | Body                           | Description                                                                                               |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `200 OK`                  | The alias of the shortened URL | The shortened link is successfully created.                                                               |
| `400 Bad Request`         | `400 Bad Request`              | The request is malformed. This can happen due to missing parameters, an invalid URL, or an invalid alias. |
| `401 Unauthorized`        | `401 Unauthorized`             | The credentials supplied are invalid.                                                                     |
| `409 Conflict`            | `409 Conflict`                 | The alias supplied is already taken.                                                                      |
| `503 Service Unavailable` | `503 Service Unavailable`      | Could not find a suitable alias. This should only happen due to congestion.                               |

## Deployment Instructions

LinkShortener can be deployed directly on [Cloudflare Workers](https://workers.cloudflare.com). A set of demo pages are provided in [demo/](demo/), and you are welcome to deploy your own.

### Installing Wrangler

To deploy, install Wrangler first. To install with `npm`:

```bash
npm i @cloudflare/wrangler -g
```

Other installatin instructions for Wrangler can be found [here](https://developers.cloudflare.com/workers/cli-wrangler/install-update/).

After having Wrangler installed, authenticate yourself. Instructions are available [here](https://developers.cloudflare.com/workers/cli-wrangler/authentication/).

### Configuring KV Namespaces

Create the KV namespaces required:

```bash
wrangler kv:namespace create "STORAGE"
wrangler kv:namespace create "AUTH"
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "PAGES"
```

For each namespace created, put its configuration into [`wrangler.toml`](wrangler.toml), as displayed.

Then, put the required pages into the `PAGES` KV namespace:

```bash
wrangler kv:key put --binding=PAGES "index.html" "$(cat demo/index.html)"
wrangler kv:key put --binding=PAGES "signin.html" "$(cat demo/signin.html)"
wrangler kv:key put --binding=PAGES "401.html" "$(cat demo/401.html)"
wrangler kv:key put --binding=PAGES "404.html" "$(cat demo/404.html)"
```

### Publishing the Worker

Finally, publish the Worker:

```bash
wrangler publish
```

### Wrangler References

For more information about Wrangler, please visit [Cloudflare Docs](https://developers.cloudflare.com/workers/cli-wrangler/).

## About Authentication

LinkShortener has shared some code from [WebAuth](https://github.com/ZhongRuoyu/WebAuth) for its authentication. It adds an 8-byte salt to the password before hashing it with SHA-512 and storing it into the database, which ensures that the passwords can be kept securely enough. On password change, to ensure security, WebAuth would invalidate all the existing sessions.

Sharing code with WebAuth also means that the same credentials can be shared across different services, if the same namespace and authentication method is used.

Due to Cloudflare's [restrictions](https://developers.cloudflare.com/workers/runtime-apis/fetch/), however, it is currently not possible to send fetch requests from one Worker to another Worker within the same zone. Therefore, it is not currently feasible to deploy WebAuth, and call it from here, in order to enable account registration and other functionalities. This is the reason why 

A workaround would be to incorporate the required functionalities into this Worker.

## License

Copyright (c) 2022 Zhong Ruoyu. Licensed under [the MIT License](LICENSE).
