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
import { drawBox, drawText, drawCheckmark, drawRadioDot, drawDropdownArrow, truncateText } from './utils.js';

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
    const label = astNode.label ?? 'Text Area';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-textarea');

    let currentY = y;
    if (label) {
      drawText(g, label, x, currentY + 14);
      currentY += 20;
    }

    const boxHeight = Math.max(50, height - (label ? 20 : 0));
    drawBox(g, x, currentY, width, boxHeight, 'wireframe-input');
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
