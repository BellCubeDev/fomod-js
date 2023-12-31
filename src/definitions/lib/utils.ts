import { TagName } from "../Enums";
import { DependenciesGroup, FlagDependency, Option } from "../module";


export function gatherDependedUponOptions(deps: DependenciesGroup<any, boolean>, current = new Set<Option<boolean>>()) {
    for (const dep of deps.dependencies) {
        if (dep instanceof FlagDependency && dep.flagKey instanceof Option) current.add(dep.flagKey);
        else if (dep instanceof DependenciesGroup) gatherDependedUponOptions(dep, current);
    }
    return current;
}

export function gatherFlagDependencies(deps: DependenciesGroup<any, boolean>, current = new Set<FlagDependency>()) {
    for (const dep of deps.dependencies) {
        if (dep instanceof FlagDependency) current.add(dep);
        else if (dep instanceof DependenciesGroup) gatherFlagDependencies(dep, current);
    }
    return current;
}