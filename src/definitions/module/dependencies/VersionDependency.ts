import { Dependency } from "./Dependency";
import { AttributeName, TagName } from "../../Enums";
import { ElementObjectMap } from "../../lib";
import { FomodDocumentConfig } from "../../lib/FomodDocumentConfig";


/** Common parent for version check dependencies to reduce code duplication.
 *
 * Version dependencies work as a minimum value dependency. [SemVer](https://semver.org/) is used for comparisons.
 */
export abstract class VersionDependency extends Dependency {
    constructor(
        /** The version to use in the comparison
         *
         * Version dependencies work as a minimum value dependency. [SemVer](https://semver.org/) is used for comparisons.
        */
        public desiredVersion: string = '',
    ) {
        super();
    }

    isValid(): this is VersionDependency { return true; }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.setAttribute(AttributeName.Version, this.desiredVersion);

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): ScriptExtenderVersionDependency | GameVersionDependency | ModManagerVersionDependency | null {
        const existing = ElementObjectMap.get(element);
        if (existing && (existing instanceof ScriptExtenderVersionDependency || existing instanceof GameVersionDependency || existing instanceof ModManagerVersionDependency)) return existing;


        const desiredVersion = element.getAttribute(AttributeName.Version) ?? '';

        let obj: ReturnType<typeof VersionDependency['parse']> = null;

        switch (element.tagName) {
            case ScriptExtenderVersionDependency.tagName: obj = new ScriptExtenderVersionDependency(desiredVersion); break;
            case GameVersionDependency.tagName: obj = new GameVersionDependency(desiredVersion); break;
            case ModManagerVersionDependency.tagName: obj = new ModManagerVersionDependency(desiredVersion); break;
        }

        obj?.assignElement(element);
        return obj;
    }

    override decommission: undefined;

    reasonForInvalidity() { return null; }
    associateWithDocument(document: Document) { return; }
}

/** A dependency on the version of the game.
 *
 * Version dependencies work as a minimum value dependency. [SemVer](https://semver.org/) is used for comparisons.
 *
 * Can be useful in a number of circumstances where the game executable version matters, such as determining what version of a script extender plugin to install.
 */
export class GameVersionDependency extends VersionDependency {
    static override readonly tagName = TagName.GameDependency;
    readonly tagName = TagName.GameDependency;
    constructor(desiredVersion?: string) { super(desiredVersion); }

    static override parse(element: Element, config: FomodDocumentConfig = {}): GameVersionDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const desiredVersion = element.getAttribute(AttributeName.Version) ?? '';

        const obj = new GameVersionDependency(desiredVersion);
        obj.assignElement(element);
        return obj;
    }
}

/** A dependency on the version of the installed script extender.
 *
 * Version dependencies work as a minimum value dependency. [SemVer](https://semver.org/) is used for comparisons.
 *
 * Can be useful in a number of circumstances where the script extender version matters, such as determining if a mod is compatible with the given version.
*/
export class ScriptExtenderVersionDependency extends VersionDependency {
    static override readonly tagName = TagName.FOSEDependency;
    readonly tagName = TagName.FOSEDependency;
    constructor(desiredVersion?: string) { super(desiredVersion); }

    static override parse(element: Element, config: FomodDocumentConfig = {}): ScriptExtenderVersionDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const desiredVersion = element.getAttribute(AttributeName.Version) ?? '';

        const obj = new ScriptExtenderVersionDependency(desiredVersion);
        obj.assignElement(element);
        return obj;
    }
}


/** A dependency on the version of the mod manager.
 *
 * Version dependencies work as a minimum value dependency. [SemVer](https://semver.org/) is used for comparisons.
 *
 * @deprecated Should generally not be used as the value is inconsistent between mod managers. Included for completeness.
 */
export class ModManagerVersionDependency extends VersionDependency {
    static override readonly tagName = TagName.FOMMDependency;
    readonly tagName = TagName.FOMMDependency;
    constructor(desiredVersion?: string) { super(desiredVersion); }

    static override parse(element: Element, config: FomodDocumentConfig = {}): ModManagerVersionDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const desiredVersion = element.getAttribute(AttributeName.Version) ?? '';

        const obj = new ModManagerVersionDependency(desiredVersion);
        obj.assignElement(element);
        return obj;
    }
}
