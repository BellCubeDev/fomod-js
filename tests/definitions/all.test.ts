import * as index from '../../src/index';
import { parseTag } from '../testUtils';

const isPrototypeOf = Function.call.bind(Object.prototype.isPrototypeOf);

describe('All XmlRepresentation classes with `parse()` should add that element to its element map', () => {

    const exports = Object.entries(index);

    for (const [name, value_] of exports) {
        const value = value_ as typeof index[keyof typeof index];

        console.debug(`Testing ${name}`);

        if (   !(typeof value === 'object' || typeof value === 'function')   ){
            console.debug(`Skipping ${name} because it is not an object`);
            continue;
        }

        if (   !(isPrototypeOf(index.XmlRepresentation, value))   ) {
            console.debug(`Skipping ${name} because it is not an XmlRepresentation`);
            continue;
        }

        if (   !('parse' in value && typeof value.parse === 'function')   ) {
            console.debug(`Skipping ${name} because it has no parse() function`);
            continue;
        }
        
        if (   !('tagName' in value && (typeof value.tagName === 'string' || Array.isArray(value.tagName)))   ) {
            console.debug(`Skipping ${name} because it has no tag name attribute`);
            continue;
        }

        const tagNameOrNames = value.tagName as string|string[];
        const tagNames = Array.isArray(tagNameOrNames) ? tagNameOrNames : [tagNameOrNames];
        if (!tagNames[0]) {
            console.warn(`Skipping ${name} because it has tag names in its tag name value!`);
            continue;
        }

        console.log(`Testing ${name} with ${tagNameOrNames}`);

        test(`${name} (${tagNames.join('|')})`, () => {
            const element = parseTag`<${tagNames[0]!} />`;
            const result = (value['parse' as keyof typeof value] as (el: Element) => index.XmlRepresentation | null)(element);

            expect(result).not.toBeNull();
            if (result === null) return;

            expect(result).toBeInstanceOf(index.XmlRepresentation);
            if (!(result instanceof index.XmlRepresentation)) return;

            expect(result.documentMap.get(element.ownerDocument)).toBe(element);
            if (result.documentMap.get(element.ownerDocument) !== element) return;

            const asElement = result.asElement(element.ownerDocument);

            expect(asElement).toBe(element);
            if (asElement !== element) return;
        });
    }
});
