import { FlagDependency } from '.';
import type { FomodDocumentConfig } from '../../lib/FomodDocumentConfig';
import { DependenciesGroup, DependencyTagName } from './DependenciesGroup';
import { FileDependency } from './FileDependency';
import { GameVersionDependency, ModManagerVersionDependency, ScriptExtenderVersionDependency, VersionDependency } from './VersionDependency';
import { Dependency } from './Dependency';

export * from './Dependency';
export * from "./DependenciesGroup";
export * from "./FileDependency";
export * from "./FlagDependency";
export * from "./VersionDependency";

export type ValidDependency<TStrict extends boolean> = FileDependency<TStrict> | FlagDependency | GameVersionDependency | ScriptExtenderVersionDependency | ModManagerVersionDependency | DependenciesGroup<DependencyTagName, TStrict>;

function parseDependency(element: Element, config: FomodDocumentConfig = {}):  ValidDependency<false> | null {
    switch (element.tagName) {
        case DependenciesGroup.tagName[0]:
        case DependenciesGroup.tagName[1]:
        case DependenciesGroup.tagName[2]:
            return DependenciesGroup.parse(element, config);

        case FileDependency.tagName:
            return FileDependency.parse(element, config);

        case FlagDependency.tagName:
            return FlagDependency.parse(element, config);

        case GameVersionDependency.tagName:
        case ScriptExtenderVersionDependency.tagName:
        case ModManagerVersionDependency.tagName:
            return VersionDependency.parse(element, config);

        default:
            return null;
    }
}
Dependency.parse = parseDependency;
