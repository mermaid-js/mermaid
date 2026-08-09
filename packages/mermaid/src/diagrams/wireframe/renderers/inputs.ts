import {
  isButton,
  isTextField,
  isMultiField,
  isTextArea,
  isSelectField,
  isComboBox,
  isCheckboxField,
  isCheckboxGroup,
  isRadioGroup,
  type Button,
  type TextField,
  type MultiField,
  type TextArea,
  type SelectField,
  type ComboBox,
  type CheckboxField,
  type CheckboxGroup,
  type RadioGroup,
} from '@mermaid-js/parser';
import type { ComponentRenderer } from './types.js';
import {
  drawBox,
  drawText,
  drawCheckmark,
  drawRadioDot,
  drawDropdownArrow,
  truncateText,
} from './utils.js';

export const buttonRenderer: ComponentRenderer<Button> = {
  type: 'Button',
  guard: isButton,
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label ?? 'Button';
    const isPrimary = astNode.primary ?? false;

    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-button-group');

    drawBox(
      g,
      x,
      y,
      width,
      height,
      isPrimary ? 'wireframe-button wireframe-button-primary' : 'wireframe-button'
    );

    g.append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('class', isPrimary ? 'wireframe-text wireframe-text-primary' : 'wireframe-text')
      .text(truncateText(label, width - 8));
  },
};

export const textFieldRenderer: ComponentRenderer<TextField | MultiField> = {
  type: 'TextField',
  guard: (comp): comp is TextField => isTextField(comp) || isMultiField(comp),
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label ?? (isTextField(astNode) ? astNode.type : undefined) ?? 'Input';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-textfield');

    let currentY = y;
    if (label) {
      drawText(g, label, x, currentY + 14);
      currentY += 20;
    }

    const inputHeight = Math.max(28, height - (label ? 20 : 0));
    drawBox(g, x, currentY, width, inputHeight, 'wireframe-input');
  },
};

export const textAreaRenderer: ComponentRenderer<TextArea> = {
  type: 'TextArea',
  guard: isTextArea,
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label;
    const isRichText = astNode.richtext ?? false;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-textarea');

    let currentY = y;
    if (label) {
      drawText(g, label, x, currentY + 14);
      currentY += 20;
    }

    const boxHeight = Math.max(50, height - (label ? 20 : 0));
    drawBox(g, x, currentY, width, boxHeight, 'wireframe-input');

    if (isRichText) {
      const toolbarHeight = 30;
      // Background header fill for toolbar bar
      g.append('rect')
        .attr('x', x + 1)
        .attr('y', currentY + 1)
        .attr('width', width - 2)
        .attr('height', toolbarHeight - 1)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('class', 'wireframe-section-header');

      // Divider line under rich text toolbar
      g.append('line')
        .attr('x1', x)
        .attr('y1', currentY + toolbarHeight)
        .attr('x2', x + width)
        .attr('y2', currentY + toolbarHeight)
        .attr('class', 'wireframe-rule');

      const barY = currentY + toolbarHeight / 2;

      // 1. Font Family Dropdown Mock
      const fontBoxWidth = 56;
      drawBox(g, x + 6, currentY + 5, fontBoxWidth, 20, 'wireframe-input', 3);
      drawText(g, 'Sans', x + 10, barY + 4, 'wireframe-text wireframe-text-small');
      drawDropdownArrow(g, x + 6 + fontBoxWidth - 13, barY - 3);

      // 2. Font Size Dropdown Mock
      const sizeBoxWidth = 36;
      drawBox(g, x + 68, currentY + 5, sizeBoxWidth, 20, 'wireframe-input', 3);
      drawText(g, '12', x + 72, barY + 4, 'wireframe-text wireframe-text-small');
      drawDropdownArrow(g, x + 68 + sizeBoxWidth - 13, barY - 3);

      // 3. Vertical Separator 1
      let itemX = x + 112;
      if (itemX + 8 <= x + width - 10) {
        g.append('line')
          .attr('x1', itemX)
          .attr('y1', currentY + 6)
          .attr('x2', itemX)
          .attr('y2', currentY + 24)
          .attr('class', 'wireframe-rule');
        itemX += 12;
      }

      // 4. Text Style Formatting Icons (B, I, U, S)
      const formatTools = [
        { label: 'B', fontClass: 'wireframe-text wireframe-bold' },
        { label: 'I', fontClass: 'wireframe-text wireframe-italic' },
        { label: 'U', fontClass: 'wireframe-text wireframe-underline' },
        { label: 'S', fontClass: 'wireframe-text wireframe-strikethrough' },
      ];

      for (const tool of formatTools) {
        if (itemX + 18 > x + width - 10) {
          break;
        }
        drawText(g, tool.label, itemX, barY + 4, tool.fontClass);
        itemX += 22;
      }

      // 5. Vertical Separator 2
      if (itemX + 8 <= x + width - 10) {
        g.append('line')
          .attr('x1', itemX)
          .attr('y1', currentY + 6)
          .attr('x2', itemX)
          .attr('y2', currentY + 24)
          .attr('class', 'wireframe-rule');
        itemX += 12;
      }

      // 6. Alignment, List & Action Icons
      const actionTools = [
        { label: '≡', width: 18 },
        { label: '•=', width: 22 },
        { label: '1.', width: 20 },
        { label: '🔗', width: 22 },
        { label: '🎨', width: 22 },
      ];

      for (const tool of actionTools) {
        if (itemX + tool.width > x + width - 8) {
          break;
        }
        drawText(g, tool.label, itemX, barY + 4, 'wireframe-text wireframe-text-small');
        itemX += tool.width + 4;
      }
    }

    let val = astNode.value;
    if (val) {
      if (
        (val.startsWith('`') && val.endsWith('`')) ||
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }

      const toolbarOffset = isRichText ? 30 : 0;
      let textLineY = currentY + toolbarOffset + 18;
      const lines = val.split('\n');
      for (const line of lines) {
        if (textLineY > currentY + boxHeight - 6) {
          break;
        }
        drawText(g, line, x + 8, textLineY, 'wireframe-text', 'start', width - 16);
        textLineY += 18;
      }
    }
  },
};

export const selectFieldRenderer: ComponentRenderer<SelectField | ComboBox> = {
  type: 'SelectField',
  guard: (comp): comp is SelectField => isSelectField(comp) || isComboBox(comp),
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label ?? 'Select...';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-select');

    drawBox(g, x, y, width, height, 'wireframe-input');
    drawText(g, label, x + 10, y + height / 2 + 5);
    drawDropdownArrow(g, x + width - 16, y + height / 2 - 3);
  },
};

export const checkboxFieldRenderer: ComponentRenderer<CheckboxField> = {
  type: 'CheckboxField',
  guard: isCheckboxField,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const label = astNode.label ?? '';
    const size = 18;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-checkbox');

    drawBox(g, x, y, size, size, 'wireframe-checkbox-box', 3);
    if (astNode.checked) {
      drawCheckmark(g, x, y);
    }
    if (label) {
      drawText(g, label, x + size + 8, y + 14);
    }
  },
};

export const checkboxGroupRenderer: ComponentRenderer<CheckboxGroup> = {
  type: 'CheckboxGroup',
  guard: isCheckboxGroup,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-checkbox-group');

    let currentY = y;
    if (astNode.label) {
      drawText(g, astNode.label, x, currentY + 14, 'wireframe-text wireframe-bold');
      currentY += 22;
    }

    if (astNode.options) {
      const size = 18;
      for (const opt of astNode.options) {
        drawBox(g, x, currentY, size, size, 'wireframe-checkbox-box', 3);
        if (opt.selected) {
          drawCheckmark(g, x, currentY);
        }
        drawText(g, opt.value ?? '', x + size + 8, currentY + 14);
        currentY += 24;
      }
    }
  },
};

export const radioGroupRenderer: ComponentRenderer<RadioGroup> = {
  type: 'RadioGroup',
  guard: isRadioGroup,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-radio-group');

    let currentY = y;
    if (astNode.label) {
      drawText(g, astNode.label, x, currentY + 14, 'wireframe-text wireframe-bold');
      currentY += 22;
    }

    if (astNode.options) {
      const size = 16;
      for (const opt of astNode.options) {
        const cx = x + size / 2;
        const cy = currentY + size / 2;
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', size / 2)
          .attr('class', 'wireframe-radio-circle');

        if (opt.selected) {
          drawRadioDot(g, cx, cy, 4);
        }
        drawText(g, opt.value ?? '', x + size + 10, currentY + 13);
        currentY += 24;
      }
    }
  },
};
