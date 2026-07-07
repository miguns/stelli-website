// OAuth entry point for the CMS login button.
// Redirects the browser to GitHub's authorize screen.
module.exports = (req, res) => {
    const clientId = process.env.OAUTH_CLIENT_ID;
    if (!clientId) {
        res.status(500).send('Missing OAUTH_CLIENT_ID environment variable.');
        return;
    }
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const redirectUri = proto + '://' + host + '/api/callback';
    const state = Math.random().toString(36).slice(2);

    const authorizeUrl = 'https://github.com/login/oauth/authorize'
        + '?client_id=' + encodeURIComponent(clientId)
        + '&redirect_uri=' + encodeURIComponent(redirectUri)
        + '&scope=repo'
        + '&state=' + encodeURIComponent(state);

    res.writeHead(302, { Location: authorizeUrl });
    res.end();
};
