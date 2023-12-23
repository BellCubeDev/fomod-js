import { FlagInstance, FlagInstancesByDocument } from "../../../src";

describe('Basic Flag Instance', () => {
    const obj = new FlagInstance('apple', 'banana', true);

    const newDoc = new Document();
    obj.attachDocument(newDoc);

    test('Value Is Correct', () => expect(obj.usedValue).toBe('banana'));
    test('Write Is Correct', () => expect(obj.write).toBe(true));

    // Storing these values as variables because the tests enter race conditions which usually causes the first set to fail
    const nameBeforeNameChange = obj.name;
    const isInDocumentMapBeforeNameChange = FlagInstancesByDocument.get(newDoc)?.all.has(obj);
    const isInNameMapBeforeNameChange = FlagInstancesByDocument.get(newDoc)?.byName.get('apple')?.has(obj);

    describe('Before Name Change', () => {
        test('Name Is Correct', () => expect(nameBeforeNameChange).toBe('apple'));
        test('Is In Document Map Before Name Change', () => expect(isInDocumentMapBeforeNameChange).toBe(true));
        test('Is In Name Map Before Name Change', () => expect(isInNameMapBeforeNameChange).toBe(true));
    });

    describe('After Name Change', () => {
        obj.name = 'orange';
        test('Name Is Correct', () => expect(obj.name).toBe('orange'));
        test('Is In New Document Map', () => expect(FlagInstancesByDocument.get(newDoc)?.all.has(obj)).toBe(true));
        test('Is Not In Old Name Map', () => expect(FlagInstancesByDocument.get(newDoc)?.byName.get('apple')?.has(obj)).toBe(false));
        test('Is In New Name Map', () => expect(FlagInstancesByDocument.get(newDoc)?.byName.get('orange')?.has(obj)).toBe(true));
    });
});
