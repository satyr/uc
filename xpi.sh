#!/bin/sh
rm -v uc.xpi
cd uc
zip ../uc.xpi $(git ls-files .)
