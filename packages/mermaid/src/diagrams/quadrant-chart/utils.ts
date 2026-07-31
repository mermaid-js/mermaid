class InvalidStyleError extends Error {
  constructor(style: string, value: string, type: string) {
    super(`value for ${style} ${value} is invalid, please use a valid ${type}`);
    this.name = 'InvalidStyleError';
  }
}

function validateHexCode(value: string): boolean {
  return !/^#?([\dA-Fa-f]{6}|[\dA-Fa-f]{3})$/.test(value);
}

function validateNumber(value: string): boolean {
  return !/^\d+$/.test(value);
}

function validateSizeInPixels(value: string): boolean {
  return !/^\d+px$/.test(value);
}

export { validateHexCode, validateNumber, validateSizeInPixels, InvalidStyleError };
