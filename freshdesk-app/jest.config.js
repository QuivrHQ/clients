module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setUpTests.js'],
  testEnvironment: 'jsdom',
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  transformIgnorePatterns: [
    '/node_modules/(?!(?:@freshworks/crayons)/)' // laissez Jest transpiler ce module
  ],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgrMock.js',
    '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules'
  },
  coverageReporters: [['json'], ['lcov']],
  testMatch: ['**/*.test.(js|jsx)'],
  testPathIgnorePatterns: ['<rootDir>/test/server.test.js']
}
