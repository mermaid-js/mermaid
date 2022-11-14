#!/usr/bin/env bash
sed "/mermaid: ''/d" pnpm-lock.yaml > temp.yaml; 
mv temp.yaml pnpm-lock.yaml