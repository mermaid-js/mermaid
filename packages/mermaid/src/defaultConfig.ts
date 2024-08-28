import type { RequiredDeep } from 'type-fest';

import theme from './themes/index.js';
import type { MermaidConfig } from './config.type.js';

// Uses our custom Vite jsonSchemaPlugin to load only the default values from
// our JSON Schema
// @ts-expect-error This file is automatically generated via a custom Vite plugin
import defaultConfigJson from './schemas/config.schema.yaml?only-defaults=true';

/**
 * Default mermaid configuration options.
 *
 * Please see the Mermaid config JSON Schema for the default JSON values.
 * Non-JSON JS default values are listed in this file, e.g. functions, or
 * `undefined` (explicitly set so that `configKeys` finds them).
 */
const config: RequiredDeep<MermaidConfig> = {
  ...defaultConfigJson,
  // Set, even though they're `undefined` so that `configKeys` finds these keys
  // TODO: Should we replace these with `null` so that they can go in the JSON Schema?
  deterministicIDSeed: undefined,
  elk: {
    // mergeEdges is needed here to be considered
    mergeEdges: false,
    nodePlacementStrategy: 'BRANDES_KOEPF',
  },
  themeCSS: undefined,

  // add non-JSON default config values
  themeVariables: theme.default.getThemeVariables(),
  sequence: {
    ...defaultConfigJson.sequence,
    messageFont: function () {
      return {
        fontFamily: this.messageFontFamily,
        fontSize: this.messageFontSize,
        fontWeight: this.messageFontWeight,
      };
    },
    noteFont: function () {
      return {
        fontFamily: this.noteFontFamily,
        fontSize: this.noteFontSize,
        fontWeight: this.noteFontWeight,
      };
    },
    actorFont: function () {
      return {
        fontFamily: this.actorFontFamily,
        fontSize: this.actorFontSize,
        fontWeight: this.actorFontWeight,
      };
    },
  },
  gantt: {
    ...defaultConfigJson.gantt,
    tickInterval: undefined,
    useWidth: undefined, // can probably be removed since `configKeys` already includes this
  },
  c4: {
    ...defaultConfigJson.c4,
    useWidth: undefined,
    personFont: function () {
      return {
        fontFamily: this.personFontFamily,
        fontSize: this.personFontSize,
        fontWeight: this.personFontWeight,
      };
    },

    external_personFont: function () {
      return {
        fontFamily: this.external_personFontFamily,
        fontSize: this.external_personFontSize,
        fontWeight: this.external_personFontWeight,
      };
    },

    systemFont: function () {
      return {
        fontFamily: this.systemFontFamily,
        fontSize: this.systemFontSize,
        fontWeight: this.systemFontWeight,
      };
    },

    external_systemFont: function () {
      return {
        fontFamily: this.external_systemFontFamily,
        fontSize: this.external_systemFontSize,
        fontWeight: this.external_systemFontWeight,
      };
    },

    system_dbFont: function () {
      return {
        fontFamily: this.system_dbFontFamily,
        fontSize: this.system_dbFontSize,
        fontWeight: this.system_dbFontWeight,
      };
    },

    external_system_dbFont: function () {
      return {
        fontFamily: this.external_system_dbFontFamily,
        fontSize: this.external_system_dbFontSize,
        fontWeight: this.external_system_dbFontWeight,
      };
    },

    system_queueFont: function () {
      return {
        fontFamily: this.system_queueFontFamily,
        fontSize: this.system_queueFontSize,
        fontWeight: this.system_queueFontWeight,
      };
    },

    external_system_queueFont: function () {
      return {
        fontFamily: this.external_system_queueFontFamily,
        fontSize: this.external_system_queueFontSize,
        fontWeight: this.external_system_queueFontWeight,
      };
    },

    containerFont: function () {
      return {
        fontFamily: this.containerFontFamily,
        fontSize: this.containerFontSize,
        fontWeight: this.containerFontWeight,
      };
    },

    external_containerFont: function () {
      return {
        fontFamily: this.external_containerFontFamily,
        fontSize: this.external_containerFontSize,
        fontWeight: this.external_containerFontWeight,
      };
    },

    container_dbFont: function () {
      return {
        fontFamily: this.container_dbFontFamily,
        fontSize: this.container_dbFontSize,
        fontWeight: this.container_dbFontWeight,
      };
    },

    external_container_dbFont: function () {
      return {
        fontFamily: this.external_container_dbFontFamily,
        fontSize: this.external_container_dbFontSize,
        fontWeight: this.external_container_dbFontWeight,
      };
    },

    container_queueFont: function () {
      return {
        fontFamily: this.container_queueFontFamily,
        fontSize: this.container_queueFontSize,
        fontWeight: this.container_queueFontWeight,
      };
    },

    external_container_queueFont: function () {
      return {
        fontFamily: this.external_container_queueFontFamily,
        fontSize: this.external_container_queueFontSize,
        fontWeight: this.external_container_queueFontWeight,
      };
    },

    componentFont: function () {
      return {
        fontFamily: this.componentFontFamily,
        fontSize: this.componentFontSize,
        fontWeight: this.componentFontWeight,
      };
    },

    external_componentFont: function () {
      return {
        fontFamily: this.external_componentFontFamily,
        fontSize: this.external_componentFontSize,
        fontWeight: this.external_componentFontWeight,
      };
    },

    component_dbFont: function () {
      return {
        fontFamily: this.component_dbFontFamily,
        fontSize: this.component_dbFontSize,
        fontWeight: this.component_dbFontWeight,
      };
    },

    external_component_dbFont: function () {
      return {
        fontFamily: this.external_component_dbFontFamily,
        fontSize: this.external_component_dbFontSize,
        fontWeight: this.external_component_dbFontWeight,
      };
    },

    component_queueFont: function () {
      return {
        fontFamily: this.component_queueFontFamily,
        fontSize: this.component_queueFontSize,
        fontWeight: this.component_queueFontWeight,
      };
    },

    external_component_queueFont: function () {
      return {
        fontFamily: this.external_component_queueFontFamily,
        fontSize: this.external_component_queueFontSize,
        fontWeight: this.external_component_queueFontWeight,
      };
    },

    boundaryFont: function () {
      return {
        fontFamily: this.boundaryFontFamily,
        fontSize: this.boundaryFontSize,
        fontWeight: this.boundaryFontWeight,
      };
    },

    messageFont: function () {
      return {
        fontFamily: this.messageFontFamily,
        fontSize: this.messageFontSize,
        fontWeight: this.messageFontWeight,
      };
    },
  },
  pie: {
    ...defaultConfigJson.pie,
    useWidth: 984,
  },
  xyChart: {
    ...defaultConfigJson.xyChart,
    useWidth: undefined,
  },
  requirement: {
    ...defaultConfigJson.requirement,
    useWidth: undefined,
  },
  packet: {
    ...defaultConfigJson.packet,
  },
};

const keyify = (obj: any, prefix = ''): string[] =>
  Object.keys(obj).reduce((res: string[], el): string[] => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, prefix + el, ...keyify(obj[el], '')];
    }
    return [...res, prefix + el];
  }, []);

export const configKeys = new Set<string>(keyify(config, ''));
export default config;
