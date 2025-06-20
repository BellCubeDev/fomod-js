import { TagName, type DependencyGroupOperator, type FileDependencyState } from "../Enums";
import { DependenciesGroup, FileDependency, Option, DependencyTagName, FlagDependency, GameVersionDependency, ModManagerVersionDependency, ScriptExtenderVersionDependency, type ValidDependency } from "../module";
import { FlagInstance, FlagInstanceStoresByDocument } from "./FlagInstance";

// This exists mostly for copy-paste cross-tab purposes. The joys of building a browser-based editor and controlling the library it uses!

export enum DependencyType {
    Group = 'group',
    File = 'file',
    Flag = 'flag',
    ScriptExtenderVersion = 'fose',
    GameVersion = 'game',
    ModManagerVersion = 'fomm',
}

export interface DependencyJsonItemBase<TSerializable extends boolean>  {
    type: DependencyType;
}

export interface DependenciesJsonGroup<TSerializable extends boolean> extends DependencyJsonItemBase<TSerializable> {
    type: DependencyType.Group;
    dependencies: DependenciesJsonItem<TSerializable>[];
    operator: DependencyGroupOperator;
    tagName: typeof DependenciesGroup.tagName extends Array<infer T> ? T : never;
}

export interface DependenciesJsonFile extends DependencyJsonItemBase<boolean> {
    type: DependencyType.File;
    path: string;
    state: FileDependencyState;
}

export interface DependenciesJsonFlag<TSerializable extends boolean> extends DependencyJsonItemBase<TSerializable> {
    type: DependencyType.Flag;
    flag: string | (TSerializable extends true ? never : Option<boolean>);
    value: string |  (TSerializable extends true ? never : true);
    isOptionFlag: boolean;
}

export interface DependenciesJsonScriptExtender extends DependencyJsonItemBase<boolean> {
    type: DependencyType.ScriptExtenderVersion;
    version: string;
}

export interface DependenciesJsonGameVersion extends DependencyJsonItemBase<boolean> {
    type: DependencyType.GameVersion;
    version: string;
}

export interface DependenciesJsonModManager extends DependencyJsonItemBase<boolean> {
    type: DependencyType.ModManagerVersion;
    version: string;
}

export type DependenciesJsonItem<TSerializable extends boolean> = DependenciesJsonGroup<TSerializable> | DependenciesJsonFile | DependenciesJsonFlag<TSerializable> | DependenciesJsonScriptExtender | DependenciesJsonGameVersion | DependenciesJsonModManager;

export function jsonifyDependencyElements(elements: Iterable<ValidDependency<true>>, serializable: false, document?: Document): DependenciesJsonItem<false>[]
export function jsonifyDependencyElements(elements: Iterable<ValidDependency<true>>, serializable: true, document: Document): DependenciesJsonItem<true>[]
export function jsonifyDependencyElements<TSerializable extends true|false>(elements: Iterable<ValidDependency<true>>, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonItem<TSerializable>[]
export function jsonifyDependencyElements<TSerializable extends true|false>(elements: Iterable<ValidDependency<true>>, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonItem<TSerializable>[] {
    const returnVal: DependenciesJsonItem<TSerializable>[] = [];
    for (const e of elements) {
        returnVal.push(jsonifyDependencyElement<TSerializable>(e, serializable as any, document as any));
    }

    return returnVal;
}

export function jsonifyDependencyElement(dependency: ValidDependency<true>, serializable: false, document?: Document): DependenciesJsonItem<false>
export function jsonifyDependencyElement(dependency: ValidDependency<true>, serializable: true, document: Document): DependenciesJsonItem<true>
export function jsonifyDependencyElement<TSerializable extends boolean>(dependency: ValidDependency<true>, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonItem<TSerializable>
export function jsonifyDependencyElement<TSerializable extends boolean>(dependency: ValidDependency<true>, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonItem<TSerializable> {
    switch (dependency.tagName) {
        case TagName.Dependencies:
        case TagName.ModuleDependencies:
        case TagName.Visible:
            return jsonifyDependenciesGroup<TSerializable>(dependency, serializable as any, document);
        case TagName.FileDependency:
            return jsonifyFileDependency(dependency);
        case TagName.FlagDependency:
            return jsonifyFlagDependency<TSerializable>(dependency, serializable as any, document);
        case TagName.FOMMDependency:
            return jsonifyModManagerVersionDependency(dependency);
        case TagName.FOSEDependency:
            return jsonifyScriptExtenderVersionDependency(dependency);
        case TagName.GameDependency:
            return jsonifyGameVersionDependency(dependency);
    }
}

export function jsonifyDependenciesGroup(dependencyGroup: DependenciesGroup<DependencyTagName, true>, serializable: false, document?: undefined): DependenciesJsonGroup<false>
export function jsonifyDependenciesGroup(dependencyGroup: DependenciesGroup<DependencyTagName, true>, serializable: true, document: Document): DependenciesJsonGroup<true>
export function jsonifyDependenciesGroup<TSerializable extends boolean>(dependencyGroup: DependenciesGroup<DependencyTagName, true>, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonGroup<TSerializable>
export function jsonifyDependenciesGroup<TSerializable extends boolean>(dependencyGroup: DependenciesGroup<DependencyTagName, true>, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonGroup<TSerializable> {
    return {
        type: DependencyType.Group,
        tagName: dependencyGroup.tagName,
        dependencies: jsonifyDependencyElements<TSerializable>(dependencyGroup.dependencies, serializable as any, document as any),
        operator: dependencyGroup.operator,
    };
}

export function jsonifyFileDependency(file: FileDependency<true>): DependenciesJsonFile {
    return {
        type: DependencyType.File,
        path: file.filePath,
        state: file.desiredState,
    };
}

export function jsonifyFlagDependency(flagDependency: FlagDependency, serializable: false, document?: undefined): DependenciesJsonFlag<false>
export function jsonifyFlagDependency(flagDependency: FlagDependency, serializable: true, document: Document): DependenciesJsonFlag<true>
export function jsonifyFlagDependency<TSerializable extends boolean>(flagDependency: FlagDependency, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonFlag<TSerializable>
export function jsonifyFlagDependency<TSerializable extends boolean>(flagDependency: FlagDependency, serializable: TSerializable, document: Document | (TSerializable extends true ? never : undefined)): DependenciesJsonFlag<TSerializable> {
    let flagKey: string | (TSerializable extends true ? never : Option<boolean>);
    let desiredValue: string |  (TSerializable extends true ? never : boolean);
    if (!serializable) {
        flagKey = flagDependency.flagKey as string | (TSerializable extends true ? never : Option<boolean>);
        desiredValue = flagDependency.desiredValue as string |  (TSerializable extends true ? never : boolean);
    } else {
        if (typeof flagDependency.flagKey === 'string') {
            flagKey = flagDependency.flagKey;
            desiredValue = flagDependency.desiredValue as string |  (TSerializable extends true ? never : boolean);
        } else {
            const setter = flagDependency.flagKey.getOptionFlagSetter(document!);
            flagKey = setter.name;
            desiredValue = setter.value;
        }
    }

    return {
        type: DependencyType.Flag,
        isOptionFlag: typeof flagDependency.flagKey !== 'string',
        flag: flagKey as any,
        value: desiredValue as any,
    };
}

export function jsonifyModManagerVersionDependency(versionDependency: ModManagerVersionDependency): DependenciesJsonModManager {
    return {
        type: DependencyType.ModManagerVersion,
        version: versionDependency.desiredVersion,
    };
}

export function jsonifyScriptExtenderVersionDependency(versionDependency: ScriptExtenderVersionDependency): DependenciesJsonScriptExtender {
    return {
        type: DependencyType.ScriptExtenderVersion,
        version: versionDependency.desiredVersion,
    };
}

export function jsonifyGameVersionDependency(versionDependency: GameVersionDependency): DependenciesJsonGameVersion {
    return {
        type: DependencyType.GameVersion,
        version: versionDependency.desiredVersion,
    };
}

export function parseDependencyJsonItems(elements: Iterable<DependenciesJsonItem<boolean>>, document: Document | null): ValidDependency<true>[] {
    const returnVal: ValidDependency<true>[] = [];
    for (const e of elements) {
        returnVal.push(parseDependencyJsonItem(e, document));
    }

    return returnVal;
}

export function parseDependencyJsonItem(dependency: DependenciesJsonItem<boolean>, document: Document | null): ValidDependency<true> {
    switch (dependency.type) {
        case DependencyType.Group:
            return parseDependenciesGroupJsonItem(dependency, document);
        case DependencyType.File:
            return parseFileDependencyJsonItem(dependency);
        case DependencyType.Flag:
            return parseFlagDependencyJsonItem(dependency, document);
        case DependencyType.ModManagerVersion:
            return parseModManagerVersionDependencyJsonItem(dependency);
        case DependencyType.ScriptExtenderVersion:
            return parseScriptExtenderVersionDependencyJsonItem(dependency);
        case DependencyType.GameVersion:
            return parseGameVersionDependencyJsonItem(dependency);
    }
}

export function parseDependenciesGroupJsonItem(dependencyGroup: DependenciesJsonGroup<boolean>, document: Document | null): DependenciesGroup<DependencyTagName, true> {
    return new DependenciesGroup(
        dependencyGroup.tagName,
        dependencyGroup.operator,
        new Set(parseDependencyJsonItems(dependencyGroup.dependencies, document)),
    );
}

export function parseFileDependencyJsonItem(file: DependenciesJsonFile): FileDependency<boolean> {
    return new FileDependency(
        file.path,
        file.state,
    );
}


// This function exists to make it easy to add a bunch of guard clauses without repeating a ton of code or nesting like crazy
function parseFlagDependencyOnOptionSerializableJsonItem(flagDependency: DependenciesJsonFlag<true>, document: Document): FlagDependency | null {
    const flagInstances = FlagInstanceStoresByDocument.get(document)?.byName.get(flagDependency.flag);
    if (!flagInstances) return null;
    if (flagInstances.size !== 1) return null; // An option flag should only have one instance---the setter. All other instances should refer to the option by reference.

    const setter = flagInstances.values().next().value as FlagInstance<false, true>;
    if (!setter) return null;
    if (typeof setter.name !== 'string') return null;
    if (setter.write === false as boolean) return null;

    const option = setter.optionFlagOptionByDocument.get(document);
    if (option) return new FlagDependency(option, true);
    else return null;
}

export function parseFlagDependencyJsonItem(flagDependency: DependenciesJsonFlag<boolean>, document: Document | null): FlagDependency {
    if (typeof flagDependency.flag !== 'string') {
        return new FlagDependency(flagDependency.flag, flagDependency.value as true);
    }

    if (document && flagDependency.isOptionFlag) {
        const parsed = parseFlagDependencyOnOptionSerializableJsonItem(flagDependency, document);
        if (parsed) return parsed;
        // else, fall back to normal flag parsing
    }

    return new FlagDependency(flagDependency.flag, flagDependency.value as string);
}


export function parseModManagerVersionDependencyJsonItem(versionDependency: DependenciesJsonModManager): ModManagerVersionDependency {
    return new ModManagerVersionDependency(versionDependency.version);
}

export function parseScriptExtenderVersionDependencyJsonItem(versionDependency: DependenciesJsonScriptExtender): ScriptExtenderVersionDependency {
    return new ScriptExtenderVersionDependency(versionDependency.version);
}

export function parseGameVersionDependencyJsonItem(versionDependency: DependenciesJsonGameVersion): GameVersionDependency {
    return new GameVersionDependency(versionDependency.version);
}
