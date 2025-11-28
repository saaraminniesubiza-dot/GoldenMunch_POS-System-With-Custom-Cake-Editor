#!/bin/sh
# Start script for nginx with dynamic PORT support
# This script substitutes the PORT environment variable in nginx.conf.template

# Set default port if not provided by Render
PORT=${PORT:-10000}

echo "Starting nginx on port $PORT..."

# Substitute PORT in nginx.conf.template and output to actual nginx config
envsubst '${PORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Verify the configuration
echo "Generated nginx configuration:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start nginx in foreground
exec nginx -g 'daemon off;'
