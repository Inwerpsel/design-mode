import React, { Fragment, useContext } from 'react';
import { TextControl } from "../controls/TextControl";
import { ThemeEditorContext } from '../ThemeEditor';
import { findClosingBracket } from '../../functions/compare';
import { splitCommaSafeParentheses } from '../../functions/getOnlyMostSpecific';
import { get } from '../../state';
import { VariableControl } from '../inspector/VariableControl';
import { ACTIONS, editTheme } from '../../hooks/useThemeEditor';

// True if the expression is a single `calc` expression,
// or a single mathematical function (min, max, clamp).
export function isSingleMathExpression(value = '') {
  if (!value.includes('(')) {
    return false;
  }
  const openingBracket = value.indexOf('(');
  const fName = value.slice(0, openingBracket).toLowerCase();
  if (!['calc', 'min', 'max', 'clamp'].includes(fName)) {
    // console.log('No math function', fName)
    return false;
  }

  if (findClosingBracket(value, openingBracket) < value.length - 1) {
    // console.log('Not a single expression', value);
    return false;
  }

  return true;
}

const operators = {
  '+'(a, b) {
    return parseFloat(a) + parseFloat(b);
  },
  '-'(a, b) {
    return parseFloat(a) - parseFloat(b);
  },
  '*'(a, b) {
    return parseFloat(a) * parseFloat(b);
  },
  '/'(a, b) {
    return parseFloat(a) / parseFloat(b);
  },
}

// Get right unit depending on units of operands.
const resultHasUnit = {
  '+'(a, b) {
    if (a) {
      if (!b) throw new Error('Tried adding unitless value to value with unit.');

      return true;
    }
    if (b) {
      if (!a) throw new Error('Tried adding value with unit to unitless value.');

      return true;
    }
    return false;
  },
  '-'(a, b) {
    if (a) {
      if (!b) throw new Error('Tried subtracting unitless value from value with unit.');

      return true;
    }
    if (b) {
      if (!a) throw new Error('Tried subtracting value with unit from unitless value.');

      return true;
    }
    return false;
  },
  '*'(a, b) {
    // Disable error as it improperly detects.

    if (a && b) throw new Error('At least 1 operand must be unitless.');

    return a || b;
  },
  '/'(a, b) {
    // Disable error as it improperly detects.
    if (b) throw new Error('Divisor must be unitless.');

    return a;
  },
};

const mathConstants = {
  e: Math.E,
  pi: Math.PI,
  infinity: Infinity,
  // Let's ignore minus infinity, seems useless as a keyword and it makes parsing a lot harder.
}

function resolveUnits(_value, scenario): [number, boolean?] {
  const isNegative = _value[0] === '-';
  const sign = isNegative ? -1 : 1;
  const value = isNegative ? _value.slice(1) : _value;

  if (value.toLowerCase() in mathConstants) {
    return [mathConstants[value.toLowerCase()] * sign, false];
  }
  const numericPart = parseFloat(value.replaceAll(/[^\d\.]/g, '')) * sign;
  let unitPart = value.replace(/\d|\./g, '');
  // Todo: Inject correct value measured from element.
  // This is also needed for other units and probably needs other things, like container dimensions.
  // Now wrongly using root size to be able to use the expression anyway for testing.
  if (unitPart === 'em') {
    unitPart = 'rem';
  }
  if (unitPart === '') {
    return [numericPart, false];
  }
  const {width = 360, height = 640, remFactor = 16, resultUnit = 'px'} = scenario;

  if (unitPart === '%') {
    throw new Error('Percentages not supported yet.')
  }

  if (resultUnit === 'rem') {
    if (unitPart === 'rem') {
      return [numericPart, true];
    }
    if (unitPart === 'px') {
      return [numericPart / remFactor, true];
    }
    if (unitPart === 'vw' || unitPart === 'dvw') {
      return [(numericPart / 100) * width / remFactor, true];
    }
    if (unitPart === 'vh' || unitPart === 'dvh') {
      return [(numericPart / 100) * height / remFactor, true];
    }
    throw new Error(`Unsupported unit. "${unitPart}"`)

  } else if (resultUnit === 'px') {
    if (unitPart === 'rem') {
      const result = numericPart * remFactor;
      scenario.steps.push({
        before: value,
        result:
          numericPart === 1
            ? result
            : `${numericPart} * ${remFactor} = ${result}`,
      });
      return [result, true];
    }
    if (unitPart === 'px') {
      return [numericPart, true];
    }
    if (unitPart === 'vw') {
      const result = width * numericPart / 100;
      scenario.steps.push({
        before: value,
        result: `${width} * ${numericPart}/100 = ${result}`,
      });
      return [result, true];
    }
    const isDvh = unitPart === 'dvh';
    if (unitPart === 'vh' || isDvh) {
      const result = height * numericPart / 100;
      scenario.steps.push({
        before: value,
        result: `${height} * ${numericPart}/100 = ${result}`,
        warning: !isDvh ? null : '`dvh` is treated as `vh`, possibly leading to wrong results.',
      });
      return [result, true];
    }
    throw new Error(`Unsupported unit. "${unitPart}"`)
  }

  throw new Error('Unsupported result unit.')
}

function resolveOperation([operator, arg1, aHadUnit], arg2, scenario, bHadUnit = false) {
  if (!(operator in operators)) {
    throw new Error('Unknown operator');
  }

  const [a, _aHasUnit] = resolveUnits(`${arg1}`.trim(), scenario);
  const [b, _bHasUnit] = resolveUnits(`${arg2}`.trim(), scenario);
  const aHasUnit = _aHasUnit || aHadUnit;
  const bHasUnit = _bHasUnit || bHadUnit;

  let hasUnit;
  try {
    hasUnit = resultHasUnit[operator](aHasUnit, bHasUnit);
  } catch (e) {
    // Quick fix.
    hasUnit = true;
    // console.log('Unit possibly incorrect', e.message + ' ' + `\nFound:\n${arg1} ${operator} ${arg2}`);
  }
  const result = operators[operator](a, b);

  scenario.steps.push({orig: {arg1, arg2}, a, operator, b, result});

  return [result, hasUnit];
}

const precedence = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 3,
};

function getArgumentListOfSameType(argString, scenario): [number[], boolean] {
  const results = splitCommaSafeParentheses(argString).map(v => evaluateCalc(v.trim(), scenario))

  let resultHasUnit;
  for (const [, hasUnit] of results) {
    if (resultHasUnit === undefined) {
      resultHasUnit  = hasUnit;
      continue;
    }
    if (hasUnit !== resultHasUnit) {
      throw new Error('All arguments need to be of the same type. ' + argString);
    }
  }

  return [results.map(([n]) => n), resultHasUnit];
}

export function evaluateCalc(expression, scenario): [number, boolean] {
  let buffer = '' as number|string, bufferHasUnit = false;
  // [operator, first arg] sits waiting for new arg as it's discovered.
  let pendingOperation;

  const pendingStack = [];

  // Position in expression.
  let cursor = 0, previousChar = '', char = '', nextChar = '';

  const parser = {
    '('() {
      const closingBracketPosition = findClosingBracket(expression, cursor);
      if (buffer === 'var') {
        throw new Error('Expression contains unresolved variable. ' + expression)
      }

      const inside = expression.substring(cursor + 1, closingBracketPosition);
      const possibleFunction = buffer.toLowerCase();

      if (possibleFunction === 'clamp') {
        const [args, resultHasUnit] = getArgumentListOfSameType(inside, scenario);
        bufferHasUnit = resultHasUnit;
        const [min, preferred, max] = args;
        // console.log('CLAMP', args);
        buffer = parseFloat(preferred) < parseFloat(min) ? min : parseFloat(preferred) > parseFloat(max) ? max : preferred;

        scenario.steps.push({mathFunc: 'clamp', args, result: buffer});

      } else if (possibleFunction === 'min') {
        const [args, resultHasUnit] = getArgumentListOfSameType(inside, scenario);
        bufferHasUnit = resultHasUnit;
        buffer = args.reduce(
          (lowest, v) => (v < lowest ? v : lowest),
          Infinity
        );
        scenario.steps.push({mathFunc: 'min', args, result: buffer});
      } else if (possibleFunction === 'max') {
        const [args, resultHasUnit] = getArgumentListOfSameType(inside, scenario);
        bufferHasUnit = resultHasUnit;
        buffer = args.reduce(
          (highest, v) => (v > highest ? v : highest),
          -Infinity
        );
        scenario.steps.push({mathFunc: 'max', args, result: buffer});
      } else {
        const [result, hasUnit] = evaluateCalc(
          inside,
          scenario
        );
        buffer = result;
        bufferHasUnit = hasUnit;
      }
      cursor = closingBracketPosition;
    },
    ')'() {
        // 
        throw new Error('Unmatched closing bracket.')
    },
    '+'() {
      if (nextChar === ' ') {
        if (previousChar !== ' ' && previousChar !== undefined) {
          throw new Error('Plus operator must be preceded by a space.')
        }
        pendingOperation = ['+', buffer, bufferHasUnit];
      }
      buffer = '';
    },
    '-'() {
      if (nextChar === ' ') {
        if (previousChar !== ' ' && previousChar !== undefined) {
          throw new Error('Minus operator must be preceded by a space.')
        }
        pendingOperation = ['-', buffer, bufferHasUnit];
        buffer = '';
      } else {
        buffer = '-';
      }
    },
    '/'() {
      pendingOperation = ['/', buffer, bufferHasUnit];
      buffer = '';
    },
    '*'() {
      pendingOperation = ['*', buffer, bufferHasUnit];
      buffer = '';
    },
  }
  while (cursor < expression.length) {
    previousChar = expression[cursor - 1];
    char = expression[cursor];
    nextChar = expression[cursor + 1];

    if (char in parser) {
      const isPlusOrMinusSomething = (nextChar !== ' ') && (char === '+' || char === '-');
      if (!isPlusOrMinusSomething && char !== '(' && pendingOperation) {
        if (precedence[char] > precedence[pendingOperation[0]]) {
          // console.log('higher precedence, delay', pendingOperation, buffer, char);
          pendingStack.push(pendingOperation);
        } else {
          // console.log('lower or equal precedence, perform', pendingOperation, buffer, char);
          [buffer, bufferHasUnit] = resolveOperation(pendingOperation, buffer, scenario);
          pendingOperation = null;
        }
      }
      parser[char]();
    } else {
        if (buffer !== '' || char !== ' ') {
            buffer += char;
        }
    }
    cursor++;
  }
  if (pendingOperation) {
    [buffer, bufferHasUnit] = resolveOperation(pendingOperation, `${buffer}`.trim(), scenario, bufferHasUnit); 
  }
  while (pendingStack.length > 0) {
    [buffer, bufferHasUnit] = resolveOperation(pendingStack.pop(), buffer, scenario, bufferHasUnit);
  }

  const [result, resultHasUnit] = resolveUnits(`${buffer}`.trim(), scenario);

  return [result, resultHasUnit || bufferHasUnit];
}

function evaluateScenarios(expression, scenarios) {
  const results = [];
  for (const scenario of scenarios) {
    scenario.steps = [];
    try {
      results.push([scenario, ...evaluateCalc(expression, scenario)]);
    } catch(error) {
      scenario.steps.push({error: error.message})
      results.push([scenario, error.message]);
    }
  }

  return results;
}

type Args = (string|number)[];

const describeInvocation = {
  min(args: Args, result) {
    return `Take lowest of [${args.join(', ')}] = ${result}`
  },
  max(args: Args, result) {
    return `Take highest of [${args.join(', ')}] = ${result}`
  },
  clamp([min, preferred, max], result) {
    return `Clamp ${preferred} between ${min} and ${max} = ${result}`;
  },
};

function UsedVariables(props) {
  const { referencedVars, elementScopes, expression } = props;
  const dispatch = editTheme();
  const { allVars } = useContext(ThemeEditorContext);

  return <Fragment>
    <br />
    <h5>Variables</h5>
    <ul style={{border: '1px solid black'}}>
      {referencedVars.map(name => {
        const cssVar = allVars.find(v=>v.name===name) || {
          name,
          usages: [
            {
              property: 'width',
            },
          ],
          properties: {width: {isFullProperty: true, fullValue: `var(--${name})`, isImportant: false}},
          maxSpecific: {property: 'width'},
          positions: [],
        };
        return <li key={name}>
          <VariableControl
            {...{
              cssVar,
              scopes: elementScopes,
            }}
            onChange={value => {
              dispatch({
                type: ACTIONS.set,
                payload: {
                  name: cssVar.name, 
                  value,
                }
              });
            }}
            onUnset={() => {
              dispatch({ type: ACTIONS.unset, payload: { name: cssVar.name } });
            }}
          />
        </li>
      })}
    </ul>
  </Fragment>;
}

export function CalcSizeControl(props) {
  const { value, resolvedValue, referencedVars, onChange, elementScopes, disabled = false } = props;
  const { width, height } = get;
  const { frameRef } = useContext(ThemeEditorContext);

  const outer = value.startsWith('calc(') 
    ? value.replace(/calc\(/, '').replace(/\)$/, '')
    : value;

  // Replace inner `calc` expressions with just parentheses.
  const expression = outer.replaceAll('calc(', '(');

  const resolvedOuter = resolvedValue.startsWith('calc(')
    ? resolvedValue.replace(/calc\(/, '').replace(/\)$/, '')
    : resolvedValue;
  const resolvedExpression = resolvedOuter.replaceAll('calc(', '(');

  const rootFontSize = getComputedStyle(frameRef.current.contentWindow.document.documentElement).getPropertyValue('font-size');

  const remFactor = parseFloat(rootFontSize.replace('px', ''));

  const results = evaluateScenarios(resolvedExpression, [
    {width, height, remFactor, resultUnit: 'px'},
    // {width, height, remFactor, resultUnit: 'rem'},
  ]);

  return (
    <div>
      <h3>Calculation</h3>
      <TextControl
        {...{
          disabled,
          style: { width: '100%' },
          value: expression,
          onChange: (v) => onChange(isSingleMathExpression(v) ? v : `calc(${v})`),
        }}
      />
      <h4>Evaluates to</h4>
      <ul>
        {results.map(([{ width, height, resultUnit, remFactor, steps }, result, hasUnit]) => {
          const k = `${width}x${height}~${resultUnit}~${remFactor}`;
          return (
            <li key={k}>
              <code style={{cursor: 'pointer', fontSize: '2rem'}} onClick={() => onChange(`${result}${resultUnit}`)}>
                {result}
                {hasUnit && resultUnit}
              </code>
              <pre><code>at {width}x{height}</code></pre>
              {referencedVars?.length > 0 && <UsedVariables {...{ referencedVars, elementScopes, expression }} />}
              <br />
              <code>{resolvedOuter}</code>
              <h5>Steps</h5>
              <ol className="calc-steps">
                {steps.map((step, i) => {
                  let comp;
                  if (step.mathFunc) {
                    const {mathFunc, args, result} = step;
                    comp = <code>{describeInvocation[mathFunc](args, result)}</code>;
                  } else if (step.operator) {
                    const {orig: {arg1, arg2}, a, operator, b, result} = step;
                    comp = <code title={`${arg1} ${operator} ${arg2}`}>{a} {operator} {b} = {result}</code>;
                  } else if (step.error) {
                    const {error} = step;
                    comp = <code>Error: {error}</code>;
                  } else {
                    const {before, result, warning} = step;
                    comp = <code>{before} = {result}{warning && <span style={{background: 'yellow'}}><br />{warning}</span>}</code>;
                  }

                  return <li key={i}>{comp}<br /><br /></li>;
                })}
              </ol>
            </li>
          );
        })}
      </ul>
      <br />
      <i>Root font size: {remFactor}px</i>
    </div>
  );
}
