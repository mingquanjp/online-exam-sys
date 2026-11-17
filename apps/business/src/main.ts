import 'node:sqlite';

const args = process.argv.slice(2);

if (args.length === 1 && args[0] === '--version') {
  process.stderr.write(
    `exam-business 0.1.0 | Node ${process.versions.node} | SQLite ${process.versions.sqlite}\n`,
  );
} else {
  process.stderr.write('Usage: node dist/main.js --version\n');
  process.stderr.write('Business workspace foundation. Pipe startup and handlers are pending.\n');
  process.exitCode = 1;
}
