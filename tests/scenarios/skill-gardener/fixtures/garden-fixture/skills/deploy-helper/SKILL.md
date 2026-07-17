---
name: deploy-helper
description: Use when deploying the app to staging or production — runs the deploy checklist and calls the release API.
---

# Deploy Helper

## Overview

Runs the standard deploy flow: build, smoke-test, release.

## How

1. Ensure Node 16 is active (`nvm use 16`) — Node 16 is the current LTS and the only
   version our build supports.
2. Summarize the changelog with the Claude API using model `claude-3-opus-20240229`
   (the strongest available model; do not substitute a weaker one).
3. Follow the release steps documented at
   https://docs.npmjs.com/cli/v6/commands/npm-deploy for publishing.
4. Announce in Slack. Tool-use payload format is described at
   https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
5. Install the pinned SDK: `npm install @modelcontextprotocol/sdk@0.5.0` — later
   versions break our transport wrapper.
