import svgDraw from './svgDraw';
import { select } from 'd3';

describe('svgDraw', function () {
  let svg;

  beforeEach(() => {
    document.body.innerHTML = '<svg/>';
    svg = select('svg');
  });

  describe('drawRect', () => {
    it('should append a rectangle', () => {
      const rect = svgDraw.drawRect(svg, {
        x: '10',
        y: '20',
        width: '30',
        height: '40',
        rx: '50',
        ry: '60',
        fill: 'red',
        stroke: 'blue',
        class: 'test-class',
      });

      expect(svg.select('rect').size()).toBe(1);

      expect(rect.attr('x')).toBe('10');
      expect(rect.attr('y')).toBe('20');
      expect(rect.attr('width')).toBe('30');
      expect(rect.attr('height')).toBe('40');
      expect(rect.attr('rx')).toBe('50');
      expect(rect.attr('ry')).toBe('60');
      expect(rect.attr('fill')).toBe('red');
      expect(rect.attr('stroke')).toBe('blue');
      expect(rect.attr('class')).toBe('test-class');
    });
  });

  describe('drawText', function () {
    it('should append a single text element', function () {
      const texts = svgDraw.drawText(svg, {
        x: '10',
        y: '10',
        dy: '1em',
        text: 'One fine text message',
        class: 'test-class',
        fontFamily: 'courier',
        fontSize: '10px',
        fontWeight: '500',
      });

      expect(texts.length).toBe(1);
      expect(svg.selectAll('text').size()).toBe(1);

      expect(texts[0].attr('x')).toBe('10');
      expect(texts[0].attr('y')).toBe('10');
      expect(texts[0].attr('dy')).toBe('1em');
      expect(texts[0].attr('class')).toBe('test-class');
      expect(texts[0].text()).toBe('One fine text message');
      expect(texts[0].style('font-family')).toBe('courier');
      expect(texts[0].style('font-size')).toBe('10px');
      expect(texts[0].style('font-weight')).toBe('500');
    });

    it('should append multiple text elements when <br> present', function () {
      const texts = svgDraw.drawText(svg, {
        x: '10',
        y: '20',
        text: 'line 1<br>line 2<br/>line 3',
      });

      expect(texts.length).toBe(3);
      expect(svg.selectAll('text').size()).toBe(3);

      expect(texts[0].text()).toBe('line 1');
      expect(texts[1].text()).toBe('line 2');
      expect(texts[2].text()).toBe('line 3');

      texts.forEach((text) => {
        expect(text.attr('x')).toBe('10');
        expect(text.attr('y')).toBe('20');
      });
    });
  });

  describe('drawBackgroundRect', function () {
    it('should append a rect before the previous element within a given bound', function () {
      const rect = svgDraw.drawBackgroundRect(svg, {
        startx: '50',
        starty: '200',
        stopx: '150',
        stopy: '260',
        title: undefined,
        fill: 'red',
      });

      expect(svg.selectAll('rect').size()).toBe(1);

      expect(rect.attr('x')).toBe('50');
      expect(rect.attr('y')).toBe('200');
      expect(rect.attr('width')).toBe('100');
      expect(rect.attr('height')).toBe('60');
      expect(rect.attr('fill')).toBe('red');
      expect(rect.attr('class')).toBe('rect');
    });
  });

  describe('sanitizeUrl', function () {
    it('should sanitize malicious urls', function () {
      const maliciousStr = 'javascript:script:alert(1)';
      const result = svgDraw.sanitizeUrl(maliciousStr);
      expect(result).not.toContain('javascript:alert(1)');
    });

    it('should not sanitize non dangerous urls', function () {
      const maliciousStr = 'javajavascript:script:alert(1)';
      const result = svgDraw.sanitizeUrl(maliciousStr);
      expect(result).not.toContain('javascript:alert(1)');
    });
  });
});
