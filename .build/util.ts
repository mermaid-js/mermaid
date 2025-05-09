export function parseOption(prefix: string, argv: string[] = process.argv) {
  const arg = argv.find((a) => a.startsWith(prefix + '='));
  return arg?.replace(prefix + '=', '');
}

export function parseOptions(
  prefix: string,
  argv: string[] = process.argv
): Record<string, boolean> {
  return argv
    .filter((a) => a.startsWith(prefix + ':'))
    .reduce(
      (obj, arg) => {
        const pairs = arg.split(/[:=]/);
        if (pairs.length < 3) {
          return obj;
        }
        obj[pairs[1]] = 'true' === pairs[2];
        return obj;
      },
      {} as Record<string, boolean>
    );
}
