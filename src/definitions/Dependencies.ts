import { FlagInstance } from "./FlagInstance";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "./_core";
import { Option } from './Option';
import { InvalidityReason, InvalidityReport } from './InvalidityReporting';

/** A parent class to all forms of dependency.
 *
 * @template TStrict Whether or not to use strict typing for this class. Any data parsed from user input should be considered untrusted and thus `false` should be used. Otherwise, `true` should be used.
 *
 * NOTE: Many of the Dependency types cannot be statically validated and thus do not have a `TStrict` parameter.
 */
export abstract class Dependency<TStrict extends boolean = boolean> extends XmlRepresentation<TStrict> {
    static override parse(element: Element): Dependency<false> | null {
        switch (element.tagName) {
            case Dependencies.tagName[0]:
            case Dependencies.tagName[1]:
                    return Dependencies.parse(element);

            case FileDependency.tagName:
                return FileDependency.parse(element);

            case FlagDependency.tagName:
                return FlagDependency.parse(element);

            case GameVersionDependency.tagName:
            case ScriptExtenderVersionDependency.tagName:
            case ModManagerVersionDependency.tagName:
                return VersionDependency.parse(element);

            default:
                return null;
        }
    }
}



export class Dependencies<TTagName extends 'moduleDependencies'|'dependencies', TStrict extends boolean = true> extends Dependency {
    static override readonly tagName = ['moduleDependencies', 'dependencies'];

    constructor(
        public readonly tagName: TTagName,
        public operator: TStrict extends true ? 'And' | 'Or' : string = 'And',
        public dependencies: Set<Dependency<TStrict>> = new Set()
    ) {
        super();
    }

    isValid(): this is Dependencies<TTagName, true> {
        return (this.operator === 'And' || this.operator === 'Or') && Array.from(this.dependencies).every(d => d.isValid());
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        if (this.operator !== 'And' && this.operator !== 'Or') return {reason: InvalidityReason.DependenciesUnknownOperator, offendingValue: this.operator, tree};

        for (const dependency of this.dependencies) {
            const reason = dependency.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        return null;
    }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('operator', this.operator);

        for (const dependency of this.dependencies)
            element.appendChild(dependency.asElement(document));

        return element;
    }

    static override parse<TTagName extends 'moduleDependencies'|'dependencies' = 'moduleDependencies'|'dependencies'>(element: Element): Dependencies<TTagName, false> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const tagName = element.tagName as TTagName;
        const operator = element.getAttribute('operator') ?? 'And';
        const dependencies = Array.from(element.children).map(Dependency.parse).filter((d): d is Dependency<false> => d !== null);

        const obj = new Dependencies<TTagName, false>(tagName, operator, new Set(dependencies));
        obj.assignElement(element);
        return obj;
    }

    override decommission(currentDocument?: Document) {
        this.dependencies.forEach(d => d.decommission?.(currentDocument));
    }
}





export class FileDependency<TStrict extends boolean = true> extends Dependency<TStrict> {
    static override readonly tagName = 'fileDependency';
    readonly tagName = 'fileDependency';

    constructor(public filePath: string = '', public desiredState: TStrict extends true ? 'Active'|'Inactive'|'Missing' : string = 'Active') {
        super();
    }

    isValid(): this is FileDependency<true> {
        return this.desiredState === 'Active' || this.desiredState === 'Inactive' || this.desiredState === 'Missing';
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (this.desiredState !== 'Active' && this.desiredState !== 'Inactive' && this.desiredState !== 'Missing')
            return {reason: InvalidityReason.DependencyFileInvalidState, offendingValue: this.desiredState, tree};

        return null;
    }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('file', this.filePath);
        element.setAttribute('state', this.desiredState);

        return element;
    }

    static override parse(element: Element): FileDependency<false> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const filePath = element.getAttribute('file') ?? '';
        const desiredState = element.getAttribute('state') ?? 'Active';

        const obj = new FileDependency<false>(filePath, desiredState);
        obj.assignElement(element);
        return obj;
    }

    override decommission: undefined;
}





export class FlagDependency extends Dependency {
    static override readonly tagName = 'flagDependency';
    readonly tagName = 'flagDependency';

    protected readonly flagInstance: FlagInstance<boolean, false>;


    get flagKey() { return this.flagInstance.name; }
    set flagKey(value: string|Option<boolean>) { this.flagInstance.name = value; }

    get desiredValue() { return this.flagInstance.usedValue; }
    set desiredValue(value: string|boolean) { this.flagInstance.usedValue = value; }

    constructor()
    constructor(flagName: string, desiredValue: string)
    constructor(flagName: Option<boolean>, desiredValue: boolean)
    constructor(flagName: string|Option<boolean> = '', desiredValue: string|boolean = '') {
        super();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.flagInstance = new FlagInstance(flagName as any ?? '', desiredValue as any, false);
    }

    isValid() { return true; }

    reasonForInvalidity() { return null; }

    decommission(currentDocument?: Document) {
        this.flagInstance.decommission(currentDocument);
    }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        if (typeof this.flagKey === 'string') {
            if (typeof this.desiredValue !== 'string') throw new Error('Flag dependency `name` value is a string but `value` is a boolean! Expected string.', {cause: this});
            element.setAttribute('flag', this.flagKey);
            element.setAttribute('value', this.desiredValue);
        } else {
            if (typeof this.flagInstance !== 'boolean') throw new Error('Flag dependency `name` value is an Option but `value` is a string! Expected boolean.', {cause: this});
            element.setAttribute('flag', this.flagKey.getFlagName(document));
            element.setAttribute('value', this.desiredValue ? 'true' : 'false');
        }

        return element;
    }

    static override parse(element: Element): FlagDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const flagName = element.getAttribute('flag') ?? ''; // TODO: Parse Option
        const desiredValue = element.getAttribute('value') ?? '';

        const obj = new FlagDependency(flagName, desiredValue);
        obj.assignElement(element);
        return obj;
    }
}






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

    isValid() { return true; }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('version', this.desiredVersion);

        return element;
    }

    static override parse(element: Element): ScriptExtenderVersionDependency | GameVersionDependency | ModManagerVersionDependency | null {
        const existing = ElementObjectMap.get(element);
        if (existing && (existing instanceof ScriptExtenderVersionDependency || existing instanceof GameVersionDependency || existing instanceof ModManagerVersionDependency)) return existing;


        const desiredVersion = element.getAttribute('version') ?? '';

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
}

/** A dependency on the version of the game.
 *
 * Version dependencies work as a minimum value dependency. [SemVer](https://semver.org/) is used for comparisons.
 *
 * Can be useful in a number of circumstances where the game executable version matters, such as determining what version of a script extender plugin to install.
 */
export class GameVersionDependency extends VersionDependency {
    static override readonly tagName = 'gameDependency';
    readonly tagName = 'gameDependency';
    constructor(desiredVersion?: string) { super(desiredVersion); }

    static override parse(element: Element): GameVersionDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const desiredVersion = element.getAttribute('version') ?? '';

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
    static override readonly tagName = 'foseDependency';
    readonly tagName = 'foseDependency';
    constructor(desiredVersion?: string) { super(desiredVersion); }

    static override parse(element: Element): ScriptExtenderVersionDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const desiredVersion = element.getAttribute('version') ?? '';

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
    static override readonly tagName = 'fommDependency';
    readonly tagName = 'fommDependency';
    constructor(desiredVersion?: string) { super(desiredVersion); }

    static override parse(element: Element): ModManagerVersionDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const desiredVersion = element.getAttribute('version') ?? '';

        const obj = new ModManagerVersionDependency(desiredVersion);
        obj.assignElement(element);
        return obj;
    }
}
