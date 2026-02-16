// Claude proxy preload module - CommonJS for Node.js preload

const http = require('http');
const https = require('https');
const dns = require('dns');

const PROXY_HOST = '127.0.0.1';
const PROXY_PORT = 3333;

const REDIRECT_HOSTS = [
  'api.anthropic.com',
  '160.79.104.10',
  '34.36.57.103'
];

function shouldRedirect(host) {
  if (!host) return false;
  const h = host.split(':')[0];
  return REDIRECT_HOSTS.some(r => h === r || h.endsWith(r));
}

// Store originals
const origHttpRequest = http.request;
const origHttpsRequest = https.request;
const origDnsLookup = dns.lookup;

// Intercept HTTP
http.request = function(opts, cb) {
  const host = opts.hostname || opts.host;
  if (shouldRedirect(host)) {
    opts.hostname = PROXY_HOST;
    opts.port = PROXY_PORT;
    opts.headers = opts.headers || {};
    opts.headers['X-Original-Host'] = host;
  }
  return origHttpRequest.apply(this, arguments);
};

// Intercept HTTPS
https.request = function(opts, cb) {
  const host = opts.hostname || opts.host;
  if (shouldRedirect(host)) {
    opts.hostname = PROXY_HOST;
    opts.port = PROXY_PORT;
    opts.headers = opts.headers || {};
    opts.headers['X-Original-Host'] = host;
  }
  return origHttpsRequest.apply(this, arguments);
};

// Intercept DNS
dns.lookup = function(hostname, opts, cb) {
  if (shouldRedirect(hostname)) {
    return origDnsLookup('localhost', opts, cb);
  }
  return origDnsLookup.apply(this, arguments);
};

console.error('[PRELOAD] Proxy redirect active for:', REDIRECT_HOSTS.join(', '));
