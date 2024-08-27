import * as enums from './Enums';
import fs from 'node:fs/promises';
import url from 'node:url';
import path from 'node:path';
import { describe, test, expect } from 'vitest';

/** This test suite makes sure the enums we've defined are consistent with the values in the XSDs
 *
 */

const thisDir = process.cwd();

async function indefiniteCache(f: () => Promise<string>, fileName: string) {
    const filePath = path.join(thisDir, 'cache', fileName);
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (e) {
        if (e instanceof Error && 'code' in e && (e.code !== 'ENOENT' && e.code !== 'ENOTDIR'))
            throw e;

        const data = await f();
        await fs.mkdir(path.dirname(filePath), {recursive: true});
        await fs.writeFile(filePath, data);
        return data;
    }
}

const moduleConfigXSDs = Promise.all([
    indefiniteCache(()=>fetch('https://qconsulting.ca/fo3/ModConfig5.0.xsd').then(r => r.text()), 'fo3_ModConfig5.0.xsd').then(t => new DOMParser().parseFromString(t, 'application/xml').documentElement),
    indefiniteCache(()=>fetch('http://qconsulting.ca/gemm/ModConfig5.0.xsd').then(r => r.text()), 'gemm_ModConfig5.0.xsd').then(t => new DOMParser().parseFromString(t, 'application/xml').documentElement),
]);


function getEnumValues<TEnum extends typeof enums[keyof typeof enums]>(theEnum: TEnum): TEnum[keyof TEnum][] {
    const values = [] as TEnum[keyof TEnum][];
    for (const [key, value] of Object.entries(theEnum) as [keyof TEnum, TEnum[keyof TEnum]][]) {
        if (typeof value === 'string')
            values.push(value);
    }

    return values;
}

//moduleConfigXSDs.then(xsds => console.log('XSD elements', xsds.map(xsd => Array.from(xsd.querySelectorAll('element')).map(el => el.outerHTML))));

const valuesByEnum: Record<keyof typeof enums, {
    fromXml: Set<string>,
    fromEnum: Set<string>
}> = {
    AttributeName: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('attribute'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const name = el.getAttribute('name');
                    if (name)
                        returnVal.add(name);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.AttributeName))
    },

    BooleanString: {
        fromXml: new Set(['true', 'false']),
        fromEnum: new Set(getEnumValues(enums.BooleanString))
    },

    DependencyGroupOperator: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('attribute[name="operator"] enumeration'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const value = el.getAttribute('value');
                    if (value)
                        returnVal.add(value);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.DependencyGroupOperator))
    },

    FileDependencyState: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('attribute[name="state"] restriction enumeration'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const value = el.getAttribute('value');
                    if (value)
                        returnVal.add(value);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.FileDependencyState))
    },

    GroupBehaviorType: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('complexType[name="group"] attribute[name="type"] restriction enumeration'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const value = el.getAttribute('value');
                    if (value)
                        returnVal.add(value);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.GroupBehaviorType))
    },

    ModuleNamePosition: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('attribute[name="position"] restriction enumeration'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const value = el.getAttribute('value');
                    if (value)
                        returnVal.add(value);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.ModuleNamePosition))
    },

    OptionType: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('simpleType[name="pluginTypeEnum"] restriction enumeration'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const value = el.getAttribute('value');
                    if (value)
                        returnVal.add(value);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.OptionType))
    },

    SortingOrder: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('simpleType[name="orderEnum"] restriction enumeration'));
            const returnVal = new Set<string>();
            for (const element of elements) {
                for (const el of element) {
                    const value = el.getAttribute('value');
                    if (value)
                        returnVal.add(value);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.SortingOrder))
    },

    TagName: {
        fromXml: await moduleConfigXSDs.then(xsds => {
            const elements = xsds.map(xsd => xsd.querySelectorAll('element'));
            const returnVal = new Set<string>(['fomod']);
            for (const element of elements) {
                for (const el of element) {
                    const name = el.getAttribute('name');
                    if (name)
                        returnVal.add(name);
                }
            }
            return returnVal;
        }),
        fromEnum: new Set(getEnumValues(enums.TagName))
    },
};

//console.log(valuesByEnum);

describe('All Values From XML Are Present', () => {
    for (const [key, value] of Object.entries(valuesByEnum)) {
        describe(key, ()=> {
            for(const val of value.fromXml) {
                test(val, ()=> {
                    expect(value.fromEnum).toContain(val);
                });
            }
        });
    }
});

describe('No Extra Values Are Present', ()=> {
    for (const [key, value] of Object.entries(valuesByEnum)) {
        describe(key, ()=> {
            for(const val of value.fromEnum) {
                test(val, ()=> {
                    expect(value.fromXml).toContain(val);
                });
            }
        });
    }
});
