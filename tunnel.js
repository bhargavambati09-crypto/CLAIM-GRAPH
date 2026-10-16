const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 8000, subdomain: 'claimgraph-intel' });
    console.log('PUBLIC_URL:' + tunnel.url);
    tunnel.on('close', () => {
      console.log('Tunnel connection closed.');
    });
    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
    // Keep process alive indefinitely
    setInterval(() => {}, 60000);
  } catch (err) {
    console.error('Failed to open tunnel:', err);
  }
})();
