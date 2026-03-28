import js from 'crwdns829:0crwdne829:0';
import globals from 'crwdns831:0crwdne831:0';
import reactHooks from 'crwdns833:0crwdne833:0';
import reactRefresh from 'crwdns835:0crwdne835:0';
import tseslint from 'crwdns837:0crwdne837:0';
export default tseslint.config(
    {
        ignores: ['crwdns839:0crwdne839:0'],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['crwdns841:0crwdne841:0'],
        languageOptions: {
            ecmaVersion: 'crwdns843:0crwdne843:0',
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'crwdns845:0crwdne845:0',
                {
                    allowConstantExport: true,
                },
            ],
        },
    }
);
