import js from "@eslint/js";
import globals from "globals";
import stylistic from '@stylistic/eslint-plugin';
import html from "eslint-plugin-html";

export default [
  {
    ignores: [
      "**/*.{js,cjs}",
      "!lib/ical/**/*.{js,cjs}",
      "!test/**/*.{js,cjs}",
      "!tools/scriptutils.js",
      "!tools/ICALTester/**/*.js",
      "!tools/jsdoc-ical.cjs",
      "!eslint.config.js",
      "!rollup.config.js",
      "!karma.conf.cjs"
    ]
  },
  js.configs.recommended,
  {
    plugins: {
      "@stylistic": stylistic
    },
    languageOptions: {
      globals: {
        ...globals.es2021
      }
    },
    rules: {
      // Enforce one true brace style (opening brace on the same line)
      // Allow single line (for now) because of the vast number of changes needed
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],

      // Enforce newline at the end of file, with no multiple empty lines.
      "@stylistic/eol-last": "error",

      // Disallow using variables outside the blocks they are defined
      //"block-scoped-var": "error",

      // Allow trailing commas for easy list extension.  Having them does not
      // impair readability, but also not required either.
      "@stylistic/comma-dangle": 0,

      // Enforce spacing before and after comma
      "@stylistic/comma-spacing": ["error", { before: false, after: true }],

      // Enforce one true comma style.
      "@stylistic/comma-style": ["error", "last"],

      // Enforce curly brace conventions for all control statements.
      //"curly": "error",

      // Enforce the spacing around the * in generator functions.
      "@stylistic/generator-star-spacing": ["error", "after"],

      // Require space before/after arrow function's arrow
      "@stylistic/arrow-spacing": ["error", { before: true, after: true }],

      // Enforces spacing between keys and values in object literal properties.
      "@stylistic/key-spacing": ["error", { beforeColon: false, afterColon: true, mode: "minimum" }],

      // Disallow the omission of parentheses when invoking a constructor with no
      // arguments.
      "@stylistic/new-parens": "error",

      // Disallow use of the Array constructor.
      "no-array-constructor": "error",

      // disallow use of the Object constructor
      "no-object-constructor": "error",

      // Disallow Primitive Wrapper Instances
      "no-new-wrappers": "error",

      // Disallow adding to native types
      "no-extend-native": "error",

      // Disallow unnecessary semicolons.
      "@stylistic/no-extra-semi": "error",

      // Disallow mixed spaces and tabs for indentation.
      "@stylistic/no-mixed-spaces-and-tabs": "error",

      // Disallow comparisons where both sides are exactly the same.
      "no-self-compare": "error",

      // Disallow trailing whitespace at the end of lines.
      "@stylistic/no-trailing-spaces": "error",

      // disallow use of octal escape sequences in string literals, such as
      // var foo = "Copyright \251";
      "no-octal-escape": "error",

      // disallow use of void operator
      "no-void": "error",

      // Disallow Yoda conditions (where literal value comes first).
      "yoda": "error",

      // Require a space immediately following the // in a line comment.
      //"spaced-comment": ["error", "always"],

      // Require use of the second argument for parseInt().
      //"radix": "error",

      // Require spaces before/after unary operators (words on by default,
      // nonwords off by default).
      //"space-unary-ops": ["error", { "words": true, "nonwords": false }],

      // Enforce spacing after semicolons.
      "@stylistic/semi-spacing": ["error", { before: false, after: true }],

      // Disallow the use of Boolean literals in conditional expressions.
      "no-unneeded-ternary": "error",

      // Disallow use of multiple spaces (sometimes used to align const values,
      // array or object items, etc.). It's hard to maintain and doesn't add that
      // much benefit.
      "@stylistic/no-multi-spaces": "error",

      // Require spaces around operators, except for a|0.
      // Disabled for now given eslint doesn't support default args yet
      // "space-infix-ops": ["error", {"int32Hint": true}],

      // Require a space around all keywords.
      "@stylistic/keyword-spacing": "error",

      // Disallow space between function identifier and application.
      "@stylistic/func-call-spacing": "error",

      // Disallow use of comma operator.
      "no-sequences": "error",

      // Disallow use of assignment in return statement. It is preferable for a
      // single line of code to have only one easily predictable effect.
      "no-return-assign": "error",

      // Require return statements to either always or never specify values
      //"consistent-return": "error",

      // Disallow padding within blocks.
      //"padded-blocks": ["error", "never"],

      // Disallow spaces inside parentheses.
      "@stylistic/space-in-parens": ["error", "never"],

      // Require space after keyword for anonymous functions, but disallow space
      // after name of named functions.
      "@stylistic/space-before-function-paren": ["error", { anonymous: "never", named: "never" }],

      // Always require use of semicolons wherever they are valid.
      "@stylistic/semi": ["error", "always"],

      // Warn about declaration of variables already declared in the outer scope.
      "no-shadow": "error",

      // Disallow global and local variables that aren't used, but allow unused function arguments.
      "no-unused-vars": ["error", { vars: "all", args: "none" }],

      // Require padding inside curly braces
      "@stylistic/object-curly-spacing": ["error", "always"],

      // Disallow spaces inside of brackets
      "@stylistic/array-bracket-spacing": ["error", "never"],

      // Disallow constant expressions in conditions
      //"no-constant-condition": ["error", {"checkLoops": false }],

      // Disallow Regexs That Look Like Division
      "no-div-regex": "error",

      // Disallow Iterator (using __iterator__)
      "no-iterator": "error",

      // Enforce consistent linebreak style
      "@stylistic/linebreak-style": ["error", "unix"],

      // Enforces return statements in callbacks of array's methods
      "array-callback-return": "error",

      // Disallow duplicate imports
      "no-duplicate-imports": "error",

      // Disallow Labeled Statements
      "no-labels": "error",

      // Disallow Multiline Strings
      "no-multi-str": "error",

      // Disallow Initializing to undefined
      "no-undef-init": "error",

      // Disallow unnecessary computed property keys on objects
      "no-useless-computed-key": "error",

      // Disallow unnecessary constructor
      "no-useless-constructor": "error",

      // Disallow renaming import, export, and destructured assignments to the
      // same name
      "no-useless-rename": "error",

      // Enforce spacing between rest and spread operators and their expressions
      "@stylistic/rest-spread-spacing": ["error", "never"],

      // Disallow usage of spacing in template string expressions
      "@stylistic/template-curly-spacing": ["error", "never"],

      // Disallow the Unicode Byte Order Mark
      "unicode-bom": ["error", "never"],

      // Enforce spacing around the * in yield* expressions
      "@stylistic/yield-star-spacing": ["error", "after"],

      // Disallow Implied eval
      "no-implied-eval": "error",

      // Disallow unnecessary function binding
      "no-extra-bind": "error",

      // Disallow new For Side Effects
      "no-new": "error",

      // Require IIFEs to be Wrapped
      //"wrap-iife": ["error", "inside"],

      // Disallow Unused Expressions
      "no-unused-expressions": "error",

      // Disallow function or var declarations in nested blocks
      "no-inner-declarations": "error",

      // Enforce newline before and after dot
      "@stylistic/dot-location": ["error", "property"],

      // Disallow Use of caller/callee
      "no-caller": "error",

      // Disallow Floating Decimals
      "@stylistic/no-floating-decimal": "error",

      // Require Space Before Blocks
      "@stylistic/space-before-blocks": "error",

      // Operators always before the line break
      "@stylistic/operator-linebreak": ["error", "after", { overrides: { ":": "before", "?": "ignore" } }],

      // Restricts the use of parentheses to only where they are necessary
      //"no-extra-parens": ["error", "all", { "conditionalAssign": false, "returnAssign": false, "nestedBinaryExpressions": false }],

      // Disallow if as the only statement in an else block.
      //"no-lonely-if": "error",

      // Not more than two empty lines with in the file, and no extra lines at
      // beginning or end of file.
      "@stylistic/no-multiple-empty-lines": ["error", { max: 2, maxEOF: 0, maxBOF: 0 }],

      // Make sure all setters have a corresponding getter
      "accessor-pairs": "error",

      // Enforce spaces inside of single line blocks
      //"block-spacing": ["error", "always"],

      // Disallow spaces inside of computed properties
      "@stylistic/computed-property-spacing": ["error", "never"],

      // Require consistent this (using |self|)
      "consistent-this": ["error", "self"],

      // Disallow unnecessary .call() and .apply()
      "no-useless-call": "error",

      // Require dot notation when accessing properties
      "dot-notation": "error",

      // Disallow named function expressions
      //"func-names": ["error", "never"],

      // Enforce placing object properties on separate lines
      "@stylistic/object-property-newline": ["error", { allowMultiplePropertiesPerLine: true }],

      // Enforce consistent line breaks inside braces
      //"object-curly-newline": ["error", { "multiline": true }],

      // Disallow whitespace before properties
      "@stylistic/no-whitespace-before-property": "error",

      // Disallow mixes of different operators, but allow simple math operations.
      //"no-mixed-operators": ["error", {
      //    "groups": [
      //        /* ["+", "-", "*", "/", "%", "**"], */
      //        ["&", "|", "^", "~", "<<", ">>", ">>>"],
      //        ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
      //        ["&&", "||"],
      //        ["in", "instanceof"]
      //    ]
      //}],

      // Disallow unnecessary concatenation of strings
      "no-useless-concat": "error",

      // Disallow unmodified conditions of loops
      //"no-unmodified-loop-condition": "error",

      // Suggest using arrow functions as callbacks
      //"prefer-arrow-callback": ["error", { "allowNamedFunctions": true }],

      // Suggest using the spread operator instead of .apply()
      "prefer-spread": "error",

      // Quoting style for property names
      //"@stylistic/quote-props": ["error", "consistent-as-needed", { "keywords": true }],

      // Disallow negated conditions
      //"no-negated-condition": "error",

      // Enforce a maximum number of statements allowed per line
      "@stylistic/max-statements-per-line": ["error", { max: 2 }],

      // Disallow arrow functions where they could be confused with comparisons
      "@stylistic/no-confusing-arrow": "error",

      // Disallow Unnecessary Nested Blocks
      "no-lone-blocks": "error",

      // Enforce consistent indentation (2-space)
      //"indent": ["error", 2, { "SwitchCase": 1 }],

      // Disallow var, use let or const instead
      "no-var": "error"
    }
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.node,
        ICAL: "readonly",
        assert: "readonly",
        testSupport: "readonly",
        perfTest: "readonly"
      }
    }
  },
  {
    files: ["test/performance/**/*.js"],
    languageOptions: {
      globals: {
        perfCompareSuite: "readonly"
      }
    }
  },
  {
    files: ["test/support/helper.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha
      }
    }
  },
  {
    files: ["tools/scriptutils.js", "test/support/perfReporter.cjs", "karma.conf.cjs", "tools/ICALTester/**/*.js"],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["eslint.config.js"],
    plugins: {
      "@stylistic": stylistic
    },
    rules: {
      "@stylistic/quote-props": ["error", "consistent-as-needed"]
    }
  },
  {
    files: ["tools/**/*.html"],
    plugins: {
      "@html": html
    },
    languageOptions: {
      globals: globals.browser
    }
  }
];
