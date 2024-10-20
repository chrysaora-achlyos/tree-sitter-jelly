module.exports = grammar({
    name: 'jelly',
    externals: $ => [
        $.string_chars
    ],        
    rules: {
        source_file: $ => repeat($._definition),
    
        _definition: $ => choice(
            $.function_definition,
            $.macro_definition,
            $.menu_definition,
            $.conditional_definition,
            $.repeat_definition,
            $.repeat_each_definition,
            $._statement,
            $.flag,
            $.import,
            $.comment,
            $.block_comment
        ),

        // MARK: Flags
        flag: $ => seq(
            $.flag_delimiter,
            field('name', $.identifier),
            ':',
            field('value', $.identifier),
            optional(',')
        ),

        flag_delimiter: $ => "#",

        // MARK: Import Statements
        import: $ => seq(
            "import",
            /\s+/,
            field('library', $.identifier)
        ),

        // MARK: Repeat
        repeat_definition: $ => seq(
            'repeat',
            choice(
                seq( /\s+/, field('amount', $.number), /\s+/),
                seq( '(',   field('amount', $.number), ')')
            ),
            field('body', $.block),
            optional(field('magic_variable', $.magic_variable_definition))
        ),

        repeat_each_definition: $ => seq (
            'repeatEach',
            choice('(', /\s+/),
            field('variable', $.identifier),
            choice(')', /\s+/),
            field('body', $.block),
            optional(field('magic_variable', $.magic_variable_definition))
        ),

        // MARK: Conditional definitions
        conditional_definition: $ => seq(
            'if',
            choice('(', /\s+/),
            field('primary', $._primitive),
            optional(
                seq(
                    /\s+/,
                    field('operator', optional($.operator)),
                    /\s+/,
                    field('secondary', optional($._primitive)),    
                )
            ),
            choice(')', /\s+/),
            field('body', $.block),
            optional(
                choice(
                    field('magic_variable', $.magic_variable_definition),
                    field('else', $.conditional_else)
                )
            ),
        ),

        conditional_else: $ => seq(
            'else',
            field('body', $.block),
            optional(field('magic_variable', $.magic_variable_definition))
        ),

        operator: $ => choice(
            '&&',
            '||',
            '==',
            '!=',
            '<',
            '<=',
            '>',
            '>=',
            '::',
            '!:',
            '$$',
            '$!'
        ),

        // MARK: Menu Defintions
        menu_definition: $ => seq(
            'menu',
            choice('(', /\s+/),
            field("prompt", $.string),
            choice('(', /\s+/),
            field("body", $.menu_block),
            optional(field('magic_variable', $.magic_variable_definition))
        ),
    
        menu_block: $ => seq(
            '{',
            repeat($.menu_case),
            '}'
        ),

        // The following two rules are a little odd and need to be updated in the future. 
        // The menu_case_body has the : because it can not match the empty string. 
        // However, this really should be included in menu_case.
        menu_case: $ => seq(
            'case',
            optional('('),
            field('case', $.string),
            optional(')'),
            field('body', $.menu_case_body),
        ),

        menu_case_body: $ => seq(
            ':',
            repeat($._definition)
        ),
        
        // MARK: Function & Macro Declaration Defintion
        function_definition: $ => seq(
            'func',
            field('name', $.identifier),
            field('parameters', $.parameter_list),
            field('body', $.block),
        ),
    
        macro_definition: $ => seq(
            'macro',
            field('name', $.identifier),
            field('parameters', $.parameter_list),
            field('body', $.block),
        ),

        parameter_list: $ => seq(
            '(',
            repeat($.parameter_list_item),
            ')'
        ),
                
        // TODO: Alter this so there is no longer support for optional parameters.
        // Any altering I have tried has ended in infinite loops. Not sure why... Needs more work.
        parameter_list_item: $ => seq(
            optional(
                seq(
                    field('parameter_name', $.identifier),
                    ':',
                    optional(/\s+/)
                )
            ),
            field('item', $._primitive),
            optional(','),
            optional(/\s+/),
        ),
       
        // MARK: Statements
        _statement: $ => choice(
            $.function_call,
            $.variable_declaration,
            $.set_variable,
            $.return_statement
        ),

        variable_declaration: $ => seq(
            'var',
            /\s+/,
            field('name', $.identifier),
            /\s+/,
            '=',
            /\s+/,
            field('value', $._primitive)
        ),

        set_variable: $ => seq(
            field('name', $.identifier),
            /\s+/,
            '=',
            /\s+/,
            field('value', $._primitive)
        ),

        function_call: $ => seq(
            field('name', $.identifier),
            field('parameters', $.parameter_list),
            optional(field('magic_variable', $.magic_variable_definition))
        ),

        // Magic Variable
        magic_variable_definition: $ => seq(
            '>>',
            /\s+/,
            field('name', $.identifier)
        ),

        // Return Statement
        return_statement: $ => seq(
            'return',
            field('value', $._primitive)        
        ),
   
        // Primitives
        _primitive: $ => choice(
            $.number,
            $.identifier,
            $.array,
            $.string,
            $.multi_line_string,
            $.json_object_value 
        ),

        // https://stackoverflow.com/a/12643073/14886210
        number: $ => /[+-]?([0-9]*[.])?[0-9]+/,

        identifier: $ => seq(
            field('content', $.identifier_content),
            optional(
                field('property', 
                    repeat(
                        $.variable_property
                    )
                )
            ),
        ),

        identifier_content: $ => /[a-zA-Z0-9_$-]+/,
        
        // Array
        array: $ => seq(
            '[',
            repeat(
                choice(
                    seq(
                        field('item', $._primitive),
                        ','
                    ),
                field('item', $._primitive)
                )
            ),
            ']'
        ),

        // Strings
        string: $ => seq(
            '"',
            repeat(
                choice(
                    field("text", $.string_chars), 
                    field("interpolation", $.string_interpolation)
                )
            ),
            '"'
        ),

        multi_line_string: ($) => seq(
            '"""',
            repeat(
                choice(
                    field("text", $.string_chars), 
                    field("interpolation", $.string_interpolation)
                )
            ),
            '"""'
        ),
  
        string_interpolation: $ => seq(
            '${',
            field('identifier', $.identifier),
            '}'
        ),

        json_object_value: $ => seq (
          '{', json_commaSep($._json_pair), '}',
        ),
        _json_value: $ => choice(
          $._json_object,
          $._json_array,
          $._json_number,
          $._json_string,
          $._json_true,
          $._json_false,
          $._json_null,
        ),
        _json_object: $ => seq (
          '{', json_commaSep($._json_pair), '}',
        ),
        _json_pair: $ => seq(
          $._json_string, ':', $._json_value,
        ),
        _json_array: $ => seq(
          '[', json_commaSep($._json_value), ']',
        ),
        _json_string: $ => choice(
          seq('"', '"'),
          seq('"', $._json___string_content, '"'),
        ),
// BROKEN -- Need to fix to deal with escape_sequences
        _json___string_content: $ => repeat1(choice(
//          field("text": $._json_string_content),
//          field("text": $._json_escape_sequence),
          field("text", $.string_chars), 
          field("interpolation", $.string_interpolation)
        )),
        _json_string_content: _ => token.immediate(prec(1, /[^\\"\n]+/)),
        _json_escape_sequence: _ => token.immediate(seq(
                '\\',
                /(\"|\\|\/|b|f|n|r|t|u)/,
        )),
        _json_number: _ => {
          const decimalDigits = /\d+/;
          const signedInteger = seq(optional('-'), decimalDigits);
          const exponentPart = seq(choice('e', 'E'), signedInteger);

          const decimalIntegerLiteral = seq(
            optional('-'),
            choice(
              '0',
              seq(/[1-9]/, optional(decimalDigits)),
            ),
          );

          const decimalLiteral = choice(
            seq(decimalIntegerLiteral, '.', optional(decimalDigits), optional(exponentPart)),
            seq(decimalIntegerLiteral, optional(exponentPart)),
          );

         return token(decimalLiteral);
        },
        _json_true: _ => 'true',
        _json_false: _ => 'false',
        _json_null: _ => 'null',

        variable_property: $ => seq(
            '.',
            field('type', $.variable_property_type),
            '(',
            field('value', $.identifier),
            ')'
        ),

        variable_property_type: $ => choice("as", "get", "key"),

        // Block of code
        block: $ => seq(
            '{',
            repeat($._definition),
            '}'
        ),

        // MARK: Comments
        comment: $ => seq(
            '//',
            field('content', $.comment_content)
        ),

        block_comment: ($) => seq(
            '/*',
            field('content',
                repeat(
                    $.block_comment_content,
                ),
            ),
            '*/'
        ),

        comment_content: $ => /.*/,
        block_comment_content: $ => /.+/,
    }
});

/**
 * https://github.com/tree-sitter/tree-sitter-json/blob/master/grammar.js
 */
/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @return {SeqRule}
 *
 */
function json_commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @return {ChoiceRule}
 *
 */
function json_commaSep(rule) {
  return optional(json_commaSep1(rule));
}
