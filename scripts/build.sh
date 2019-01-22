#!/bin/bash
target=$1
version=$2

docker build -t "$target:$version" .
