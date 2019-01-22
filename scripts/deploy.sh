#!/bin/bash

target=$1
version=$2
cluster=$3
service=$4
region=$5

echo "start deploying version $version on target $target"

# Login to the Docker registry
eval $(aws ecr get-login --no-include-email --region $region)

# Tag
docker tag "$target:$version" "$target:latest"

# Push the new image
docker push "$target:latest"
docker push "$target:$version"

echo "deployment succeeded";

node scripts/kill-tasks.js $cluster $service