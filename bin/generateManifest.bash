#!/usr/bin/env bash

mkdir ./build/resources
cd ./build || exit

rm -f ./resources/manifest.txt

cd ../src || exit

nsFile=$(find . -type f -name "*.ts" -not -name "*.d.ts" | sort)
ignoreFile="^./cmd/synchronize/init-pull.ts$"

echo "$nsFile" | while read -r line; do
  if [ -n "${line}" ] && [[ ! "$line" =~ $ignoreFile ]]; then
    echo "$line" | cut -c 2- >> ../build/resources/manifest.txt
  fi
done

cd - || exit