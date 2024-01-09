import { FlagDependency, FlagSetter, Install, InstallPattern, Option } from "../module";
import { DefaultFomodDocumentConfig, FomodDocumentConfig } from "./FomodDocumentConfig";

export function parseOptionFlags(options: Option<boolean>[], document: Document, config: FomodDocumentConfig = {}, dependencies: FlagDependency[] = []) {
    const uniqueFlags = new Map<string, [setter: FlagSetter, option: Option<boolean>, deps: FlagDependency[]]>();
    const flagsFound = new Set<string>();

    const loose = (config.parseOptionFlags ?? DefaultFomodDocumentConfig.parseOptionFlags) === 'loose';
    const strictValue = config.optionSelectedValue ?? DefaultFomodDocumentConfig.optionSelectedValue;

    for (const option of options) {
        for (const flag of option.flagsToSet) {
            const uniqueFlag = uniqueFlags.get(flag.name);
            if (uniqueFlag && uniqueFlag[1] !== option) {
                uniqueFlags.delete(flag.name);
                continue;
            }

            if (!flagsFound.has(flag.name)) {
                if (loose || flag.value === strictValue) uniqueFlags.set(flag.name, [flag, option, []]);
                flagsFound.add(flag.name);
            }
        }
    }

    for (const dep of dependencies) {
        if (dep.flagKey instanceof Option) continue;

        const mapped = uniqueFlags.get(dep.flagKey);
        if (!mapped) continue;
        const [setter, option, deps] = mapped;

        if (setter.value === dep.desiredValue) deps.push(dep);
        else uniqueFlags.delete(dep.flagKey);
    }

    for (const [flagName, [setter, option, deps]] of uniqueFlags) {
        option.flagsToSet.delete(setter);
        option.existingOptionFlagSetterByDocument.set(document, setter);

        for (const dep of deps) {
            dep.flagKey = option;
            dep.desiredValue = true;
        }
    }
}
