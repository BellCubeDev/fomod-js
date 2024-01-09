import { TagName } from "../Enums";
import type { Dependency } from "../module";
import { DependenciesGroup } from "../module/dependencies/DependenciesGroup";
import { FlagDependency, } from "../module/dependencies/FlagDependency";
import { Option } from "../module/Option";

export function countDependencyConditions(deps: Set<Dependency>, encounteredDeps = new Set<Dependency>()) {
    let count = 0;
    for (const dep of deps) {
        if (encounteredDeps.has(dep)) continue;
        encounteredDeps.add(dep);

        if (dep instanceof DependenciesGroup) count += countDependencyConditions(dep.dependencies);
        else count++;
    }
    return count;
}

export function gatherDependedUponOptions(deps: DependenciesGroup<any, boolean>, current = new Set<Option<boolean>>(), encounteredDeps = new Set<Dependency>()) {
    for (const dep of deps.dependencies) {
        if (encounteredDeps.has(dep)) continue;
        encounteredDeps.add(dep);

        if (dep instanceof FlagDependency && dep.flagKey instanceof Option) current.add(dep.flagKey);
        else if (dep instanceof DependenciesGroup) gatherDependedUponOptions(dep, current);
    }
    return current;
}

export function gatherFlagDependencies(deps: DependenciesGroup<any, boolean>, current = new Set<FlagDependency>(), encounteredDeps = new Set<Dependency>()) {
    for (const dep of deps.dependencies) {
        if (encounteredDeps.has(dep)) continue;
        encounteredDeps.add(dep);

        if (dep instanceof FlagDependency) current.add(dep);
        else if (dep instanceof DependenciesGroup) gatherFlagDependencies(dep, current);
    }
    return current;
}
