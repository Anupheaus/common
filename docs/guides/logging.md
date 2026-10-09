# Logging with @anupheaus/common

> How to add and read logs with the Logger from @anupheaus/common, and where the log service's own docs live.
>
> Status: accepted · Version 1

## What lives here

`Logger` is part of this repo (`@anupheaus/common`) and is used across the stack, so the rules about levels and `meta` belong here. The log aggregation service and its MCP tooling are **not** part of this repo: they belong to the application that runs them, and that application documents them.

## Adding logs

- "Add more logging" means permanent `Logger` calls — `silly`, `debug`, `info`, `warn`, `error` — never temporary `console.log`.
- Pass useful `meta` (record ids, counts, durations, provider names) so a line can be filtered without re-running the flow.
- Match the level to the audience: `silly`/`debug` for developer detail, `info` for lifecycle, `warn`/`error` for something a human must act on.

## Reading logs

- "Look through the logs" or "read the logs" means query the project's log aggregation service through its MCP server — not the terminal, the browser console, or local log files.
- Only the app that hosts that service documents its connection and maintenance steps: do not repeat them here.
