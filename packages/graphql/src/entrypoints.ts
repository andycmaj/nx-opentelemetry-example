import { readFileSync } from 'fs';
import { getEntrypointsConfigFile } from './asset-utils';
import { ModuleMetadata } from '@nestjs/common';
import { SubschemaProvider } from './subschema-provider';

// infer array element type from array type
type ElementType<T extends Array<unknown>> = T extends Array<infer ElementType>
  ? ElementType
  : never;

/**
 * represents a nest entrypoint module with an associated set of harness tags.
 */
export interface EntrypointModule {
  /**
   * list of strings by which this module can be grouped and loaded by the entrypoint app
   * corresponds to
   * environment variables: TAGS
   * .entrypoints.json: 'tags'
   */
  tags: string[];

  /**
   * a top-level nest module that loads all resolvers, handlers, proviers, etc. for this entrypoint
   * this module will be loaded into the same Nest APPLICATION module as any other entrypoints that
   * share common tags with this entrypoint.
   */
  module: ElementType<ModuleMetadata['imports']>;
  schemaProvider?: SubschemaProvider;
}

export interface EntrypointModuleConfig {
  tags: string[];
  port: number;
}

export type EntrypointsConfig = Record<string, EntrypointModuleConfig>;

const defaultConfig: EntrypointsConfig = {
  default: {
    tags: (process.env.TAGS ?? '').split(','),
    port: parseInt(process.env.HTTP_PORT ?? '80'),
  },
};

/**
 * load or create an entrypoints config for running 1 or many entrypoint groups
 */
export const getEntrypointsConfig = (): EntrypointsConfig => {
  if (process.env.TAGS) {
    // manually grouping using TAGS env var, as in cluster deployments
    return defaultConfig;
  }

  try {
    const configFile = readFileSync(getEntrypointsConfigFile());
    const config = JSON.parse(configFile.toString()) as EntrypointsConfig;

    if (process.env.ENTRYPOINT) {
      if (!config[process.env.ENTRYPOINT]) {
        throw new Error(
          `specified an ENTRYPOINT=${process.env.ENTRYPOINT} to load, but it was not found in .entrypoints.json`
        );
      }

      // filter out other entrypoints not specified
      return {
        [process.env.ENTRYPOINT]: config[process.env.ENTRYPOINT],
      };
    }

    return config;
  } catch {
    if (!process.env.TAGS) {
      throw new Error(
        'missing .entrypoints.json and TAGS not specified in ENV'
      );
    }
    return defaultConfig;
  }
};

export type TagEntrypointMap = Record<string, Array<EntrypointModule>>;

/**
 * pivot an array of tagged modules into a map of tag -> module[]
 */
export const filterEntrypointsByTag = (
  modules: EntrypointModule[],
  tags: string[]
): Array<EntrypointModule> => {
  const groupedByTags: TagEntrypointMap = modules.reduce((groups, module) => {
    // TODO: use a merge func
    const tags = module.tags;
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      if (groups[tag]) {
        groups[tag] = [...groups[tag], module];
      } else {
        groups[tag] = [module];
      }
    }
    return groups;
  }, {} as TagEntrypointMap);

  const entrypoints = tags?.flatMap((tag) => groupedByTags[tag]) ?? [];

  return entrypoints;
};

export const filterEntrypointsByGroup = (
  modules: EntrypointModule[],
  groupName: string
): Array<EntrypointModule> => {
  const config = getEntrypointsConfig();
  if (!config[groupName]) {
    throw new Error(
      `Could not find entrypoint group ${groupName} in .entrypoints.json`
    );
  }

  const tags = config[groupName].tags;

  return filterEntrypointsByTag(modules, tags);
};
