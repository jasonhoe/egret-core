﻿/// <reference path="../lib/types.d.ts" />

import os = require('os');
import crypto = require('crypto');
import file = require('../lib/FileUtil');
import _utils = require('../lib/utils');
import path = require("path");



export class EgretProject {
    private egretProperties: egret.EgretProperty = {
        modules: []
    };

    projectRoot = "";
    init(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.reload();
    }

    public invalid(report?: boolean) {
        let result = !this.egretProperties.modules ||
            this.egretProperties.modules.length == 0;
        if (result && report) {
            console.log(_utils.tr(1602));//缺少egretProperties.json
        }
        return result;
    }

    hasEUI() {
        return this.egretProperties.modules.some(m => m.name == "eui");
    }

    reload() {
        this.egretProperties = { modules: [] };
        let egretPropertiesPath = this.getFilePath("egretProperties.json");
        if (file.exists(egretPropertiesPath)) {
            this.egretProperties = JSON.parse(file.read(egretPropertiesPath));
            let useGUIorEUI = 0;
            for (let m of this.egretProperties.modules) {
                //兼容小写
                if (m.name == "dragonbones" && !m.path) {
                    m.name = "dragonBones";
                }
                if (m.name == "gui" || m.name == "eui") {
                    useGUIorEUI++;
                }
            }
            if (useGUIorEUI >= 2) {
                globals.log2(8);
                process.exit(1);
            }
        }
    }

    /**
     * 获取项目的根路径
     */
    getProjectRoot() {
        return this.projectRoot;
    }

    getFilePath(fileName: string) {
        return path.resolve(this.getProjectRoot(), fileName);
    }

    /**
     * 获取项目使用的egret版本号
     * @returns {any}
     */
    getVersion(): string {
        return this.egretProperties.egret_version;
    }

    getReleaseRoot() {
        var p = "bin-release";
        if (globals.hasKeys(this.egretProperties, ["publish", "path"])) {
            p = this.egretProperties.publish.path;
        }

        return file.getAbsolutePath(p);
        //return file.joinPath(egret.args.projectDir, p);
    }

    getVersionCode(runtime) {
        if (globals.hasKeys(this.egretProperties, ["publish", "baseVersion"])) {
            return this.egretProperties["publish"]["baseVersion"];
        }
        return 1;
    }

    getIgnorePath(): Array<any> {
        if (globals.hasKeys(this.egretProperties, [egret.args.runtime, "path_ignore"])) {
            return this.egretProperties[egret.args.runtime]["path_ignore"];
        }
        return [];
    }

    getCopyExmlList(): Array<string> {
        if (globals.hasKeys(this.egretProperties, [egret.args.runtime, "copyExmlList"])) {
            return this.egretProperties[egret.args.runtime]["copyExmlList"];
        }
        return [];
    }

    getNativePath(platform) {
        if (globals.hasKeys(this.egretProperties, ["native", platform + "_path"])) {
            return path.resolve(this.getProjectRoot(), this.egretProperties.native[platform + "_path"]);
        }
        return null;
    }

    private getModulePath(m: egret.EgretPropertyModule) {
        let moduleBin;
        if (m.path == null) {
            moduleBin = path.join(egret.root, "build", m.name);
        }
        else {
            let tempModulePath = file.getAbsolutePath(m.path);
            moduleBin = path.join(tempModulePath, "bin", m.name);
        }
        return moduleBin;
    }

    getLibraryFolder() {
        return this.getFilePath('libs/modules');
    }



    getModulesConfig() {
        return this.egretProperties.modules.map(m => {
            let name = m.name;
            let source = this.getModulePath(m);
            let target = path.join(this.getLibraryFolder(), name)

            let relative = path.relative(this.getProjectRoot(), source);
            if (relative.indexOf("..") == -1) { // source 在项目中
                target = source;
            }

            target = path.relative(this.getProjectRoot(), target) + path.sep;
            return { name, source, target }
        })
    }

    getPublishType(runtime: string): number {
        if (globals.hasKeys(this.egretProperties, ["publish", runtime])) {
            return this.egretProperties["publish"][runtime];
        }

        return 0;
    }

    getResources(): string[] {
        if (globals.hasKeys(this.egretProperties, ["resources"])) {
            return this.egretProperties["resources"];
        }

        return ["resource"];
    }
}
export var utils = new EgretProject();


export type Package_JSON = {

    modules: PACKAGE_JSON_MODULE[]

}

export type PACKAGE_JSON_MODULE = {

    files: string[],

    name: string;

    root: string

}