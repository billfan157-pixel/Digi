#!/usr/bin/env python3
"""
Adds DigiWell WidgetExtension target to ios/App/App.xcodeproj/project.pbxproj
Run this after `npx cap sync ios` and before `xcodebuild`.
WARNING: pbxproj manipulation is fragile. If Xcode complains, run `npx cap sync ios` to reset.
"""
import hashlib
import os
import sys

PROJ_PATH = 'ios/App/App.xcodeproj/project.pbxproj'
WIDGET_DIR = 'ios/WidgetExtension'


def _uuid(seed: str) -> str:
    """Deterministic pseudo-UUID from seed string."""
    h = hashlib.md5(seed.encode()).hexdigest().upper()
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


# Pre-generated UUIDs
FILE_REF_WIDGET_SWIFT = _uuid("widget_swift_fref")
FILE_REF_WIDGET_PLIST = _uuid("widget_plist_fref")
FILE_REF_WIDGET_PRODUCT = _uuid("widget_product_fref")
BUILD_FILE_WIDGET_SWIFT = _uuid("widget_swift_bfile")
NATIVE_TARGET_WIDGET = _uuid("widget_native_target")
CONFIG_LIST_WIDGET = _uuid("widget_config_list")
SOURCES_PHASE_WIDGET = _uuid("widget_sources_phase")
FRAMEWORKS_PHASE_WIDGET = _uuid("widget_frameworks_phase")
RESOURCES_PHASE_WIDGET = _uuid("widget_resources_phase")
GROUP_WIDGET = _uuid("widget_group")
DEPENDENCY_WIDGET = _uuid("widget_dependency")
CONTAINER_PROXY_WIDGET = _uuid("widget_container_proxy")
COPY_PHASE_WIDGET = _uuid("widget_copy_phase")
CONFIG_DEBUG_WIDGET = _uuid("widget_debug_config")
CONFIG_RELEASE_WIDGET = _uuid("widget_release_config")


def read_proj() -> str:
    with open(PROJ_PATH, 'r', encoding='utf-8') as f:
        return f.read()


def write_proj(content: str):
    with open(PROJ_PATH, 'w', encoding='utf-8') as f:
        f.write(content)


def already_patched(content: str) -> bool:
    return NATIVE_TARGET_WIDGET in content


def patch(content: str) -> str:
    # 1. PBXBuildFile — WidgetPlugin.swift should already be there from previous patch,
    #    but we need DigiWellWidget.swift in the WidgetExtension target's Sources phase.
    build_file_widget = (
        f"\t\t{BUILD_FILE_WIDGET_SWIFT} /* DigiWellWidget.swift in Sources */ = "
        f"{{isa = PBXBuildFile; fileRef = {FILE_REF_WIDGET_SWIFT} /* DigiWellWidget.swift */; }};\n"
    )
    content = content.replace(
        "/* End PBXBuildFile section */",
        build_file_widget + "/* End PBXBuildFile section */",
    )

    # 2. PBXFileReference — widget files + .appex product
    file_refs = (
        f"\t\t{FILE_REF_WIDGET_SWIFT} /* DigiWellWidget.swift */ = "
        f"{{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DigiWellWidget.swift; sourceTree = \"<group>\"; }};\n"
        f"\t\t{FILE_REF_WIDGET_PLIST} /* Info.plist */ = "
        f"{{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};\n"
        f"\t\t{FILE_REF_WIDGET_PRODUCT} /* DigiWellWidget.appex */ = "
        f"{{isa = PBXFileReference; explicitFileType = \"wrapper.app-extension\"; includeInIndex = 0; path = DigiWellWidget.appex; "
        f"sourceTree = BUILT_PRODUCTS_DIR; }};\n"
    )
    content = content.replace(
        "/* End PBXFileReference section */",
        file_refs + "/* End PBXFileReference section */",
    )

    # 3. PBXGroup — add WidgetExtension group + product to Products
    group_widget = (
        f"\t\t{GROUP_WIDGET} /* WidgetExtension */ = {{\n"
        f"\t\t\tisa = PBXGroup;\n"
        f"\t\t\tchildren = (\n"
        f"\t\t\t\t{FILE_REF_WIDGET_SWIFT} /* DigiWellWidget.swift */,\n"
        f"\t\t\t\t{FILE_REF_WIDGET_PLIST} /* Info.plist */,\n"
        f"\t\t\t);\n"
        f"\t\t\tpath = WidgetExtension;\n"
        f"\t\t\tsourceTree = \"<group>\";\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXGroup section */",
        group_widget + "/* End PBXGroup section */",
    )
    # Also add WidgetExtension group to mainGroup children
    main_group_marker = "504EC3061FED79650016851F /* App */,"
    if GROUP_WIDGET not in content.split("mainGroup")[1].split("/* End PBXGroup section */")[0]:
        content = content.replace(
            main_group_marker,
            main_group_marker + "\n" + f"\t\t\t\t{GROUP_WIDGET} /* WidgetExtension */,"
        )
    # Add .appex to Products group
    products_marker = "504EC3041FED79650016851F /* App.app */,"
    content = content.replace(
        products_marker,
        products_marker + "\n" + f"\t\t\t\t{FILE_REF_WIDGET_PRODUCT} /* DigiWellWidget.appex */,"
    )

    # 4. PBXSourcesBuildPhase for WidgetExtension
    sources_phase = (
        f"\t\t{SOURCES_PHASE_WIDGET} /* Sources */ = {{\n"
        f"\t\t\tisa = PBXSourcesBuildPhase;\n"
        f"\t\t\tbuildActionMask = 2147483647;\n"
        f"\t\t\tfiles = (\n"
        f"\t\t\t\t{BUILD_FILE_WIDGET_SWIFT} /* DigiWellWidget.swift in Sources */,\n"
        f"\t\t\t);\n"
        f"\t\t\trunOnlyForDeploymentPostprocessing = 0;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXSourcesBuildPhase section */",
        sources_phase + "/* End PBXSourcesBuildPhase section */",
    )

    # 5. PBXFrameworksBuildPhase for WidgetExtension
    frameworks_phase = (
        f"\t\t{FRAMEWORKS_PHASE_WIDGET} /* Frameworks */ = {{\n"
        f"\t\t\tisa = PBXFrameworksBuildPhase;\n"
        f"\t\t\tbuildActionMask = 2147483647;\n"
        f"\t\t\tfiles = (\n"
        f"\t\t\t);\n"
        f"\t\t\trunOnlyForDeploymentPostprocessing = 0;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXFrameworksBuildPhase section */",
        frameworks_phase + "/* End PBXFrameworksBuildPhase section */",
    )

    # 6. PBXResourcesBuildPhase for WidgetExtension
    resources_phase = (
        f"\t\t{RESOURCES_PHASE_WIDGET} /* Resources */ = {{\n"
        f"\t\t\tisa = PBXResourcesBuildPhase;\n"
        f"\t\t\tbuildActionMask = 2147483647;\n"
        f"\t\t\tfiles = (\n"
        f"\t\t\t);\n"
        f"\t\t\trunOnlyForDeploymentPostprocessing = 0;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXResourcesBuildPhase section */",
        resources_phase + "/* End PBXResourcesBuildPhase section */",
    )

    # 7. PBXContainerItemProxy
    proxy = (
        f"\t\t{CONTAINER_PROXY_WIDGET} /* PBXContainerItemProxy */ = {{\n"
        f"\t\t\tisa = PBXContainerItemProxy;\n"
        f"\t\t\tcontainerPortal = 504EC2FC1FED79650016851F /* Project object */;\n"
        f"\t\t\tproxyType = 1;\n"
        f"\t\t\tremoteGlobalIDString = {NATIVE_TARGET_WIDGET};\n"
        f"\t\t\tremoteInfo = DigiWellWidget;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXContainerItemProxy section */",
        proxy + "/* End PBXContainerItemProxy section */",
    )

    # 8. PBXTargetDependency
    dependency = (
        f"\t\t{DEPENDENCY_WIDGET} /* PBXTargetDependency */ = {{\n"
        f"\t\t\tisa = PBXTargetDependency;\n"
        f"\t\t\ttarget = {NATIVE_TARGET_WIDGET} /* DigiWellWidget */;\n"
        f"\t\t\ttargetProxy = {CONTAINER_PROXY_WIDGET} /* PBXContainerItemProxy */;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXTargetDependency section */",
        dependency + "/* End PBXTargetDependency section */",
    )

    # 9. PBXCopyFilesBuildPhase — Embed App Extensions in App target
    copy_phase = (
        f"\t\t{COPY_PHASE_WIDGET} /* Embed Foundation Extensions */ = {{\n"
        f"\t\t\tisa = PBXCopyFilesBuildPhase;\n"
        f"\t\t\tbuildActionMask = 2147483647;\n"
        f"\t\t\tdstPath = \"\";\n"
        f"\t\t\tdstSubfolderSpec = 13;\n"
        f"\t\t\tfiles = (\n"
        f"\t\t\t);\n"
        f"\t\t\tname = \"Embed Foundation Extensions\";\n"
        f"\t\t\trunOnlyForDeploymentPostprocessing = 0;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXCopyFilesBuildPhase section */",
        copy_phase + "/* End PBXCopyFilesBuildPhase section */",
    )

    # 10. Update App target buildPhases to include Embed Foundation Extensions
    app_build_phases_marker = (
        "504EC3001FED79650016851F /* Sources */,\n"
        "\t\t\t\t504EC3011FED79650016851F /* Frameworks */,\n"
        "\t\t\t\t504EC3021FED79650016851F /* Resources */,"
    )
    app_build_phases_with_embed = (
        "504EC3001FED79650016851F /* Sources */,\n"
        "\t\t\t\t504EC3011FED79650016851F /* Frameworks */,\n"
        "\t\t\t\t504EC3021FED79650016851F /* Resources */,\n"
        f"\t\t\t\t{COPY_PHASE_WIDGET} /* Embed Foundation Extensions */,"
    )
    content = content.replace(app_build_phases_marker, app_build_phases_with_embed)

    # 11. Update App target dependencies
    app_deps_marker = "dependencies = (\n\t\t\t);"
    app_deps_with_widget = f"dependencies = (\n\t\t\t\t{DEPENDENCY_WIDGET} /* PBXTargetDependency */,\n\t\t\t);"
    content = content.replace(app_deps_marker, app_deps_with_widget, 1)

    # 12. PBXNativeTarget for WidgetExtension
    native_target = (
        f"\t\t{NATIVE_TARGET_WIDGET} /* DigiWellWidget */ = {{\n"
        f"\t\t\tisa = PBXNativeTarget;\n"
        f"\t\t\tbuildConfigurationList = {CONFIG_LIST_WIDGET} /* Build configuration list for PBXNativeTarget \"DigiWellWidget\" */;\n"
        f"\t\t\tbuildPhases = (\n"
        f"\t\t\t\t{FRAMEWORKS_PHASE_WIDGET} /* Frameworks */,\n"
        f"\t\t\t\t{SOURCES_PHASE_WIDGET} /* Sources */,\n"
        f"\t\t\t\t{RESOURCES_PHASE_WIDGET} /* Resources */,\n"
        f"\t\t\t);\n"
        f"\t\t\tbuildRules = (\n"
        f"\t\t\t);\n"
        f"\t\t\tdependencies = (\n"
        f"\t\t\t);\n"
        f"\t\t\tname = DigiWellWidget;\n"
        f"\t\t\tproductName = DigiWellWidget;\n"
        f"\t\t\tproductReference = {FILE_REF_WIDGET_PRODUCT} /* DigiWellWidget.appex */;\n"
        f"\t\t\tproductType = \"com.apple.product-type.app-extension\";\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End PBXNativeTarget section */",
        native_target + "/* End PBXNativeTarget section */",
    )

    # 13. XCBuildConfiguration for WidgetExtension (Debug)
    debug_config = (
        f"\t\t{CONFIG_DEBUG_WIDGET} /* Debug */ = {{\n"
        f"\t\t\tisa = XCBuildConfiguration;\n"
        f"\t\t\tbuildSettings = {{\n"
        f"\t\t\t\tASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;\n"
        f"\t\t\t\tASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME = \"WidgetBackground\";\n"
        f"\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = \"gnu++20\";\n"
        f"\t\t\t\tCLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;\n"
        f"\t\t\t\tCODE_SIGN_STYLE = Automatic;\n"
        f"\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n"
        f"\t\t\t\tDEVELOPMENT_TEAM = \"\";\n"
        f"\t\t\t\tGENERATE_INFOPLIST_FILE = YES;\n"
        f"\t\t\t\tINFOPLIST_FILE = \"WidgetExtension/Info.plist\";\n"
        f"\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = \"DigiWell Widget\";\n"
        f"\t\t\t\tINFOPLIST_KEY_NSWidgetWantsLocation = NO;\n"
        f"\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 15.0;\n"
        f"\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (\n"
        f"\t\t\t\t\t\"$(inherited)\",\n"
        f"\t\t\t\t\t\"@executable_path/Frameworks\",\n"
        f"\t\t\t\t\t\"@executable_path/../../Frameworks\",\n"
        f"\t\t\t\t);\n"
        f"\t\t\t\tMARKETING_VERSION = 1.0;\n"
        f"\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = \"com.vlu.digiwell.widget\";\n"
        f"\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";\n"
        f"\t\t\t\tSDKROOT = iphoneos;\n"
        f"\t\t\t\tSKIP_INSTALL = YES;\n"
        f"\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;\n"
        f"\t\t\t\tSWIFT_VERSION = 5.0;\n"
        f"\t\t\t\tTARGETED_DEVICE_FAMILY = \"1,2\";\n"
        f"\t\t\t}};\n"
        f"\t\t\tname = Debug;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End XCBuildConfiguration section */",
        debug_config + "/* End XCBuildConfiguration section */",
    )

    # 14. XCBuildConfiguration for WidgetExtension (Release)
    release_config = (
        f"\t\t{CONFIG_RELEASE_WIDGET} /* Release */ = {{\n"
        f"\t\t\tisa = XCBuildConfiguration;\n"
        f"\t\t\tbuildSettings = {{\n"
        f"\t\t\t\tASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;\n"
        f"\t\t\t\tASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME = \"WidgetBackground\";\n"
        f"\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = \"gnu++20\";\n"
        f"\t\t\t\tCLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;\n"
        f"\t\t\t\tCODE_SIGN_STYLE = Automatic;\n"
        f"\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n"
        f"\t\t\t\tDEVELOPMENT_TEAM = \"\";\n"
        f"\t\t\t\tGENERATE_INFOPLIST_FILE = YES;\n"
        f"\t\t\t\tINFOPLIST_FILE = \"WidgetExtension/Info.plist\";\n"
        f"\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = \"DigiWell Widget\";\n"
        f"\t\t\t\tINFOPLIST_KEY_NSWidgetWantsLocation = NO;\n"
        f"\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 15.0;\n"
        f"\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (\n"
        f"\t\t\t\t\t\"$(inherited)\",\n"
        f"\t\t\t\t\t\"@executable_path/Frameworks\",\n"
        f"\t\t\t\t\t\"@executable_path/../../Frameworks\",\n"
        f"\t\t\t\t);\n"
        f"\t\t\t\tMARKETING_VERSION = 1.0;\n"
        f"\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = \"com.vlu.digiwell.widget\";\n"
        f"\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";\n"
        f"\t\t\t\tSDKROOT = iphoneos;\n"
        f"\t\t\t\tSKIP_INSTALL = YES;\n"
        f"\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;\n"
        f"\t\t\t\tSWIFT_VERSION = 5.0;\n"
        f"\t\t\t\tTARGETED_DEVICE_FAMILY = \"1,2\";\n"
        f"\t\t\t}};\n"
        f"\t\t\tname = Release;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End XCBuildConfiguration section */",
        release_config + "/* End XCBuildConfiguration section */",
    )

    # 15. XCConfigurationList for WidgetExtension
    config_list = (
        f"\t\t{CONFIG_LIST_WIDGET} /* Build configuration list for PBXNativeTarget \"DigiWellWidget\" */ = {{\n"
        f"\t\t\tisa = XCConfigurationList;\n"
        f"\t\t\tbuildConfigurations = (\n"
        f"\t\t\t\t{CONFIG_DEBUG_WIDGET} /* Debug */,\n"
        f"\t\t\t\t{CONFIG_RELEASE_WIDGET} /* Release */,\n"
        f"\t\t\t);\n"
        f"\t\t\tdefaultConfigurationIsVisible = 0;\n"
        f"\t\t\tdefaultConfigurationName = Release;\n"
        f"\t\t}};\n"
    )
    content = content.replace(
        "/* End XCConfigurationList section */",
        config_list + "/* End XCConfigurationList section */",
    )

    # 16. Update PBXProject targets list
    targets_marker = "targets = (\n\t\t\t\t504EC3031FED79650016851F /* App */,\n\t\t\t);"
    targets_with_widget = (
        f"targets = (\n"
        f"\t\t\t\t504EC3031FED79650016851F /* App */,\n"
        f"\t\t\t\t{NATIVE_TARGET_WIDGET} /* DigiWellWidget */,\n"
        f"\t\t\t);"
    )
    content = content.replace(targets_marker, targets_with_widget)

    # 17. Update PBXProject TargetAttributes
    attrs_marker = (
        "TargetAttributes = {\n"
        "\t\t\t\t\t504EC3031FED79650016851F = {\n"
        "\t\t\t\t\t\tCreatedOnToolsVersion = 9.2;\n"
        "\t\t\t\t\t\tLastSwiftMigration = 1100;\n"
        "\t\t\t\t\t\tProvisioningStyle = Automatic;\n"
        "\t\t\t\t\t},\n"
        "\t\t\t\t};"
    )
    attrs_with_widget = (
        "TargetAttributes = {\n"
        "\t\t\t\t\t504EC3031FED79650016851F = {\n"
        "\t\t\t\t\t\tCreatedOnToolsVersion = 9.2;\n"
        "\t\t\t\t\t\tLastSwiftMigration = 1100;\n"
        "\t\t\t\t\t\tProvisioningStyle = Automatic;\n"
        "\t\t\t\t\t},\n"
        f"\t\t\t\t\t{NATIVE_TARGET_WIDGET} = {{\n"
        f"\t\t\t\t\t\tCreatedOnToolsVersion = 14.0;\n"
        f"\t\t\t\t\t}},\n"
        "\t\t\t\t};"
    )
    content = content.replace(attrs_marker, attrs_with_widget)

    return content


def main():
    if not os.path.exists(PROJ_PATH):
        print(f"[ERROR] Khong tim thay {PROJ_PATH}")
        sys.exit(1)

    content = read_proj()

    if already_patched(content):
        print("[setup-ios-widget] Project da co WidgetExtension target — bo qua.")
        return

    try:
        patched = patch(content)
    except Exception as e:
        print(f"[ERROR] Patch that bai: {e}")
        sys.exit(1)

    # Validate basic structure
    if NATIVE_TARGET_WIDGET not in patched:
        print("[ERROR] Patch khong thanh cong — target khong xuat hien trong file.")
        sys.exit(1)

    write_proj(patched)
    print("[setup-ios-widget] Da them WidgetExtension target vao project.pbxproj")
    print("  - Target: DigiWellWidget")
    print("  - Bundle ID: com.vlu.digiwell.widget")
    print("  - Files: DigiWellWidget.swift, Info.plist")
    print("  NOTE: Can cap nhat DEVELOPMENT_TEAM trong build settings truoc khi build.")


if __name__ == "__main__":
    main()
