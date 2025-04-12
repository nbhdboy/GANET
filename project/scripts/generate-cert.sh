#!/bin/bash

# Create .cert directory if it doesn't exist
mkdir -p .cert

# Generate SSL certificate and key
openssl req -x509 -newkey rsa:2048 -keyout .cert/key.pem -out .cert/cert.pem -days 365 -nodes -subj "/CN=localhost" 