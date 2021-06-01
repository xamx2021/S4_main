#!/bin/bash
openssl genrsa -des3 -out amx.S4.key 1024


openssl req -new -key amx.S4.key -out amx.S4.csr


openssl x509 -req -days 365 -in amx.S4.csr -signkey amx.S4.key -out amx.S4.crt