import { readFileSync } from 'fs';
import path from 'path';

/**
 * Guards against the Secret scan step silently going vacuous again.
 *
 * TruffleHog diffs its `base` against HEAD. On a pull request the base branch commit is only in
 * `github.event.pull_request.base.sha`, and the pnpm-setup composite action checks the repository out
 * itself with a shallow clone unless told otherwise — so that base commit is not present and the scan
 * has nothing to diff. Fetching the full history and falling back to the PR base sha is what makes the
 * scan real.
 */
const WORKFLOW_PATH = path.resolve(process.cwd(), '.github/workflows/publish.yml');

/** Top-level job keys (`  Validate:`) are indented two spaces; step list items (`      - name: ...`) six. */
const JOB_INDENT = 2;
const STEP_INDENT = 6;

function readWorkflow(): string {
  return readFileSync(WORKFLOW_PATH, 'utf8');
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** Everything after `startIndex` until a non-blank line indented at or above `indent`. */
function readBlock(lines: string[], startIndex: number, indent: number): string[] {
  const block: string[] = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim() !== '' && indentOf(line) <= indent) break;
    block.push(line);
  }
  return block;
}

/** The lines of a top-level job, up to the next job. */
function readJob(workflow: string, jobName: string): string[] {
  const lines = workflow.split('\n');
  const start = lines.findIndex(line => indentOf(line) === JOB_INDENT && line.trim() === `${jobName}:`);
  if (start < 0) throw new Error(`Job '${jobName}' not found in ${WORKFLOW_PATH}`);

  return readBlock(lines, start + 1, JOB_INDENT);
}

/** The lines of the step matching `predicate` inside a job. */
function readStep(jobLines: string[], predicate: (line: string) => boolean): string[] {
  const start = jobLines.findIndex(line => indentOf(line) === STEP_INDENT && predicate(line.trim()));
  if (start < 0) throw new Error(`Step not found in ${WORKFLOW_PATH}`);

  return readBlock(jobLines, start + 1, STEP_INDENT);
}

/** The value of a `name: value` line inside a step, with any YAML quotes removed. */
function readInput(stepLines: string[], inputName: string): string | undefined {
  const line = stepLines.find(candidate => candidate.trim().startsWith(`${inputName}:`));
  if (line == null) return undefined;

  return line.slice(line.indexOf(':') + 1).trim().replace(/^['"]|['"]$/g, '');
}

describe('publish workflow', () => {
  it('fetches the full history for the Validate job that runs the secret scan', () => {
    const validateJob = readJob(readWorkflow(), 'Validate');
    const setupStep = readStep(validateJob, line => line.startsWith('- uses: Anupheaus/agents/ci-templates/actions/pnpm-setup@v1'));

    expect(readInput(setupStep, 'fetch-depth')).to.equal('0');
  });

  it('runs on pull requests so the secret scan is exercised on PRs', () => {
    const hasPullRequestTrigger = readWorkflow().split('\n').some(line => line.trim() === 'pull_request:');

    expect(hasPullRequestTrigger).to.be.true;
  });

  it('falls back to the pull request base sha when github.event.before is empty', () => {
    const validateJob = readJob(readWorkflow(), 'Validate');
    const scanStep = readStep(validateJob, line => line === '- name: Secret scan');
    const scan = scanStep.join('\n');

    expect(scan).to.contain('uses: trufflesecurity/trufflehog@main');
    expect(readInput(scanStep, 'base')).to.contain('github.event.before');
    expect(readInput(scanStep, 'base')).to.contain('github.event.pull_request.base.sha');
  });

  it('keeps Publish on master so a PR cannot bump a version or publish', () => {
    const publishJob = readJob(readWorkflow(), 'Publish').join('\n');

    expect(publishJob).to.contain("github.ref == 'refs/heads/master'");
  });
});
