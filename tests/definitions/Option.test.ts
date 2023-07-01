import { Option, OptionType, TypeDescriptor, TypeNameDescriptor } from "../../src";

describe('Basic Option', () => {
    const obj = new Option('apple', 'banana', 'someImage.png');

    test('Name Is Correct', () => expect(obj.name).toBe('apple'));
    test('Description Is Correct', () => expect(obj.description).toBe('banana'));
    test('Image Is Correct', () => expect(obj.image).toBe('someImage.png'));
    test('Type is Correct', () => expect(obj.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe(OptionType.Optional));
    test('Is Valid', () => expect(obj.isValid()).toBe(true));
});

describe('Option With Type', () => {
    const obj = new Option('apple', 'banana', 'someImage.png', new TypeDescriptor(new TypeNameDescriptor('defaultType', OptionType.Required, false)));

    test('Name Is Correct', () => expect(obj.name).toBe('apple'));
    test('Description Is Correct', () => expect(obj.description).toBe('banana'));
    test('Image Is Correct', () => expect(obj.image).toBe('someImage.png'));
    test('Type is Correct', () => expect(obj.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe(OptionType.Required));
    test('Is Valid', () => expect(obj.isValid()).toBe(true));
});
