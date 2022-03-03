# LinkShortener

LinkShortener is a simple authorization-based URL shortener.

## Features

LinkShortener can handle both browser access and direct API calls.

For browser access, authorization is session-based; each successful login is assigned a session ID, which expires in 30 minutes or on password change.

For API calls, authorization is password-based. Credentials need to be sent as the message body in the HTML form format (`application/x-www-form-urlencoded`).

LinkShortener works only under HTTPS to ensure security. It automatically redirects non-HTTPS requests (typically HTTP) to HTTPS.

## License

Copyright (c) 2022 Zhong Ruoyu. Licensed under [the MIT License](LICENSE).
