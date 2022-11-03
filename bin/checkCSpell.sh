#!/bin/sh

jq ".words|=(. | map(ascii_downcase) | sort | unique)" cSpell.json > cSpell.temp.json
npx prettier --write cSpell.temp.json
mv cSpell.temp.json cSpell.json