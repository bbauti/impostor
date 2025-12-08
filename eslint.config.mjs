// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

const isDev = process.env.NODE_ENV === 'development';

export default withNuxt(
  {
    files: ['**/*.ts', '**/*.js', '**/*.vue'],
    rules: {
      // Reglas básicas
      'no-console': isDev ? 'off' : 'error',
      'no-debugger': isDev ? 'off' : 'error',
      'no-nested-ternary': 'error',
      'curly': ['error', 'multi-line'],
      'no-constant-binary-expression': 'error',

      // Reglas de TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // Reglas de Vue
      'vue/padding-line-between-blocks': 'error',
      'vue/no-console': isDev ? 'off' : 'error',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-v-html': 'off',
      'vue/no-unused-vars': ['error', { ignorePattern: '^_' }]
    }
  }
);
