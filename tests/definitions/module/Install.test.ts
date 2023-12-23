import {parseTag, testValidity} from '../../testUtils';

import { Install } from '../../../src';

describe('Typical File Install', () => {
    const obj = Install.parse(parseTag`<file source="apple.txt" destination="banana.txt" />`);

    test('Source Is Correct', () => expect(obj.fileSource).toBe('apple.txt'));
    test('Destination Is Correct', () => expect(obj.fileDestination).toBe('banana.txt'));
    test('Priority Is Correct', () => expect(obj.priority).toBe('0'));
    test('Always Install Is Correct', () => expect(obj.alwaysInstall).toBe('false'));
    test('Install If Usable Is Correct', () => expect(obj.installIfUsable).toBe('false'));
    test('Is Valid', () => testValidity(obj));
});

describe('Typical Folder Install', () => {
    const obj = Install.parse(parseTag`<folder source="apple" destination="banana" />`);

    test('Source Is Correct', () => expect(obj.fileSource).toBe('apple/'));
    test('Destination Is Correct', () => expect(obj.fileDestination).toBe('banana/'));
    test('Priority Is Correct', () => expect(obj.priority).toBe('0'));
    test('Always Install Is Correct', () => expect(obj.alwaysInstall).toBe('false'));
    test('Install If Usable Is Correct', () => expect(obj.installIfUsable).toBe('false'));
    test('Is Valid', () => testValidity(obj));
});

describe('File Install Without Explicit Destination', () => {
    const obj = Install.parse(parseTag`<file source="apple.txt" />`);

    test('Source Is Correct', () => expect(obj.fileSource).toBe('apple.txt'));
    test('Destination Is Correct', () => expect(obj.fileDestination).toBeNull());
});

describe('Folder With Always Install', () => {
    const obj = Install.parse(parseTag`<folder source="apple" destination="banana" alwaysInstall="true" />`);

    test('Source Is Correct', () => expect(obj.fileSource).toBe('apple/'));
    test('Destination Is Correct', () => expect(obj.fileDestination).toBe('banana/'));
    test('Always Install Is True', () => expect(obj.alwaysInstall).toBe('true'));
    test('Is Valid', () => testValidity(obj));
});

describe('Folder With Install If Usable', () => {
    const obj = Install.parse(parseTag`<folder source="apple" destination="banana" installIfUsable="true" />`);

    test('Source Is Correct', () => expect(obj.fileSource).toBe('apple/'));
    test('Destination Is Correct', () => expect(obj.fileDestination).toBe('banana/'));
    test('Install If Usable Is True', () => expect(obj.installIfUsable).toBe('true'));
    test('Is Valid', () => testValidity(obj));
});

describe('Folder With Priority', () => {
    const obj = Install.parse(parseTag`<folder source="apple" destination="banana" priority="100" />`);

    test('Source Is Correct', () => expect(obj.fileSource).toBe('apple/'));
    test('Destination Is Correct', () => expect(obj.fileDestination).toBe('banana/'));
    test('Priority Is Correct', () => expect(obj.priority).toBe('100'));
    test('Is Valid', () => testValidity(obj));
});
