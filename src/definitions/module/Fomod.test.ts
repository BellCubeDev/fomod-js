import { Fomod, Option } from "../..";
import { FomodDocumentConfig } from "../lib/FomodDocumentConfig";
import { parseTag } from "../../tests/testUtils";
import { describe, it, expect } from 'vitest';

function getTestElement() {return parseTag`
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://qconsulting.ca/fo3/ModConfig5.0.xsd">
    <moduleName />
    <installSteps>
        <installStep name="" >
            <optionalFileGroups>
                <group name="" type="SelectAtLeastOne">
                    <plugins>
                        <plugin name="SOME NAME" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="only_flag_for_this_option">OPTION_SELECTED__CUSTOM</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                        <plugin name="Duplicate Option" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="some duplicate flag">OPTION_SELECTED__CUSTOM</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                        <plugin name="Duplicate Option" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="some duplicate flag">OPTION_SELECTED__CUSTOM</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                    </plugins>
                </group>
            </optionalFileGroups>
        </installStep>
    </installSteps>


    <conditionalFileInstalls>
        <patterns>

            <!-- Empty -->
            <pattern>
                <dependencies />
                <files />
            </pattern>

            <!-- No Dependencies -->
            <pattern>
                <dependencies />
                <files>
                    <file source="something.md" />
                </files>
            </pattern>

            <!-- Option Dependency -->
            <pattern>
                <dependencies>
                    <flagDependency flag="only_flag_for_this_option" value="OPTION_SELECTED__CUSTOM" />
                </dependencies>
                <files>
                    <file source="something-else.md" />
                </files>
            </pattern>

            <!-- Regular Dependency -->
            <pattern>
                <dependencies>
                    <fileDependency file="Skyrim.esm" state="Active" />
                </dependencies>
                <files>
                    <file source="MySkyrimPlugin.esp" />
                </files>
            </pattern>
        </patterns>
    </conditionalFileInstalls>
</config>`;}

function getFlagOrderTestElement() {return parseTag`
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://qconsulting.ca/fo3/ModConfig5.0.xsd">
    <moduleName />
    <installSteps>
        <installStep name="" >
            <optionalFileGroups>
                <group name="" type="SelectAtLeastOne">
                    <plugins>
                        <plugin name="name here" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="OPTION_name_here--1">OPTION_SELECTED</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                        <!-- We'll insert an option here so we can test if it'll detect the later 2 and 3 flags and skip to using 4 instead -->
                        <plugin name="name here" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="OPTION_name_here--2">OPTION_SELECTED</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                        <plugin name="name here" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="OPTION_name_here--3">OPTION_SELECTED</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                    </plugins>
                </group>
            </optionalFileGroups>
        </installStep>
    </installSteps>
</config>`;}


describe('Dependency Parsing Config Options', () => {
    /** [parse] Whether to attempt to determine if a flag is an option flag to the best of our knowledge
     *
     * If `'loose'` is provided, we'll accept any flag name or value so long as it's only set by one option.
     *
     * @default true
    */
    describe('parseOptionFlags & generateNewOptionFlagNames: false', () => {
        const config: FomodDocumentConfig = {
            parseOptionFlags: true,
            optionSelectedValue: 'OPTION_SELECTED__CUSTOM',

            removeEmptyConditionalInstalls: false,
            generateNewOptionFlagNames: false,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const newEl = obj.asElement(parseTag`<p/>`.ownerDocument, config);


        it('should generate the correct option names', () => {
            const [onlyFlagOption, dupeOption1, dupeOption2] = obj.gatherOptions() as [Option<boolean>, Option<boolean>, Option<boolean>];
            obj.associateWithDocument(existingEl.ownerDocument!);
            obj.associateWithDocument(newEl.ownerDocument!);
            const knownOptions = obj.gatherOptions();

            expect(onlyFlagOption.getOptionFlagSetter(existingEl.ownerDocument!, config, knownOptions)?.name).toBe('only_flag_for_this_option');
            expect(onlyFlagOption.getOptionFlagSetter(newEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_SOME_NAME--1');

            expect(dupeOption1.getOptionFlagSetter(existingEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--1');
            expect(dupeOption1.getOptionFlagSetter(newEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--1');

            expect(dupeOption2.getOptionFlagSetter(existingEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--2');
            expect(dupeOption2.getOptionFlagSetter(newEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--2');
        });

        it('should have set the flag on the option in the fresh document', () => {
            expect(existingEl.querySelector('plugin flag[name="only_flag_for_this_option"]')?.textContent).toBe('OPTION_SELECTED__CUSTOM');
            expect(newEl.querySelector('plugin flag[name="OPTION_SOME_NAME--1"]')?.textContent).toBe('OPTION_SELECTED__CUSTOM');
        });

        const existingEl2 = getFlagOrderTestElement();
        const obj2 = Fomod.parse(existingEl2, config);

        const targetGroup = Array.from(Array.from(obj2.steps)[0]!.groups)[0]!;
        const options = Array.from(targetGroup.options);
        const optionsWithInsertedOption = [...options.slice(0, 1), new Option<boolean>('name here'), ...options.slice(1)];
        targetGroup.options = new Set(optionsWithInsertedOption);

        obj2.asElement(existingEl2.ownerDocument, config);
        const newEl2 = obj2.asElement(parseTag`<p/>`.ownerDocument, config);

        it('should have skipped to the next available flag', () => {
            expect(existingEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--1"]').length).toBe(1);
            expect(newEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--1"]').length).toBe(1);

            expect(existingEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--2"]').length).toBe(1);
            expect(newEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--2"]').length).toBe(1);

            expect(existingEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--3"]').length).toBe(1);
            expect(newEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--3"]').length).toBe(1);

            expect(existingEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--4"]').length).toBe(1);
            expect(newEl2.querySelectorAll('plugin flag[name^="OPTION_name_here--4"]').length).toBe(1);
        });
    });

    describe('generateNewOptionFlagNames: true', () => {
        const config: FomodDocumentConfig = {
            parseOptionFlags: true,
            optionSelectedValue: 'OPTION_SELECTED__CUSTOM',

            removeEmptyConditionalInstalls: false,
            generateNewOptionFlagNames: true,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const knownOptions = obj.gatherOptions();
        const newEl = obj.asElement(parseTag`<p/>`.ownerDocument, config, knownOptions);

        it('should generate the correct option names', () => {
            const [onlyFlagOption, dupeOption1, dupeOption2] = obj.gatherOptions() as [Option<boolean>, Option<boolean>, Option<boolean>];

            expect(onlyFlagOption.getOptionFlagSetter(existingEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_SOME_NAME--1');
            expect(onlyFlagOption.getOptionFlagSetter(newEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_SOME_NAME--1');

            expect(dupeOption1.getOptionFlagSetter(existingEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--1');
            expect(dupeOption1.getOptionFlagSetter(newEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--1');

            expect(dupeOption2.getOptionFlagSetter(existingEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--2');
            expect(dupeOption2.getOptionFlagSetter(newEl.ownerDocument!, config, knownOptions)?.name).toBe('OPTION_Duplicate_Option--2');
        });
    });

    /** [asElement] Whether to move all conditional installs with only a dependency on a single option to the <files> tag of that option
     *
     * Note that this may cause slight performance issues with Vortex on slower machines.
     *
     * @default false
    */
    describe('flattenConditionInstalls', () => {
        const config: FomodDocumentConfig = {
            flattenConditionalInstalls: true,
            parseOptionFlags: true,
            optionSelectedValue: 'OPTION_SELECTED__CUSTOM',

            removeEmptyConditionalInstalls: false,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const cleanEl = obj.asElement(parseTag`<p/>`.ownerDocument!, config);

        it('should have only removed one conditional install', () => {
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
        });

        it('should have moved the files from the removed conditional install to the option', () => {
            expect(cleanEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file').length).toBe(1);
        });

        it('moved the correct install', () => {
            expect(cleanEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file[source="something-else.md"]').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file[source="something-else.md"]').length).toBe(1);
        });
    });

    /** [asElement] Whether to reorganize all conditional installs with no dependencies into the <requiredInstallFiles> tag
     *
     * @default false
    */
    describe('flattenConditionalInstallsNoDependencies', () => {
        const config = {
            flattenConditionalInstallsNoDependencies: true,
            removeEmptyConditionalInstalls: false,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const cleanEl = obj.asElement(parseTag`<p/>`.ownerDocument!, config);

        it('should have removed two conditional installs', () => { // because the empty one also has no deps by way of being empty
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(2);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(2);
        });

        it('should have moved the files to <requiredInstallFiles>', () => {
            expect(cleanEl.querySelectorAll(':scope > requiredInstallFiles > file').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > requiredInstallFiles > file').length).toBe(1);
        });
    });


    /** [asElement] Whether to remove conditional installs with no dependencies and no files (has no effect when `flattenConditionalInstallsNoDependencies` is `true`)
     *
     * @default true
    */
    describe('removeEmptyConditionalInstalls', () => {
        const config: FomodDocumentConfig = {
            removeEmptyConditionalInstalls: true,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const cleanEl = obj.asElement(parseTag`<p/>`.ownerDocument!, config);

        it('should have removed one conditional install', () => {
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
        });

        it('removed the correct install', () => {
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):has(files > *)').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):has(files > *)').length).toBe(1);

            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):not(:has(files > *))').length).toBe(0);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):not(:has(files > *))').length).toBe(0);
        });
    });
});
