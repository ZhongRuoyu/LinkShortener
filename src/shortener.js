"use strict";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const PAGES_DIR = ["signin", "signin/"];
const RESERVED = [...PAGES_DIR];



addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const { pathname } = url;

    switch (request.method) {
        case "GET": {
            if (pathname === "/") {
                return new Response(null, {
                    status: 302,
                    headers: {
                        Location: "/signin/",
                    },
                });
            } else if (pathname === "/signin" || pathname === "/signin/") {
                return htmlSignIn();
            }
            return redirect(pathname.slice(1));
        }
        case "POST": {
            if (pathname !== "/") {
                return errBadRequest();
            }
            const body = await request.text();
            const params = new URLSearchParams(body);
            const html = params.get("html");
            if (html !== null) {
                return htmlAuthMain(params);
            } else {
                const cookie = request.headers.get("Cookie");
                const cookies = getCookies(cookie);
                const sessionId = cookies.session;
                return authMain(sessionId, params);
            }
        }
        default: {
            return errBadRequest();
        }
    }
}



async function redirect(alias) {
    const redirected = await STORAGE.get(alias);
    if (redirected === null) {
        return htmlNotFound();
    }
    return new Response(null, {
        status: 302,
        headers: {
            Location: redirected,
        },
    });
}

async function newRedirection(params) {
    const url = params.get("url");
    if (url === null || !validateURL(url)) {
        return errBadRequest();
    }

    let alias = params.get("alias");
    if (alias !== null) {
        if (RESERVED.indexOf(alias) !== -1) {
            return errConflict();
        }
        if (!validateAlias(alias)) {
            return errBadRequest();
        }
        const existing = await STORAGE.get(alias);
        if (existing !== null) {
            return errConflict();
        }
    } else {
        getHash:
        for (let length = 2; length <= 6; ++length) {
            for (let i = 0; i < 3; ++i) {
                const hashTry = await hashURL(url, length);
                const existing = await STORAGE.get(hashTry);
                if (existing === null) {
                    alias = hashTry;
                    break getHash;
                }
            }
        }
    }
    if (alias === null) {
        return errServiceUnavailable();
    }

    await STORAGE.put(alias, url);
    return new Response(alias, {
        status: 200,
    });
}



async function authorize(username, password) {
    const user = await AUTH.get(username);
    if (user === null) {
        return false;
    }
    const { salt, hash } = JSON.parse(user);
    const saltedPassword = password + salt;
    const hashResult = await digestMessage(saltedPassword);
    return hashResult === hash;

    async function digestMessage(message) {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-512", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
    }
}

async function authMain(sessionId, params) {
    let authResult;
    if (sessionId !== null) {
        authResult = await validateSession(sessionId);
    } else {
        const username = params.get("username");
        const password = params.get("password");
        if (username === null || password === null) {
            return errBadRequest();
        }
        authResult = await authorize(username, password);
    }
    if (!authResult) {
        return errUnauthorized();
    }
    return newRedirection(params);
}

async function htmlAuthMain(params) {
    const username = params.get("username");
    const password = params.get("password");
    if (username === null || password === null) {
        return htmlUnauthorized();
    }
    const authResult = await authorize(username, password);
    if (!authResult) {
        return htmlUnauthorized();
    }
    const sessionId = await newSession(username);
    return htmlMain(sessionId);
}



function getCookies(cookie) {
    const cookies = {};
    cookie.split("; ").forEach(pair => {
        const [name, value] = pair.split("=");
        cookies[name] = value;
    });
    return cookies;
}

async function newSession(username) {
    const sessionId = crypto.randomUUID();
    await SESSIONS.put(sessionId, username, { expirationTtl: 1800 });
    return sessionId;
}

async function validateSession(sessionId) {
    const session = await SESSIONS.get(sessionId);
    return session !== null;
}



function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

function validateAlias(alias) {
    return [].every.call(alias, char => BASE62.indexOf(char) !== -1);
}

async function hashURL(url, length) {
    const urlUint8 = new TextEncoder().encode(url);
    let urlUint = urlUint8.reduceRight((prev, curr) => prev * 256n + BigInt(curr), 0n);
    urlUint += BigInt(Math.floor(Math.random() * 65536));
    let result = "";
    while (urlUint != 0n) {
        result = BASE62[urlUint % 62n] + result;
        urlUint /= 62n;
    }
    return result.slice(-length);
}



function errBadRequest() {
    return new Response("400 Bad Request", { status: 400 });
}

function errUnauthorized() {
    return new Response("401 Unauthorized", { status: 401 });
}

function errNotFound() {
    return new Response("404 Not Found", { status: 404 });
}

function errConflict() {
    return new Response("409 Conflict", { status: 409 });
}

function errServiceUnavailable() {
    return new Response("503 Service Unavailable", { status: 503 });
}



async function htmlMain(sessionId) {
    const html = await PAGES.get("index.html");
    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "Set-Cookie": `session=${sessionId}`,
        },
    });
}

async function htmlSignIn() {
    const html = await PAGES.get("signin.html");
    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=UTF-8",
        },
    });
}

async function htmlUnauthorized() {
    const html = await PAGES.get("401.html");
    return new Response(html, {
        status: 401,
        headers: {
            "Content-Type": "text/html; charset=UTF-8",
        },
    });
}

async function htmlNotFound() {
    const html = await PAGES.get("404.html");
    return new Response(html, {
        status: 404,
        headers: {
            "Content-Type": "text/html; charset=UTF-8",
        },
    });
}
