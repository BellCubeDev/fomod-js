import { FileDependency, FlagDependency, Fomod, GameVersionDependency, Install, InstallPattern, ModManagerVersionDependency, ScriptExtenderVersionDependency } from '../../../src';

import { parseTag, testValidity } from '../../testUtils';




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

test('Has Correct Name', () => {
    expect(fomod.moduleName).toBe('The BANANA Mod');
});

test('Has Correct Image', () => {
    expect(fomod.moduleImage).toBe('fomod\\images\\banana.jpg');
});

test('Is Valid', () => { testValidity(fomod); });

describe('Installer Dependencies', () => {
    test('Has Dependencies', () => {
        expect(fomod.moduleDependencies).not.toBeNull();
    });

    test('Has Correct Operator', () => {
        expect(fomod.moduleDependencies.operator).toBe('And');
    });

    test('Has Right Number Of Children', () => {
        expect(fomod.moduleDependencies.dependencies.size).toBe(8);
    });

    describe('Dependencies Children', () => {
        test('Has Correct File Dependencies', () => {
            const fileDeps = Array.from(fomod.moduleDependencies.dependencies).filter(d => d instanceof FileDependency) as FileDependency<false>[];
            expect(fileDeps.length).toBe(3);
            expect(fileDeps[0]!.filePath).toBe('textures\\da08ebony_key.dds');
            expect(fileDeps[0]!.desiredState).toBe('Active');
            expect(fileDeps[1]!.filePath).toBe('textures\\da08ebony_key.dds');
            expect(fileDeps[1]!.desiredState).toBe('Inactive');
            expect(fileDeps[2]!.filePath).toBe('textures\\da08ebony_key.dds');
            expect(fileDeps[2]!.desiredState).toBe('Missing');
        });

        test('Has Correct Flag Dependencies', () => {
            const flagDeps = Array.from(fomod.moduleDependencies.dependencies).filter(d => d instanceof FlagDependency) as FlagDependency[];
            expect(flagDeps.length).toBe(1);
            expect(flagDeps[0]!.flagKey).toBe('');
            expect(flagDeps[0]!.desiredValue).toBe('');
        });

        test('Has Correct Fomm Dependencies', () => {
            const fommDeps = Array.from(fomod.moduleDependencies.dependencies).filter(d => d instanceof ModManagerVersionDependency) as ModManagerVersionDependency[];
            expect(fommDeps.length).toBe(1);
            expect(fommDeps[0]!.desiredVersion).toBe('');
        });

        test('Has Correct Fose Dependencies', () => {
            const foseDeps = Array.from(fomod.moduleDependencies.dependencies).filter(d => d instanceof ScriptExtenderVersionDependency) as ScriptExtenderVersionDependency[];
            expect(foseDeps.length).toBe(1);
            expect(foseDeps[0]!.desiredVersion).toBe('');
        });

        test('Has Correct Game Dependencies', () => {
            const gameDeps = Array.from(fomod.moduleDependencies.dependencies).filter(d => d instanceof GameVersionDependency) as GameVersionDependency[];
            expect(gameDeps.length).toBe(1);
            expect(gameDeps[0]!.desiredVersion).toBe('');
        });
    });
});

describe('Required Install Files', () => {
    test('Fomod Has Required Install Files', () => {
        const childArr = Array.from(cleanElement.children);
        expect(childArr.findIndex(e => e.tagName === 'requiredInstallFiles')).toBeGreaterThan(-1);
    });

    const installs = Array.from(fomod.installs).filter(i => !(i instanceof InstallPattern)) as Install<false>[];

    test('We Have Files Set In The Fomod', () => {
        expect(installs.length).toBe(3);
    });

    test('We Have The Right Sources', () => {
        const f0 = installs[0];
        expect(f0).toBeInstanceOf(Install);
        if (   !(f0 instanceof Install)   ) return;
        expect(f0.fileSource).toBe('some-folder-1/');

        const f1 = installs[1];
        expect(f1).toBeInstanceOf(Install);
        if (   !(f1 instanceof Install)   ) return;
        expect(f1.fileSource).toBe('some-folder-2/');

        const f2 = installs[2];
        expect(f2).toBeInstanceOf(Install);
        if (   !(f2 instanceof Install)   ) return;
        expect(f2.fileSource).toBe('some-file-1');
    });
});

describe('Steps', () => {
    test('Fomod Has Install Steps', () => {
        expect(Array.from(cleanElement.children).findIndex(e => e.tagName === 'installSteps')).toBeGreaterThan(-1);
    });

    test('Has Correct Number Of Install Steps', () => {
        expect(fomod.steps.size).toBe(1);
    });

    test ('Has Correct (Default) Sorting Order', () => {
        expect(fomod.sortingOrder).toBe('Ascending');
    });

    const [step1] = Array.from(fomod.steps);
    if (!step1) return;

    test('Has Correct Name', () => {
        expect(step1.name).toBe('THE FIRST OF MANY STEPS');
    });

    test('Has Correct Group Sorting Order', () => {
        expect(step1.sortingOrder).toBe('Explicit');
    });

    test('Has Correct Number Of Groups', () => {
        expect(step1.groups.size).toBe(3);
    });

    const [group1, group2, group3] = Array.from(step1.groups);
    if (!group1 || !group2 || !group3) return;

    describe('Group 1', () => {
        test('Has Correct Name', () => {
            expect(group1.name).toBe('Banana Types');
        });

        test('Has Correct Type', () => {
            expect(group1.behaviorType).toBe('SelectAny');
        });

        test('Has Correct Number Of Options', () => {
            expect(group1.options.size).toBe(5);
        });

        const [opt1, opt2, opt3, opt4, opt5] = Array.from(group1.options);
        if (!opt1 || !opt2 || !opt3 || !opt4 || !opt5) return;

        describe('Option 1', () => {
            test('Has Correct Name', () => {
                expect(opt1.name).toBe('1700s');
            });

            test('Has Correct Description', () => {
                expect(opt1.description).toBe('Bananas from the 1700s were vastly different from what we see on the shelves today!');
            });

            test('Has Correct Image', () => {
                expect(opt1.image).toBe('123');
            });

            test('Has Correct Type', () => {
                expect(opt1.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Required');
            });

            test('Has Correct Number Of Files', () => {
                expect(opt1.installsToSet.filesWrapper.installs.size).toBe(2);
            });

            const [file1, file2] = Array.from(opt1.installsToSet.filesWrapper.installs);
            if (!file1 || !file2) return;

            describe('File 1', () => {
                test('Has Correct Source', () => {
                    expect(file1.fileSource).toBe('banana');
                });

                test('Has Correct Destination', () => {
                    expect(file1.fileDestination).toBeNull();
                });

                test('Has Correct Always Install', () => {
                    expect(file1.alwaysInstall).toBe('true');
                });

                test('Has Correct Install If Usable', () => {
                    expect(file1.installIfUsable).toBe('false');
                });

                test('Has Correct Priority', () => {
                    expect(file1.priority).toBe('0');
                });
            });

            describe('File 2', () => {
                test('Has Correct Source', () => {
                    expect(file2.fileSource).toBe('banana2');
                });

                test('Has Correct Destination', () => {
                    expect(file2.fileDestination).toBe('dest/banana2');
                });

                test('Has Correct Always Install', () => {
                    expect(file2.alwaysInstall).toBe('false');
                });

                test('Has Correct Install If Usable', () => {
                    expect(file2.installIfUsable).toBe('false');
                });

                test('Has Correct Priority', () => {
                    expect(file2.priority).toBe('95');
                });
            });
        });

        describe('Option 2', () => {
            test('Has Correct Name', () => {
                expect(opt2.name).toBe('Australian');
            });

            test('Has Correct Description', () => {
                expect(opt2.description).toBe('Nobody knows why, but Australia has some WEIRD bananas.');
            });

            test('Has Correct Type', () => {
                expect(opt2.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Recommended');
            });
        });

        describe('Option 3', () => {
            test('Has Correct Name', () => {
                expect(opt3.name).toBe('Modern Worldwide');
            });

            test('Has Correct Description', () => {
                expect(opt3.description).toBe('Ah, the modern Cavendish banana! How not-sweet it tastes! Do yourself a favor and get one from the 1700s.');
            });

            test('Has Correct Type', () => {
                expect(opt3.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Optional');
            });
        });

        describe('Option 4', () => {
            test('Has Correct Name', () => {
                expect(opt4.name).toBe('Purple Bananas');
            });

            test('Has Correct Description', () => {
                expect(opt4.description).toBe('~~CENSORED~~');
            });

            test('Has Correct Type', () => {
                expect(opt4.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('CouldBeUsable');
            });
        });

        describe('Option 5', () => {
            test('Has Correct Name', () => {
                expect(opt5.name).toBe('Brown Bananas');
            });

            test('Has Correct Description', () => {
                expect(opt5.description).toBe('Sorry, but you can\'t have feces.');
            });

            test('Has Correct Type', () => {
                expect(opt5.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('NotUsable');
            });
        });

    });

    describe('Group 2', () => {
        test('Has Correct Name', () => {
            expect(group2.name).toBe('Banana Textures');
        });

        test('Has Correct Type', () => {
            expect(group2.behaviorType).toBe('SelectExactlyOne');
        });

        test('Has Correct Number Of Options', () => {
            expect(group2.options.size).toBe(5);
        });

        const [opt1, opt2, opt3, opt4, opt5] = Array.from(group2.options);
        if (!opt1 || !opt2 || !opt3 || !opt4 || !opt5) return;

        describe('Option 1', () => {
            test('Has Correct Name', () => {
                expect(opt1.name).toBe('Base 1024x1024');
            });

            test('Has Correct Description', () => {
                expect(opt1.description).toBe('These textures are used for anything we didn\'t downscale/upscale.');
            });

            test('Has Correct Type', () => {
                expect(opt1.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Required');
            });
        });

        describe('Option 2', () => {
            test('Has Correct Name', () => {
                expect(opt2.name).toBe('2048x2048');
            });

            test('Has Correct Description', () => {
                expect(opt2.description).toBe('2K is a comfortable resolution fot banana textures.');
            });

            test('Has Correct Type', () => {
                expect(opt2.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Recommended');
            });
        });

        describe('Option 3', () => {
            test('Has Correct Name', () => {
                expect(opt3.name).toBe('4096x4096');
            });

            test('Has Correct Description', () => {
                expect(opt3.description).toBe('4K might be a bit over the top, but hey.');
            });

            test('Has Correct Type', () => {
                expect(opt3.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Optional');
            });
        });

        describe('Option 4', () => {
            test('Has Correct Name', () => {
                expect(opt4.name).toBe('128x128');
            });

            test('Has Correct Description', () => {
                expect(opt4.description).toBe('Looks awful.');
            });

            test('Has Correct Type', () => {
                expect(opt4.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('CouldBeUsable');
            });
        });

        describe('Option 5', () => {
            test('Has Correct Name', () => {
                expect(opt5.name).toBe('0x0');
            });

            test('Has Correct Description', () => {
                expect(opt5.description).toBe('Just... don\'t install the mod.');
            });

            test('Has Correct Type', () => {
                expect(opt5.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('NotUsable');
            });
        });
    });

    describe('Group 3', () => {
        test('Has Correct Name', () => {
            expect(group3.name).toBe('123');
        });

        test('Has Correct Type', () => {
            expect(group3.behaviorType).toBe('SelectAtLeastOne');
        });

        test('Has Correct Number Of Options', () => {
            expect(group3.options.size).toBe(1);
        });

        const [opt1] = Array.from(group3.options);
        if (!opt1) return;

        describe('Option 1', () => {
            test('Has Correct Name', () => {
                expect(opt1.name).toBe('123');
            });

            test('Has Correct Description', () => {
                expect(opt1.description).toBe('');
            });

            test('Has Correct Type', () => {
                expect(opt1.typeDescriptor.defaultTypeNameDescriptor.targetType).toBe('Required');
            });
        });
    });

});

describe('Conditional File Installs', () => {
    test('Fomod Has Conditional File Installs', () => {
        expect(Array.from(cleanElement.children).findIndex(e => e.tagName === 'conditionalFileInstalls')).toBeGreaterThan(-1);
    });

    const conditionalInstalls = Array.from(fomod.installs).filter(i=> i instanceof InstallPattern) as InstallPattern<false>[];

    test('Has Correct Number Of Patterns', () => {
        expect(conditionalInstalls.length).toBe(1);
    });

    const [pattern1] = conditionalInstalls;
    if (!pattern1) return;

    test('Has Correct Number Of Dependencies', () => {
        expect(pattern1.dependencies?.dependencies.size).toBe(1);
    });

    test('Has Correct Operator', () => {
        expect(pattern1.dependencies?.operator).toBe('And');
    });

    test('Has Correct Number Of Files', () => {
        expect(pattern1.filesWrapper.installs.size).toBe(2);
    });

    const [file1, file2] = Array.from(pattern1.filesWrapper.installs);
    if (!file1 || !file2) return;

    describe('File 1', () => {
        test('Has Correct Source', () => {
            expect(file1.fileSource).toBe('');
        });

        test('Has Correct Destination', () => {
            expect(file1.fileDestination).toBeNull();
        });

        test('Has Correct Always Install', () => {
            expect(file1.alwaysInstall).toBe('false');
        });

        test('Has Correct Install If Usable', () => {
            expect(file1.installIfUsable).toBe('false');
        });

        test('Has Correct Priority', () => {
            expect(file1.priority).toBe('0');
        });
    });

    describe('File 2', () => {
        test('Has Correct Source', () => {
            expect(file2.fileSource).toBe('/');
        });

        test('Has Correct Destination', () => {
            expect(file2.fileDestination).toBeNull();
        });

        test('Has Correct Always Install', () => {
            expect(file2.alwaysInstall).toBe('false');
        });

        test('Has Correct Install If Usable', () => {
            expect(file2.installIfUsable).toBe('false');
        });

        test('Has Correct Priority', () => {
            expect(file2.priority).toBe('0');
        });
    });
});
