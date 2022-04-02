import { imgSnapshotTest, renderGraph } from '../../helpers/util';

describe('Katex', () => {
  it('1: should render a complex Katex flowchart no htmlLabels', () => {
    imgSnapshotTest(
      `graph LR
      A["$$f(\\relax{x}) = \\int_{-\\infty}^\\infty \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi$$"] -->|"$$\\Bigg(\\bigg(\\Big(\\big((\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a})\\big)\\Big)\\bigg)\\Bigg)$$"| B("$$1+\\frac{e^{-2\\pi}} {1+\\frac{e^{-4\\pi}} {1+\\frac{e^{-6\\pi}} {1+\\frac{e^{-8\\pi}} {1+\\cdots}}}}$$")
      A -->|"$$\\overbrace{a+b+c}^{\\text{note}}$$"| C("$$\\phase{-78^\\circ}$$")
      B --> D("$$x = \\begin{cases} a &\\text{if } b \\\\ c &\\text{if } d \\end{cases}$$")
      C --> E("$$x(t)=c_1\\begin{bmatrix}-\\cos{t}+\\sin{t}\\\\ 2\\cos{t} \\end{bmatrix}e^{2t}$$")`,
      { fontFamily: 'courier' }
    );
  });
  it('2: should render a Katex flowchart containing the Greek alphabet', () => {
    imgSnapshotTest(
      `graph LR
      A["$$\\alpha\\beta\\gamma\\delta\\epsilon\\zeta\\eta\\theta\\iota\\kappa\\lambda\\mu\\nu\\xi\\omicron\\pi\\rho\\sigma\\tau\\upsilon\\phi\\chi\\psi\\omega$$"] --> B["$$\\Alpha\\Beta\\Gamma\\Delta\\Epsilon\\Zeta\\Eta\\Theta\\Iota\\Kappa\\Lambda\\Mu\\Nu\\Xi\\Omicron\\Pi\\Rho\\Sigma\\Tau\\Upsilon\\Phi\\Chi\\Psi\\Omega$$"]`,
      { fontFamily: 'courier' }
    );
  });
  it('3: should render a Katex flowchart containing set theory symbols', () => {
    imgSnapshotTest(
      `graph LR
      A["$$\\forall\\complement\\therefore\\emptyset\\exists\\subset\\because\\empty\\exist\\supset\\mapsto\\varnothing\\nexists\\mid\\to\\implies\\in\\land\\gets\\impliedby\\isin\\lor\\leftrightarrow\\iff\\notin\\ni\\notni\\lnot$$"] --> B["$$\\nabla\\Im\\Reals\\jmath\\partial\\image\\wp\\aleph\\Game\\weierp\\alef\\Finv\\N\\Z\\alefsym\\cnums\\natnums\\beth\\Complex\\R\\gimel\\ell\\Re\\daleth\\hbar\\real\\eth\\hslash\\reals$$"]`,
      { fontFamily: 'courier' }
    );
  });
  it('4: should render an error box originating from Katex', () => {
    imgSnapshotTest(
      `graph LR
      A["$$\\shouldbeerror$$"]`,
      { fontFamily: 'courier' }
    );
  });
});
