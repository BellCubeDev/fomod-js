import { Option, OptionType, TagName, TypeDescriptor, TypeNameDescriptor } from "../..";
import { parseTag, testValidity } from "../../tests/testUtils";
import { describe, test, expect } from 'vitest';

describe('Basic Option', () => {
    const obj = new Option('apple', 'banana', 'someImage.png');

    test('Name Is Correct', () => expect(obj.name).toBe('apple'));
    test('Description Is Correct', () => expect(obj.description).toBe('banana'));
    test('Image Is Correct', () => expect(obj.image).toBe('someImage.png'));
    test('Type is Correct', () => expect(obj.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe(OptionType.Optional));
    test('Is Valid', () => testValidity(obj));
});

describe('Option With Type', () => {
    const obj = new Option('apple', 'banana', 'someImage.png', new TypeDescriptor(new TypeNameDescriptor(TagName.DefaultType, OptionType.Required, false)));

    test('Name Is Correct', () => expect(obj.name).toBe('apple'));
    test('Description Is Correct', () => expect(obj.description).toBe('banana'));
    test('Image Is Correct', () => expect(obj.image).toBe('someImage.png'));
    test('Type is Correct', () => expect(obj.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe(OptionType.Required));
    test('Is Valid', () => testValidity(obj));
});

describe('Parsing Option From Element #1', () => {
    const doc = parseTag`<plugin name="lungs">
        <description />
        <image path="12345" />
        <files />
        <typeDescriptor>
            <type name="CouldBeUsable" />
        </typeDescriptor>
    </plugin>`;

    const obj = Option.parse(doc);

    test('We Got An Option', () => expect(obj).toBeInstanceOf(Option));
    if (!obj) return;
    test('Name Is Correct', () => expect(obj.name).toBe('lungs'));
    test('Description Is Correct', () => expect(obj?.description).toBe(''));
    test('Image Is Correct', () => expect(obj.image).toBe('12345'));
    test('Default Type is Correct', () => expect(obj.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe(OptionType.CouldBeUsable));
    test('Has No Installs', () => expect(obj.installsToSet.filesWrapper.installs.size).toBe(0));
    test('Is Valid', () => testValidity(obj));
});
