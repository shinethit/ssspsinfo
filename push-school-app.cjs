// push-school-app.cjs — Private School App (SSSPS Info) git commit + push
// RUN: place this file in the project root (next to package.json) and run:
//   node push-school-app.cjs [--dry-run] [--message "your message"]
// It runs typecheck + build first (stops if either fails), then commits
// all changes and pushes to GitHub. Cloudflare Pages auto-deploys on push.
// --dry-run prints what it would do without committing or pushing.
// Git is run WITHOUT a shell (Windows-safe: commit messages with spaces
// work correctly). Only npm needs a shell (npm.cmd shim on Windows).
const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXPECTED_REMOTE = 'https://github.com/shinethit/ssspsinfo.git';
const DEFAULT_MESSAGE = 'v24.4: main chunk split, tests, cleanup - version history updated';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const msgIdx = args.indexOf('--message');
const message = msgIdx >= 0 && args[msgIdx + 1] ? args[msgIdx + 1] : DEFAULT_MESSAGE;

function log(tag, msg) { console.log('[' + tag + '] ' + msg); }
function fail(msg) { console.error('[ERROR] ' + msg); process.exit(1); }
function runNpm(cmd, label) {
  log('RUN', label + ': ' + cmd);
  if (dryRun) { log('DRY-RUN', 'would run: ' + cmd); return true; }
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true });
    log('OK', label + ' passed');
    return true;
  } catch (e) {
    log('FAIL', label + ' failed (see output above)');
    return false;
  }
}
const READ_ONLY = new Set(['remote', 'branch', 'status']);
function git(gitArgs, label) {
  // In dry-run mode, read-only git commands still run for real (so the
  // preview shows the true remote/branch/status); only add/commit/push
  // are skipped.
  if (dryRun && !READ_ONLY.has(gitArgs[0])) {
    log('DRY-RUN', 'would run: git ' + gitArgs.join(' '));
    return '';
  }
  try {
    return execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    fail((label || 'git ' + gitArgs.join(' ')) + ' failed: ' + (e.stdout || e.message || e));
    return '';
  }
}

// Sanity checks
if (!fs.existsSync(path.join(ROOT, 'package.json')) || !fs.existsSync(path.join(ROOT, 'src', 'pages', 'Admin.tsx'))) {
  fail('Project root not found. Run this script from the project folder (D:\\ssspsinfo-main).');
}
if (!fs.existsSync(path.join(ROOT, '.git'))) {
  fail('No .git folder found here. Run this script from the folder that has the git repo (the one you cloned from GitHub).');
}
const remote = git(['remote', 'get-url', 'origin'], 'read git remote').trim();
if (remote && remote !== EXPECTED_REMOTE) {
  console.log('[WARN] origin is ' + remote + ' (expected ' + EXPECTED_REMOTE + '). Continuing anyway — check this is the right repo.');
} else if (!remote) {
  fail('No git remote named origin. Add it first: git remote add origin ' + EXPECTED_REMOTE);
}
const branch = git(['branch', '--show-current'], 'read branch').trim() || 'main';
log('INFO', 'Branch: ' + branch + ' | Remote: ' + (remote || EXPECTED_REMOTE));
if (dryRun) log('DRY-RUN', 'dry run — nothing will be committed or pushed.');

// Safety: typecheck + build must pass before pushing
if (!runNpm('npm run lint', 'typecheck')) fail('Typecheck failed — fix the errors before pushing.');
if (!runNpm('npm run build', 'build')) fail('Build failed — fix the errors before pushing.');

git(['add', '-A'], 'stage changes');
const status = git(['status', '--porcelain'], 'read git status').trim();
if (!status) {
  console.log('[DONE] Nothing to commit — working tree is clean. Nothing was pushed.');
  process.exit(0);
}
console.log('[INFO] Files to commit:');
console.log(status.split('\n').map((l) => '  ' + l).join('\n'));
if (dryRun) {
  log('DRY-RUN', 'would commit with message: ' + message);
  log('DRY-RUN', 'would push branch ' + branch + ' to origin.');
  process.exit(0);
}
git(['commit', '-m', message], 'git commit');
const pushed = git(['push', 'origin', branch], 'git push');
console.log('---');
console.log('[DONE] Pushed branch ' + branch + ' to GitHub. Cloudflare Pages will auto-deploy from this push.');
console.log('[NOTE] Check the deploy at https://github.com/shinethit/ssspsinfo/actions or in the Cloudflare dashboard.');
