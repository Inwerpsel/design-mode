const alignOptions = [
        'normal',
        'stretch',
        'center',
        'start',
        'end',
        'flex-start',
        'flex-end',
        'baseline',
        'first baseline',
        'last baseline',
        'safe center',
        'unsafe center',
];

const blendOptions = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
  ];
const borderStyleOptions = [
    'none',
    'hidden',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ]

// These should be all CSS properties that only allow keywords as a value.
const lists = {
  'align-items': alignOptions,
  'align-content': alignOptions,
  'align-self': ['self-start', 'self-end', 'stretch', ...alignOptions],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'justify-content': [
    'center',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'left',
    'right',
    'normal',
    'space-between',
    'space-around',
    'space-evenly',
    'stretch',
    'safe center',
    'unsafe center',
  ],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'border-collapse': ['separate', 'collapse'],
  'empty-cells': ['show', 'hide'],
  'font-variant-numeric': [
    'normal',
    'ordinal',
    'slashed-zero',
    'lining-nums' /* <numeric-figure-values> */,
    'oldstyle-nums' /* <numeric-figure-values> */,
    'proportional-nums' /* <numeric-spacing-values> */,
    'tabular-nums' /* <numeric-spacing-values> */,
    'diagonal-fractions' /* <numeric-fraction-values> */,
    'stacked-fractions' /* <numeric-fraction-values> */,
    'oldstyle-nums stacked-fractions',
  ],
  'scroll-behavior': ['auto', 'smooth'],
  'scrollbar-width': ['auto', 'thin', 'none'],
  'white-space': [
    'normal',
    'nowrap',
    'pre',
    'pre-wrap',
    'pre-line',
    'break-spaces',
  ],
  'word-break': [
    'normal',
    'wordbreak-all',
    'wordkeep-all',
    'wordbreak-word' /* deprecated */,
  ],
  'background-blend-mode': blendOptions,
  'mix-blend-mode': blendOptions,
  'border-style': borderStyleOptions,
  'outline-style': borderStyleOptions,
  'vertical-align': [
    'baseline',
    'sub',
    'super',
    'text-top',
    'text-bottom',
    'middle',
    'top',
    'bottom',
  ],
  'text-rendering': [
    'auto',
    'optimizeSpeed',
    'optimizeLegibility',
    'geometricPrecision',
  ],
  cursor: [
    'auto ',
    'default ',
    'none ',
    'context-menu ',
    'help ',
    'pointer ',
    'progress ',
    'wait ',
    'cell ',
    'crosshair ',
    'text ',
    'vertical-text ',
    'alias ',
    'copy ',
    'move ',
    'no-drop ',
    'not-allowed ',
    'grab ',
    'grabbing ',
    'e-resize ',
    'n-resize ',
    'ne-resize ',
    'nw-resize ',
    's-resize ',
    'se-resize ',
    'sw-resize ',
    'w-resize ',
    'ew-resize ',
    'ns-resize ',
    'nesw-resize ',
    'nwse-resize ',
    'col-resize ',
    'row-resize ',
    'all-scroll ',
    'zoom-in ',
    'zoom-out',
  ],
};

export function selectOnlyOptions(cssVar) {
    const {property} = cssVar.usages[0];
    return lists[property];
}
