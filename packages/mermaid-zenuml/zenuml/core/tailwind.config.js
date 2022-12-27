module.exports = {
  important: '.zenuml',
  content: ['./public/**/*.html', './src/**/*.vue'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      textColor: {
        skin: {
          title: 'var(--color-text-title, var(--color-text-message, var(--color-text-base, #000)))',
          participant:
            'var(--color-text-participant, var(--color-text-message, var(--color-text-base, #000)))',
          message: 'var(--color-text-message, var(--color-text-base, #000))',
          'message-arrow':
            'var(--color-message-arrow, var(--color-border-frame, var(--color-border-base, #000)))', // message arrow head
          'message-hover': 'var(--color-text-message-hover, var(--color-bg-base, #fff))',
          comment:
            'var(--color-text-comment, var(--color-text-secondary, var(--color-text-base, #000)))',
          'fragment-header': 'var(--color-text-fragment-header, var(--color-text-message, #000))',
          fragment: 'var(--color-text-fragment, var(--color-text-message, #000))',
          base: 'var(--color-text-base)',
          header: 'var(--color-text-header)',
          secondary: 'var(--color-text-secondary)',
          control:
            'var(--color-text-control, var(--color-text-secondary, var(--color-text-base, #000)))',
          muted: 'var(--color-text-muted)',
          hover: 'var(--color-text-hover)',
          link: `var(--color-text-link, var(--color-text-secondary, var(--color-text-base, #000)))`,
          fill: `var(--color-text-fill)`,
        },
      },
      backgroundColor: {
        skin: {
          canvas: 'var(--color-bg-canvas, var(--color-bg-base, #fff))',
          frame: 'var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff)))',
          title:
            'var(--color-bg-title, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff))))',
          participant:
            'var(--color-bg-participant, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff))))',
          lifeline:
            'var(--color-border-participant, var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000))))',
          divider:
            'var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000)))',
          'message-hover': 'var(--color-bg-message-hover, var(--color-text-base, #000))',
          'fragment-header': 'var(--color-bg-fragment-header, transparent)',
          occurrence:
            'var(--color-bg-occurrence, var(--color-bg-participant, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff)))))',
          base: 'var(--color-bg-base)',
          secondary: 'var(--color-bg-secondary)',
          hover: 'var(--color-bg-hover)',
          fill: 'var(--color-bg-fill)',
        },
      },
      borderColor: {
        skin: {
          frame: 'var(--color-border-frame, var(--color-border-base, #000))',
          participant:
            'var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000)))',
          'message-arrow':
            'var(--color-message-arrow, var(--color-border-frame,  var(--color-border-base, #000)))', // message arrow line
          fragment:
            'var(--color-border-fragment, var(--color-border-frame,  var(--color-border-base, #000)))',
          occurrence:
            'var(--color-border-occurrence, var(--color-border-frame,  var(--color-border-base, #000)))',
          base: 'var(--color-border-base)',
          secondary: 'var(--color-border-secondary)',
        },
      },
      gradientColorStops: {
        skin: {
          base: 'var(--color-bg-base)',
          secondary: 'var(--color-bg-secondary)',
        },
      },
    },
  },
  variants: {
    extend: {
      overflow: ['hover', 'focus'],
      whitespace: ['hover', 'focus'],
      display: ['group-hover'],
    },
  },
  plugins: [],
};
