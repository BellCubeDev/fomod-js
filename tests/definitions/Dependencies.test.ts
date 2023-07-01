/**
 * @jest-environment jsdom
 */

import { FileDependency, FlagDependency, GameVersionDependency, ModManagerVersionDependency, ScriptExtenderVersionDependency, VersionDependency } from "../../src";
import parseTag from "../parseTag";

describe('Flag Dependencies', () => {
    const flagName = 'Some Flag 01';
    const flagValue = 'Some Value 01';

    const element = parseTag`<flagDependency flag="${flagName}" value="${flagValue}" />`;

    expect(element.tagName).toBe(FlagDependency.tagName);

    const parsed = FlagDependency.parse(element);
    expect(parsed).toBeInstanceOf(FlagDependency);

    if (!parsed) return;

    test('Flag Name Is Correct', () => expect(parsed.flagKey).toBe(flagName));
    test('Flag Value Is Correct', () => expect(parsed.desiredValue).toBe(flagValue));
});

function versionTest(constructor: typeof VersionDependency, element: HTMLElement, version: string) {
    expect(element.tagName).toBe(constructor.tagName);

    const parsed = constructor.parse(element);
    expect(parsed).toBeInstanceOf(constructor);

    if (!parsed) return;

    expect(parsed.desiredVersion).toBe(version);
}

describe('File Dependencies', () => {
    describe('Invalid File Dependency', () => {
        const element = parseTag`<fileDependency file="appleBanana123" state="Some Odd State" />`;
        const obj = FileDependency.parse(element);

        test('File Dependency Is Invalid', () => expect(obj.isValid()).toBe(false));
        test('File Name Is Correct', () => expect(obj.filePath).toBe('appleBanana123'));
        test('Invalid State Is Preserved', () => expect(obj.desiredState).toBe('Some Odd State'));
    });

    describe('`Active` File Dependency', () => {
        const element = parseTag`<fileDependency file="appleBanana456" state="Active" />`;
        const obj = FileDependency.parse(element);

        test('File Dependency Is Valid', () => expect(obj.isValid()).toBe(true));
        test('File Name Is Correct', () => expect(obj.filePath).toBe('appleBanana456'));
        test('State Is Correct', () => expect(obj.desiredState).toBe('Active'));
    });

    describe('`Inactive` File Dependency', () => {
        const element = parseTag`<fileDependency file="appleBanana789" state="Inactive" />`;
        const obj = FileDependency.parse(element);

        test('File Dependency Is Valid', () => expect(obj.isValid()).toBe(true));
        test('File Name Is Correct', () => expect(obj.filePath).toBe('appleBanana789'));
        test('State Is Correct', () => expect(obj.desiredState).toBe('Inactive'));
    });

    describe('`Missing` File Dependency', () => {
        const element = parseTag`<fileDependency file="appleBanana0-=" state="Missing" />`;
        const obj = FileDependency.parse(element);

        test('File Dependency Is Valid', () => expect(obj.isValid()).toBe(true));
        test('File Name Is Correct', () => expect(obj.filePath).toBe('appleBanana0-='));
        test('State Is Correct', () => expect(obj.desiredState).toBe('Missing'));
    });
});

test('Game Version Dependencies', () => {
    const version = '0.49.0136';
    const element = parseTag`<gameDependency version="${version}" />`;
    versionTest(GameVersionDependency, element, version);
});

test('Script Extender Version Dependencies', () => {
    const version = '0.62.473';
    const tag = parseTag`<foseDependency version="${version}" />`;

    versionTest(ScriptExtenderVersionDependency, tag, version);
});

test('Mod Manager Version Dependencies', () => {
    const version = '0.13.21';
    const tag = parseTag`<fommDependency version="${version}" />`;

    versionTest(ModManagerVersionDependency, tag, version);
});

