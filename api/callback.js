// OAuth callback: exchanges the GitHub `code` for an access token and
// hands it to the CMS popup window via postMessage, following the
// handshake the Decap/Sveltia CMS "github" backend expects.
module.exports = async (req, res) => {
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const code = req.query.code;

    if (!clientId || !clientSecret) {
        res.status(500).send('Missing OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET environment variables.');
        return;
    }
    if (!code) {
        res.status(400).send('Missing authorization code.');
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
