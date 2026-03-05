// Alphanumerics with underscores, dashes, slashes, and dots
// Must start with an alphanumeric or an underscore
// Cant end with a dash, slash, or dot
terminal REFERENCE returns string: /\w([-\./\w]*[-\w])?/;