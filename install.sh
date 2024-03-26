#!/bin/bash
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:$PATH;
HOMEUSERNAME=`id -un`;
cd /home/${HOMEUSERNAME};
rm -rf cy4-fase0 2>/dev/null;
git clone https://github.com/niosz/cy4-fase0.git;
cd cy4-fase0;
npm install;
cat boot.sh | sed -E 's/@/'"$HOMEUSERNAME"'/g' > boot.tmp && mv boot.tmp boot.sh;
chmod +x boot.sh;
echo "INSTALLED";