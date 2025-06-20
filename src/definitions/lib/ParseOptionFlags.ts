import { FlagDependency, FlagSetter, Install, InstallPattern, Option } from "../module";
import { DefaultFomodDocumentConfig, FomodDocumentConfig } from "./FomodDocumentConfig";

/** Parse all of the option flags in the given options array, setting the flags on the options and resolving any dependencies.
 *
 * This should be called immediately after parsing all of the options in a Fomod document, and should not
 * be called more than once per document.
 */
export function parseOptionFlags(options: Option<boolean>[], document: Document, config: FomodDocumentConfig = {}, dependencies: FlagDependency[] = []) {
    const uniqueFlagSetters = new Map<string, [setter: FlagSetter, option: Option<boolean>, deps: FlagDependency[]]>();
    const setFlagsFound = new Set<string>();

    const loose = (config.parseOptionFlags ?? DefaultFomodDocumentConfig.parseOptionFlags) === 'loose';
    const strictValue = config.optionSelectedValue ?? DefaultFomodDocumentConfig.optionSelectedValue;

    for (const option of options) {
        for (const flag of option.flagsToSet) {
            const uniqueFlag = uniqueFlagSetters.get(flag.name);
            if (uniqueFlag && uniqueFlag[1] !== option) {
                uniqueFlagSetters.delete(flag.name);
                continue;
            }

            if (!setFlagsFound.has(flag.name)) {
                if (loose || flag.value === strictValue) uniqueFlagSetters.set(flag.name, [flag, option, []]);
                setFlagsFound.add(flag.name);
            }
        }
    }

    for (const dep of dependencies) {
        if (dep.flagKey instanceof Option) continue;

        const mapped = uniqueFlagSetters.get(dep.flagKey);
        if (!mapped) continue;
        const [setter, option, deps] = mapped;

        if (setter.value === dep.desiredValue) deps.push(dep);
        else uniqueFlagSetters.delete(dep.flagKey);
    }

    for (const [flagName, [setter, option, deps]] of uniqueFlagSetters) {
        option.flagsToSet.delete(setter);
        option.existingOptionFlagSetterByDocument.set(document, setter);
        setter.flagInstance.optionFlagOptionByDocument.set(document, option);

        for (const dep of deps) {
            dep.flagKey = option;
            dep.desiredValue = true;
        }
    }
}
