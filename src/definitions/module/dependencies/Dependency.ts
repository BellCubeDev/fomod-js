import { XmlRepresentation } from "../../lib/XmlRepresentation";
import { FomodDocumentConfig } from "../../lib/FomodDocumentConfig";
import { FileDependency, FlagDependency, DependenciesGroup, VersionDependency, GameVersionDependency, ModManagerVersionDependency, ScriptExtenderVersionDependency } from ".";

/** A parent class to all forms of dependency.
 *
 * @template TStrict Whether or not to use strict typing for this class. Any data parsed from user input should be considered untrusted and thus `false` should be used. Otherwise, `true` should be used.
 *
 * NOTE: Many of the Dependency types cannot be statically validated and thus do not have a `TStrict` parameter.
 */
export abstract class Dependency<TStrict extends boolean = boolean> extends XmlRepresentation<TStrict> {
    static override parse(element: Element, config: FomodDocumentConfig = {}): Dependency<false> | null {
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
}