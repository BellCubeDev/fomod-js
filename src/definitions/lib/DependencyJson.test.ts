import { DependenciesJsonItem, DependencyType, jsonifyDependencyElements, parseDependencyJsonItems, type DependenciesJsonFlag } from './DependencyJson';
import { assert, beforeEach, describe, expect, test } from 'vitest';
import { parseTag } from '../../tests/testUtils';
import { DependenciesGroup, FlagDependency, GameVersionDependency, ModManagerVersionDependency, Option, ScriptExtenderVersionDependency } from '../module';
import { parseOptionFlags } from './ParseOptionFlags';
import type { FomodDocumentConfig } from './FomodDocumentConfig';
import { DependencyGroupOperator, FileDependencyState, TagName } from '../Enums';
import { FlagInstanceStoresByDocument } from './FlagInstance';

let document: Document;
beforeEach(() => {
    document = parseTag`<p />`.ownerDocument;
});

function createPermutationForFlagDep(deps: DependenciesJsonItem<boolean>[], index: number): DependenciesJsonItem<boolean>[] | null {
    const dep = deps[index];
    if (dep.type !== DependencyType.Flag || typeof dep.flag !== 'string' || !dep.isOptionFlag) return null;
    const newDeps = [...deps];
    newDeps[index] = { ...dep, isOptionFlag: false };
    return newDeps;
}

/** For making sure we parsed stuff correctly, since we can fall back to a string for the flag key if the option doesn't exist,
 * we have to try every permutation of the dependency json with different variations of option flag dependencies set to, well, *not* option flags.
 * That said, non-serializable option flag dependencies shouldn't be able to fall back, hence we don't need to test those permutations.
 *
 * @param deps
 */
function getPermutationsOfDependencyJsonWithOptionFlagMaybeSetToFalse(deps: DependenciesJsonItem<boolean> | DependenciesJsonItem<boolean>[]): DependenciesJsonItem<boolean>[][] {
    const depsArr = Array.isArray(deps) ? deps : [deps];

    const hasOptionFlagDeps = depsArr.some(dep => dep.type === DependencyType.Flag && dep.isOptionFlag);
    if (!hasOptionFlagDeps) return [depsArr];

    const permutations: DependenciesJsonItem<boolean>[][] = [depsArr];

    for (let i = 0; i < depsArr.length; i++) {
        const newPermutations = permutations.map(permutation => createPermutationForFlagDep(permutation, i)).filter((x) => x !== null);
        permutations.push(...newPermutations);
    }

    return permutations;
}

function expect_or(tests: (() => void)[]) {
    if (!tests || !Array.isArray(tests)) return;
    try {
        tests.shift()?.();
        return;
    } catch (e) {
        //console.log('Caught assertion failure; tests left:', tests.length);
        if (tests.length) expect_or(tests);
        else throw e;
    }
  }

function basicTest<TSerializable extends boolean>(deps: DependenciesJsonItem<TSerializable> | DependenciesJsonItem<boolean>[]) {
    const depsArr = Array.isArray(deps) ? deps : [deps];

    const parsedWithDocument = parseDependencyJsonItems(depsArr, document);
    expect(parsedWithDocument).toMatchSnapshot();

    const parsedWithoutDocument = parseDependencyJsonItems(depsArr, null);
    expect(parsedWithoutDocument).toMatchSnapshot();

    const jsonifiedSerializableFromWithout = jsonifyDependencyElements(parsedWithDocument, true, document);
    expect(jsonifiedSerializableFromWithout).toMatchSnapshot();

    const jsonifiedSerializableFromWith = jsonifyDependencyElements(parsedWithDocument, true, document);
    expect(jsonifiedSerializableFromWith).toMatchSnapshot();

    const jsonifiedNonSerializableFromWithout = jsonifyDependencyElements(parsedWithDocument, false);
    expect(jsonifiedNonSerializableFromWithout).toMatchSnapshot();

    const jsonifiedNonSerializableFromWith = jsonifyDependencyElements(parsedWithDocument, false);
    expect(jsonifiedNonSerializableFromWith).toMatchSnapshot();

    const arr = [jsonifiedSerializableFromWithout, jsonifiedSerializableFromWith, jsonifiedNonSerializableFromWithout, jsonifiedNonSerializableFromWith ];
    //expect([jsonifiedSerializableFromWithout, jsonifiedSerializableFromWith, jsonifiedNonSerializableFromWithout, jsonifiedNonSerializableFromWith ]).toContainEqual(getPermutationsOfDependencyJsonWithOptionFlagSetToFalse(depsArr));
    expect_or(
        getPermutationsOfDependencyJsonWithOptionFlagMaybeSetToFalse(depsArr).reverse().map(permutation => (
            () => {
                //console.log('Checking permutation', permutation);
                if (permutation.length === 0) return;

                expect(arr).toContainEqual(permutation);
            }
        ))
    );

    return {
        parsedWithDocument,
        parsedWithoutDocument,
        jsonifiedSerializableFromWithout,
        jsonifiedSerializableFromWith,
        jsonifiedNonSerializableFromWithout,
        jsonifiedNonSerializableFromWith,
    };
}



test('File Dependency', () => {
    const parsedStuff = basicTest({
        type: DependencyType.File,
        path: 'file.txt',
        state: FileDependencyState.Active,
    });
});

test('Flag Dependency (Not Option)', () => {
    const parsedStuff = basicTest({
        type: DependencyType.Flag,
        flag: 'some-flag-name',
        value: 'some-value',
        isOptionFlag: false,
    });
});

test('Flag Dependency (Option, No Existing Option)', () => {
    const parsedStuff = basicTest({
        type: DependencyType.Flag,
        flag: 'some-flag-name',
        value: 'some-value',
        isOptionFlag: true,
    });

    const dep = parsedStuff.parsedWithDocument[0];
    expect(dep).toBeInstanceOf(FlagDependency);
    if (!(dep instanceof FlagDependency)) return;
    assert.typeOf(dep.flagKey, 'string', 'Flag key should fall back to being a string since there is no option to set as the flag key');
});

test('Flag Dependency (Option, Yes Existing Option)', () => {
    const optionElement = parseTag`<plugin name="Test Option">
        <description />
        <conditionFlags>
            <flag name="some-flag-name">OPTION_SELECTED</flag>
        </conditionFlags>
        <files />
        <typeDescriptor>
            <type name="Optional" />
        </typeDescriptor>
    </plugin>`;

    document = optionElement.ownerDocument;

    const parseOptions: FomodDocumentConfig = {
        parseOptionFlags: 'loose',
    };

    const option = Option.parse(optionElement, parseOptions);
    expect(option).not.toBeNull();
    if (!option) return;

    const flagsForDocument1 = FlagInstanceStoresByDocument.get(document);
    expect(flagsForDocument1).not.toBeUndefined();
    if (flagsForDocument1 === undefined) return;
    expect(flagsForDocument1.all.size).toBe(1);
    const flagInstances1 = flagsForDocument1.byName.get('some-flag-name');
    expect(flagInstances1).not.toBeUndefined();
    expect(flagInstances1?.size).toBe(1);

    parseOptionFlags([option], document, parseOptions);

    const flagsForDocument2 = FlagInstanceStoresByDocument.get(document);
    expect(flagsForDocument2).not.toBeUndefined();
    if (flagsForDocument2 === undefined) return;
    expect(flagsForDocument2.all.size).toBe(1);
    const flagInstances2 = flagsForDocument1.byName.get('some-flag-name');
    expect(flagInstances2).not.toBeUndefined();
    expect(flagInstances2?.size).toBe(1);

    const parsedStuff = basicTest({
        type: DependencyType.Flag,
        flag: 'some-flag-name',
        value: 'OPTION_SELECTED',
        isOptionFlag: true,
    });

    const dep = parsedStuff.parsedWithDocument[0];
    assert.strictEqual(document, optionElement.ownerDocument, 'Document should still be the same as the option element\'s document; if not, something went really, really wrong!');
    expect(dep).toBeInstanceOf(FlagDependency);
    if (!(dep instanceof FlagDependency)) return;
    assert.instanceOf(dep.flagKey, Option, 'Flag key should be an Option instance because the option does exist and could be found by the flag key');
});

test('Game Version Dependency', () => {
    const parsedStuff = basicTest({
        type: DependencyType.GameVersion,
        version: '1.2.3',
    });

    const dep = parsedStuff.parsedWithDocument[0];
    expect(dep).toBeInstanceOf(GameVersionDependency);
});

test('Group of Dependencies (No Children)', () => {
    const parsedStuff = basicTest({
        type: DependencyType.Group,
        operator: DependencyGroupOperator.And,
        tagName: TagName.Dependencies,
        dependencies: []
    });

    const group = parsedStuff.parsedWithDocument[0];
    expect(group).toBeInstanceOf(DependenciesGroup);
    if (!(group instanceof DependenciesGroup)) return;
    assert.isEmpty(group.dependencies, 'This group should have no dependencies');
});

test('Group of Dependencies (With Children)', () => {
    const parsedStuff = basicTest({
        type: DependencyType.Group,
        operator: DependencyGroupOperator.And,
        tagName: TagName.Dependencies,
        dependencies: [{
            type: DependencyType.GameVersion,
            version: '1.2.3',
        }]
    });

    const group = parsedStuff.parsedWithDocument[0];
    expect(group).toBeInstanceOf(DependenciesGroup);
    if (!(group instanceof DependenciesGroup)) return;
    assert.isNotEmpty(group.dependencies, 'This group should have dependencies');
    assert.equal(group.dependencies.size, 1, 'This group should have exactly one dependency');
});

test('Mod Manager Version Dependency', () => {
    const parsedStuff = basicTest({
        type: DependencyType.ModManagerVersion,
        version: '1.2.3',
    });

    const dep = parsedStuff.parsedWithDocument[0];
    expect(dep).toBeInstanceOf(ModManagerVersionDependency);
});

test('Script Extender Version Dependency', () => {
    const parsedStuff = basicTest({
        type: DependencyType.ScriptExtenderVersion,
        version: '1.2.3',
    });

    const dep = parsedStuff.parsedWithDocument[0];
    expect(dep).toBeInstanceOf(ScriptExtenderVersionDependency);
});
