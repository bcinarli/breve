/**
 * Breve
 * A Simple Javascript templates
 * @author Bilal Cinarli
 */

(function(factory) {
    if(typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.

    } else if(typeof exports === 'object' && typeof require === 'function') {
        // Browserify

    } else {
        // Browser globals
        factory(window);
    }
}(function(window) {
    'use strict';

    /**
     * Simple template engine
     * Supports parameter replacement, loops, simple conditionals
     */

    var Breve = {};

    var _expressions = {
        variable: /{{([a-zA-Z0-9_.-]+)}}/g,
        ifelse:   /{{#if ([a-zA-Z0-9.]+)([!=><]{1,2})?(("|')?([a-zA-Z0-9_"']+)("|')?)?}}([\s\S]+?){{\/if}}/gm,
        loop:     /{{#each ([a-zA-Z0-9_\-]+)}}([\s\S]+?){{\/each}}/gm
    };

    var _operator = {
        'undefined': function(lhs) { return lhs !== false; },
        '==':        function(lhs, rhs) { return lhs === rhs; },
        '!=':        function(lhs, rhs) { return lhs !== rhs; },
        '>':         function(lhs, rhs) { return lhs > rhs; },
        '>=':        function(lhs, rhs) { return lhs >= rhs; },
        '<':         function(lhs, rhs) { return lhs < rhs; },
        '<=':        function(lhs, rhs) { return lhs <= rhs; }
    };

    var _conditional = function(operator, lhs, rhs, data) {
        var condition = false;

        if(!data) { data = {}; }

        if(data.hasOwnProperty(lhs) && _operator.hasOwnProperty(operator)) {
            condition = _operator[operator](data[lhs], rhs);
        }

        return condition;
    };

    var _transform = function(data) {
        return Array.isArray(data) ? data : [data];
    };

    var _matchAll = function(string, search) {
        var matches = [];
        string.replace(search, function() {
            var arr    = ([]).slice.call(arguments, 0);
            var extras = arr.splice(-2);
            arr.index  = extras[0];
            arr.input  = extras[1];
            matches.push(arr);
        });
        return matches.length ? matches : null;
    };

    var _replace = function(string, search, prefix) {
        prefix = prefix ? prefix + '.' : '';

        Object.keys(search).forEach(function(key) {
            if(typeof search[key] !== 'object') {
                string = string.replace(new RegExp('{{' + prefix + key + '}}', 'g'), search[key]) + '\n';
            }
        });

        return string;
    };

    var unmatched = function(rendered) {
        return rendered.replace(_expressions.variable);
    };

    var conditions = function(rendered, data, original) {
        var hasConditions = _matchAll(rendered, _expressions.ifelse);

        if(hasConditions) {
            hasConditions.map(function(condition) {
                var _ifelse = condition[7].split('{{#else}}'),
                    lhs     = condition[1],
                    output  = '';

                if(original) {
                    lhs = lhs.replace(original + '.', '');
                }

                if(_conditional(condition[2], lhs, condition[5], data)) {
                    output = _ifelse[0];
                }
                else if(typeof _ifelse[1] !== 'undefined') {
                    output = _ifelse[1];
                }

                rendered = rendered.replace(condition[0], output);
            });
        }

        return rendered;
    };

    var loops = function(rendered, data) {
        var hasLoops = _matchAll(rendered, _expressions.loop);

        if(hasLoops) {
            hasLoops.map(function(loop) {
                if(data.hasOwnProperty(loop[1])) {
                    var loopData      = _transform(data[loop[1]]),
                        _renderedLoop = '\n';

                    loopData.map(function(row) {
                        var _row = _replace(loop[2], row, loop[1]);
                        _renderedLoop += conditions(_row, row, loop[1]);
                    });

                    rendered = rendered.replace(loop[0], _renderedLoop);
                }
            });
        }

        return rendered;
    };

    Breve.render = function(template, data) {
        var _rendered = template,
            params    = _transform(data);

        // first iteration strings/numbers etc.
        params.map(function(obj) {
            _rendered = _replace(_rendered, obj);
        });

        // second iteration each loops
        _rendered = loops(_rendered, data);

        // last iteration for conditions
        _rendered = conditions(_rendered, data);

        // remove all unmatched
        _rendered = unmatched(_rendered);

        return _rendered;
    };

    Breve.version = 'unreleased';

    window.breve = window.Breve = Breve;
}));