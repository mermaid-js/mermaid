export function parseOption(prefix: string, argv: string[] = process.argv) {
  const arg = argv.find((a) => a.startsWith(prefix + '='));
  return arg?.replace(prefix + '=', '');
}
