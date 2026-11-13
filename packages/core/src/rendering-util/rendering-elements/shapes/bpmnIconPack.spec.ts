import { beforeEach, describe, expect, it, vi } from 'vitest';

const userMarker = 'data-user-pack';
const userPack = {
  prefix: 'bpmn',
  width: 24,
  height: 24,
  icons: { message: { body: `<path ${userMarker}="1" d="M0 0h24v24H0z"/>` } },
};

describe('the BPMN icon pack', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('capability_registers_the_built_in_glyphs_when_no_pack_is_named_bpmn', async () => {
    const { ensureBpmnIcons } = await import('./bpmnShapeCore.js');
    const { getIconSVG } = await import('../../icons.js');
    await ensureBpmnIcons();
    const svg = await getIconSVG('bpmn:message');
    expect(svg).toContain('<path');
    expect(svg).not.toContain(userMarker);
  });

  it('limit_keeps_a_pack_the_user_registered_under_the_name_bpmn', async () => {
    const { ensureBpmnIcons } = await import('./bpmnShapeCore.js');
    const { getIconSVG, registerIconPacks } = await import('../../icons.js');
    registerIconPacks([{ name: 'bpmn', icons: userPack }]);
    await ensureBpmnIcons();
    expect(await getIconSVG('bpmn:message')).toContain(userMarker);
  });

  it('limit_keeps_an_unloaded_loader_the_user_registered_under_the_name_bpmn', async () => {
    const { ensureBpmnIcons } = await import('./bpmnShapeCore.js');
    const { getIconSVG, registerIconPacks } = await import('../../icons.js');
    registerIconPacks([{ name: 'bpmn', loader: () => Promise.resolve(userPack) }]);
    await ensureBpmnIcons();
    expect(await getIconSVG('bpmn:message')).toContain(userMarker);
  });
});
