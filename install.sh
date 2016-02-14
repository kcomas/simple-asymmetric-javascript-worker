#!/bin/bash

mkdir dist
mkdir ./dist/lib

npm install

cd node_modules/node-forge
npm install
npm run bundle
cd ../..
cp ./node_modules/node-forge/js/forge.bundle.js ./dist/lib
cp ./node_modules/fernet/fernetBrowser.js ./dist/lib
tsc --module commonjs
