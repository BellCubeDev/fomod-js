import { Fomod } from '../../src';

import { parseTag } from '../testUtils';
import { Install } from '../../src/definitions/Install';




const testModule = parseTag`
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://qconsulting.ca/fo3/ModConfig5.0.xsd">
    <moduleName>The BANANA Mod</moduleName>
    <moduleImage path="fomod\\images\\banana.jpg" showImage="true" />

    <moduleDependencies operator="And">
        <fileDependency file="textures\\da08ebony_key.dds" state="Active" />
        <fileDependency file="textures\\da08ebony_key.dds" state="Inactive" />
        <fileDependency file="textures\\da08ebony_key.dds" state="Missing" />

        <flagDependency flag="" value="" />

        <fommDependency version="" />
        <foseDependency version="" />
        <gameDependency version="" />

        <dependencies></dependencies>
    </moduleDependencies>

    <requiredInstallFiles>
        <folder source="some-folder-1" destination="some-other-folder-1" />
        <folder source="some-folder-2" destination="some-other-folder-2" />
        <file source="some-file-1" destination="some-other-file-1" />
    </requiredInstallFiles>

    <installSteps>
        <installStep name="THE FIRST OF MANY STEPS" >
            <optionalFileGroups order="Explicit">


                <group name="Banana Types" type="SelectAny">
                    <plugins order="Explicit">

                        <plugin name="1700s">
                            <description>Bananas from the 1700s were vastly different from what we see on the shelves today!</description>
                            <image path="123" />
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <files>
                                <file source="banana" alwaysInstall="true" />
                                <file source="banana2" destination="dest/banana2" installIfUsable="false" priority="95" />
                            </files>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>

                        <plugin name="Australian">
                            <description>Nobody knows why, but Australia has some WEIRD bananas.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="Recommended" /></typeDescriptor>
                        </plugin>

                        <plugin name="Modern Worldwide">
                            <description>Ah, the modern Cavendish banana! How not-sweet it tastes! Do yourself a favor and get one from the 1700s.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="Optional" /></typeDescriptor>
                        </plugin>

                        <plugin name="Purple Bananas">
                            <description>~~CENSORED~~</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="CouldBeUsable" /></typeDescriptor>
                        </plugin>

                        <plugin name="Brown Bananas">
                            <description>Sorry, but you can't have feces.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="NotUsable" /></typeDescriptor>
                        </plugin>

                    </plugins>
                </group>


                <group name="Banana Textures" type="SelectExactlyOne">
                    <plugins order="Explicit">

                        <plugin name="Base 1024x1024">
                            <description>These textures are used for anything we didn't downscale/upscale.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>

                        <plugin name="2048x2048">
                            <description>2K is a comfortable resolution fot banana textures.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="Recommended" /></typeDescriptor>
                        </plugin>

                        <plugin name="4096x4096">
                            <description>4K might be a bit over the top, but hey.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="Optional" /></typeDescriptor>
                        </plugin>

                        <plugin name="128x128">
                            <description>Looks awful.</description>
                            <image path="" />
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="CouldBeUsable" /></typeDescriptor>
                        </plugin>

                        <plugin name="0x0">
                            <description>Just... don't install the mod.</description>
                            <conditionFlags><flag name="1">1</flag></conditionFlags>
                            <typeDescriptor><type name="NotUsable" /></typeDescriptor>
                        </plugin>

                    </plugins>
                </group>

                <group name="123" type="SelectAtLeastOne">
                    <plugins>
                        <plugin name="123">
                            <description></description>
                            <files></files>
                            <typeDescriptor>

                                <dependencyType>
                                    <defaultType name="Required" />
                                    <patterns>
                                        <pattern>
                                            <dependencies></dependencies>
                                            <type name="Required" />
                                        </pattern>
                                    </patterns>
                                </dependencyType>
                            </typeDescriptor>
                        </plugin>
                    </plugins>
                </group>


            </optionalFileGroups>
        </installStep>
    </installSteps>

    <conditionalFileInstalls>
        <patterns>
            <pattern>
                <dependencies operator="And">
                    <fileDependency file="" state="Missing"  />
                </dependencies>
                <files>
                    <file source="" priority="0"  />
                    <folder source="" />
                </files>
            </pattern>
        </patterns>
    </conditionalFileInstalls>

</config>
`;

const fomod = Fomod.parse(testModule);
const cleanElement = fomod.asElement(parseTag`<p>`.ownerDocument);
const cleanStringified = cleanElement.outerHTML;

describe('Fomod/ModuleConfig', () => {

    test('Fomod Has Correct Name', () => {
        expect(fomod.moduleName).toBe('The BANANA Mod');
    });

    test('Fomod Has Correct Image', () => {
        expect(fomod.moduleImage).toBe('fomod\\images\\banana.jpg');
    });

    test('Fomod Is Valid', () => {
        const reason = fomod.reasonForInvalidity();
        expect(reason).toBe(null);
    });

    test('Fomod Has Install Steps', () => {
        expect(Array.from(cleanElement.children).findIndex(e => e.tagName === 'installSteps')).toBeGreaterThan(-1);
    });

    describe('requiredInstallFiles', () => {
        test('Fomod Has Required Install Files', () => {
            expect(Array.from(cleanElement.children).findIndex(e => e.tagName === 'requiredInstallFiles')).toBeGreaterThan(-1);
        });

        test('We Have Files Set In The Fomod', () => {
            expect(fomod.installs.size).toBe(3);
        });

        test('We Have The Right Sources', () => {
            const installsArr = Array.from(fomod.installs);

            const f0 = installsArr[0];
            expect(f0).toBeInstanceOf(Install);
            if (   !(f0 instanceof Install)   ) return;
            expect(f0.fileSource).toBe('some-folder-1/');

            const f1 = installsArr[1];
            expect(f1).toBeInstanceOf(Install);
            if (   !(f1 instanceof Install)   ) return;
            expect(f1.fileSource).toBe('some-folder-2/');

            const f2 = installsArr[2];
            expect(f2).toBeInstanceOf(Install);
            if (   !(f2 instanceof Install)   ) return;
            expect(f2.fileSource).toBe('some-file-1');
        });
    });
});
