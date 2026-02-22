// Project eslint config: extend toolkit's TypeScript config and allow React Three Fiber
module.exports = {
  root: true,
  extends: ['@electron-toolkit/eslint-config-ts'],
  rules: {
    // React Three Fiber uses non-standard JSX props (rotation, args, intensity, etc.)
    // which trip the `react/no-unknown-property` rule. Disable it project-wide
    // to avoid false positives in .tsx files that render three.js elements.
    'react/no-unknown-property': 'off'
  }
}
