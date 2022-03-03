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

## License

Copyright (c) 2022 Zhong Ruoyu. Licensed under [the MIT License](LICENSE).
