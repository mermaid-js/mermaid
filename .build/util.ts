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
        const arr = arg.split(/[:=]/);
        if (arr.length < 3) {
          return obj;
        }
        obj[arr[1]] = 'true' === arr[2];
        return obj;
      },
      {} as Record<string, boolean>
    );
}
