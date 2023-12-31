import { FlagDependency, FlagSetter, Install, InstallPattern, Option } from "../module";
import { DefaultFomodAsElementConfig, FomodDocumentConfig } from "./FomodDocumentConfig";

export function parseOptionFlags(options: Option<boolean>[], document: Document, config: FomodDocumentConfig = {}, dependencies: FlagDependency[] = []) {
    const uniqueFlags = new Map<string, [setter: FlagSetter, option: Option<boolean>, deps: FlagDependency[]]>();
    const flagsFound = new Set<string>();

    const loose = (config.parseOptionFlags ?? DefaultFomodAsElementConfig.parseOptionFlags) === 'loose';
    const strictValue = config.optionSelectedValue ?? DefaultFomodAsElementConfig.optionSelectedValue;

    for (const option of options) {
        for (const flag of option.flagsToSet) {
            if (uniqueFlags.has(flag.name)) {
                uniqueFlags.delete(flag.name);
                continue;
            }

            if (!flagsFound.has(flag.name)) {
                if (loose || flag.value === strictValue) uniqueFlags.set(flag.name, [flag, option, []]);
                flagsFound.add(flag.name);
            }
        }
    }

    // Make sure flag values match up
    for (const dep of dependencies) {
        if (dep.flagKey instanceof Option) continue;

        const mapped = uniqueFlags.get(dep.flagKey);
        if (!mapped) continue;
        const [setter, option, deps] = mapped;

        if (setter.value === dep.desiredValue) deps.push(dep);
        else uniqueFlags.delete(dep.flagKey);
    }

    // Change the flags on their respective options
    for (const [flagName, [setter, option]] of uniqueFlags) {
        option.flagsToSet.delete(setter);
        setter.decommission();

        option._existingOptionFlagSetterByDocument.set(document, setter);
        option._lastUsedOptionFlagSetterDocument = document;
    }

    // Change the dependencies to reference their options directly
    for (const [flagName, [setter, option, deps]] of uniqueFlags) {
        for (const dep of deps) {
            dep.flagKey = option;
            dep.desiredValue = true;
        }
    }
}