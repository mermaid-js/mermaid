#!/usr/bin/env bash

if [ ! -f translation/po/en.pot ]; then
  touch translation/po/en.pot
fi

po4a translation/po4a.cfg
