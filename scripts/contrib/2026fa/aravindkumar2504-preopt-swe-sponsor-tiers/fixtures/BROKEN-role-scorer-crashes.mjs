// A deliberately failing stand-in for the scorer, used only by break tests.
process.stderr.write('simulated scorer crash\n');
process.exit(3);
