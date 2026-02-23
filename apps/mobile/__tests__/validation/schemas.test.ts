import {
  validateEmail,
  validatePassword,
  validateHandle,
  validateDisplayName,
  validateBio,
} from '../../lib/validation/schemas';

describe('validateEmail', () => {
  it('returns null for valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
    expect(validateEmail('  USER@EXAMPLE.COM  ')).toBeNull();
  });

  it('returns error for empty or missing', () => {
    expect(validateEmail('')).toBe('Email is required.');
    expect(validateEmail('   ')).toBe('Email is required.');
  });

  it('returns error for invalid format', () => {
    expect(validateEmail('invalid')).toBe('Please enter a valid email.');
    expect(validateEmail('no@domain')).toBe('Please enter a valid email.');
    expect(validateEmail('@nodomain.com')).toBe('Please enter a valid email.');
  });

  it('returns error when too long', () => {
    const long = 'a'.repeat(250) + '@b.co';
    expect(validateEmail(long)).toBe('Email is too long.');
  });
});

describe('validatePassword', () => {
  it('returns null for valid password (8+ chars)', () => {
    expect(validatePassword('password')).toBeNull();
    expect(validatePassword('12345678')).toBeNull();
  });

  it('returns error for empty', () => {
    expect(validatePassword('')).toBe('Password is required.');
  });

  it('returns error when too short', () => {
    expect(validatePassword('short')).toBe('Password must be at least 8 characters.');
  });

  it('returns error when too long', () => {
    expect(validatePassword('a'.repeat(129))).toBe('Password is too long.');
  });
});

describe('validateHandle', () => {
  it('returns null for valid handle', () => {
    expect(validateHandle('user')).toBeNull();
    expect(validateHandle('user_123')).toBeNull();
    expect(validateHandle('  valid_handle  ')).toBeNull();
  });

  it('returns error for empty', () => {
    expect(validateHandle('')).toBe('Handle is required.');
    expect(validateHandle('   ')).toBe('Handle is required.');
  });

  it('returns error when too short', () => {
    expect(validateHandle('a')).toBe('Handle must be at least 2 characters.');
  });

  it('returns error when too long', () => {
    expect(validateHandle('a'.repeat(31))).toBe('Handle must be 30 characters or less.');
  });

  it('returns error for invalid characters', () => {
    expect(validateHandle('user-name')).toBe('Handle can only contain letters, numbers, and underscores.');
    expect(validateHandle('user name')).toBe('Handle can only contain letters, numbers, and underscores.');
  });
});

describe('validateDisplayName', () => {
  it('returns null for valid name', () => {
    expect(validateDisplayName('John Doe')).toBeNull();
    expect(validateDisplayName('  Jane  ')).toBeNull();
  });

  it('returns error for empty', () => {
    expect(validateDisplayName('')).toBe('Name is required.');
    expect(validateDisplayName('   ')).toBe('Name is required.');
  });

  it('returns error when too long', () => {
    expect(validateDisplayName('a'.repeat(101))).toBe('Name is too long.');
  });
});

describe('validateBio', () => {
  it('returns null for valid bio', () => {
    expect(validateBio('')).toBeNull();
    expect(validateBio('Short bio')).toBeNull();
    expect(validateBio('a'.repeat(500))).toBeNull();
  });

  it('returns error when too long', () => {
    expect(validateBio('a'.repeat(501))).toBe('Bio must be 500 characters or less.');
  });
});
