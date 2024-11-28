import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { exec } from 'child_process';

const util = {
    /**
     * 获取当前所在工程根目录
     * @param document uri 表示工程内某个文件的路径
     */
    getProjectPath(document?: vscode.TextDocument | vscode.Uri | null): string {
        if (!document) {
            document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
        }
        if (!document) {
            this.showError('当前激活的编辑器不是文件或者没有文件被打开！');
            return '';
        }
        const currentFile = (document as vscode.TextDocument).uri?.fsPath || (document as vscode.Uri).fsPath;
        let projectPath: string | null = null;

        let workspaceFolders = vscode.workspace.workspaceFolders?.map(item => item.uri.fsPath) || [];
        if (workspaceFolders.length === 1 && workspaceFolders[0] === vscode.workspace.rootPath) {
            const rootPath = workspaceFolders[0];
            const files = fs.readdirSync(rootPath);
            workspaceFolders = files.filter(name => !/^\./g.test(name)).map(name => path.resolve(rootPath, name));
        }
        workspaceFolders.forEach(folder => {
            if (currentFile.indexOf(folder) === 0) {
                projectPath = folder;
            }
        });
        if (!projectPath) {
            this.showError('获取工程根路径异常！');
            return '';
        }
        return projectPath;
    },

    /**
     * 获取当前工程名
     */
    getProjectName(projectPath: string): string {
        return path.basename(projectPath);
    },

    /**
     * 将一个单词首字母大写并返回
     */
    upperFirstLetter(word: string): string {
        return (word || '').replace(/^\w/, m => m.toUpperCase());
    },

    /**
     * 将一个单词首字母转小写并返回
     */
    lowerFirstLetter(word: string): string {
        return (word || '').replace(/^\w/, m => m.toLowerCase());
    },

    /**
     * 全局日志开关，发布时可以注释掉日志输出
     */
    log(...args: unknown[]): void {
        console.log(...args);
    },

    /**
     * 全局日志开关，发布时可以注释掉日志输出
     */
    error(...args: unknown[]): void {
        console.error(...args);
    },

    /**
     * 弹出错误信息
     */
    showError(info: string): void {
        vscode.window.showErrorMessage(info);
    },

    /**
     * 弹出提示信息
     */
    showInfo(info: string): void {
        vscode.window.showInformationMessage(info);
    },

    /**
     * 从某个文件里面查找某个字符串，返回第一个匹配处的行与列
     */
    findStrInFile(filePath: string, reg: RegExp | string): { row: number; col: number } {
        const content = fs.readFileSync(filePath, 'utf-8');
        reg = typeof reg === 'string' ? new RegExp(reg, 'm') : reg;
        if (content.search(reg) < 0) return { row: 0, col: 0 };
        const rows = content.split(os.EOL);
        for (let i = 0; i < rows.length; i++) {
            const col = rows[i].search(reg);
            if (col >= 0) {
                return { row: i, col };
            }
        }
        return { row: 0, col: 0 };
    },

    /**
     * 获取某个字符串在文件里第一次出现位置的范围
     */
    getStrRangeInFile(filePath: string, str: string): vscode.Range {
        const pos = this.findStrInFile(filePath, str);
        return new vscode.Range(
            new vscode.Position(pos.row, pos.col),
            new vscode.Position(pos.row, pos.col + str.length)
        );
    },

    /**
     * 使用默认浏览器中打开某个URL
     */
    openUrlInBrowser(url: string): void {
        exec(`open '${url}'`);
    },

    /**
     * 动态require，加载之前会先尝试删除缓存
     */
    dynamicRequire(modulePath: string): unknown {
        this.clearRequireCache(modulePath);
        return require(modulePath);
    },

    /**
     * 递归遍历清空某个资源的require缓存
     */
    clearRequireCache(absolutePath: string): void {
        const root = require.cache[absolutePath];
        if (!root) return;
        if (root.children) {
            root.children.forEach(item => {
                this.clearRequireCache(item.id);
            });
        }
        delete require.cache[absolutePath];
    },

    /**
     * 比较2个对象转JSON字符串后是否完全一样
     */
    jsonEquals(obj1: unknown, obj2: unknown): boolean {
        const s1 = JSON.stringify(obj1);
        const s2 = JSON.stringify(obj2);
        return s1 === s2;
    }
};

export default util;
