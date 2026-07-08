// OAuth callback: exchanges the GitHub `code` for an access token and
// hands it to the CMS popup window via postMessage, following the
// handshake the Decap/Sveltia CMS "github" backend expects.
function readCookie(req, name) {
    const header = req.headers.cookie;
    if (!header) return null;
    for (const part of header.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return rest.join('=');
    }
    return null;
}

module.exports = async (req, res) => {
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const code = req.query.code;
    const state = req.query.state;

    // Clear the state cookie on every response path so it can't be replayed.
    res.setHeader('Set-Cookie', 'oauth_state=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Lax');

    if (!clientId || !clientSecret) {
        res.status(500).send('Missing OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET environment variables.');
        return;
    }
    if (!code) {
        res.status(400).send('Missing authorization code.');
        return;
    }
    const expectedState = readCookie(req, 'oauth_state');
    if (!state || !expectedState || state !== expectedState) {
        res.status(400).send('Invalid or missing OAuth state.');
        return;
    }

    try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
        });
        const data = await tokenRes.json();

        if (data.error) {
            res.status(400).send('GitHub OAuth error: ' + (data.error_description || data.error));
            return;
        }

        // Build the postMessage string safely: JSON.stringify handles all
        // escaping, so the value is always a valid JS string literal below.
        const message = 'authorization:github:success:' + JSON.stringify({ token: data.access_token, provider: 'github' });
        const messageLiteral = JSON.stringify(message);

        const html = '<!DOCTYPE html><html><body><script>'
            + '(function () {'
            + '  function receiveMessage(e) {'
            + '    window.opener.postMessage(' + messageLiteral + ', e.origin);'
            + '    window.removeEventListener("message", receiveMessage, false);'
            + '  }'
            + '  window.addEventListener("message", receiveMessage, false);'
            + '  window.opener.postMessage("authorizing:github", "*");'
            + '})();'
            + '</script></body></html>';

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send('Authentication error: ' + err.message);
    }
};
