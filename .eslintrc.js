module.exports = {
    "extends": ["google", "eslint:recommended"],
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "rules": {
    	"padded-blocks" : 0,
    	"keyword-spacing" : 0,
        "no-console" : 0,
    },
    "env": {
        "node": true,
        "es6": true
    }
};