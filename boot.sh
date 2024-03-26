#!/bin/bash
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:$PATH;
export PATH=/home/installdemo/.nvm/versions/node/v18.17.0:$PATH;
cd /home/@/cy4-fase0;
node index.js > ../log.txt &