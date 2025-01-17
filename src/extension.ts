import * as vscode from 'vscode';
import { ChangelogManager } from './changelogManager';
import { GitManager } from './gitManager';

export function activate(context: vscode.ExtensionContext) {
    // 添加 Cursor 环境检测
    const isCursor = vscode.env.appName.toLowerCase().includes('cursor');
    
    const changelogManager = new ChangelogManager();

    // 添加 Git 监听
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const gitManager = new GitManager(
            vscode.workspace.workspaceFolders[0].uri.fsPath,
            changelogManager
        );
        gitManager.watchGitCommits();
    }

    // 注册添加新功能记录命令
    let addFeatureDisposable = vscode.commands.registerCommand('version-tracker.addFeature', async () => {
        try {
            const description = await vscode.window.showInputBox({
                title: vscode.env.language === 'zh-cn' ? "添加新功能" : "Add New Feature",
                prompt: vscode.env.language === 'zh-cn' ? 
                    "请输入新功能描述" : "Enter feature description",
                placeHolder: vscode.env.language === 'zh-cn' ? 
                    "例如：添加用户登录界面" : "e.g., Add user login interface"
            });

            if (description) {
                await changelogManager.addFeature(description);
                const message = vscode.env.language === 'zh-cn' ? 
                    "新功能记录已添加" : 
                    "New feature record added";
                vscode.window.showInformationMessage(message);
            }
        } catch (error: any) {
            const errorMessage = vscode.env.language === 'zh-cn' ? 
                `添加功能记录失败: ${error.message}` : 
                `Failed to add feature: ${error.message}`;
            vscode.window.showErrorMessage(errorMessage);
        }
    });

    // 注册添加Bug修复记录命令
    let addBugfixDisposable = vscode.commands.registerCommand('version-tracker.addBugfix', async () => {
        try {
            const description = await vscode.window.showInputBox({
                title: vscode.env.language === 'zh-cn' ? "添加Bug修复" : "Add Bug Fix",
                prompt: vscode.env.language === 'zh-cn' ? 
                    "请输入Bug修复描述" : "Enter bug fix description",
                placeHolder: vscode.env.language === 'zh-cn' ? 
                    "例如：修复移动端显示异常" : "e.g., Fix mobile display issues"
            });

            if (description) {
                await changelogManager.addBugfix(description);
                const message = vscode.env.language === 'zh-cn' ? 
                    "Bug修复记录已添加" : 
                    "Bug fix record added";
                vscode.window.showInformationMessage(message);
            }
        } catch (error: any) {
            const errorMessage = vscode.env.language === 'zh-cn' ? 
                `添加Bug修复记录失败: ${error.message}` : 
                `Failed to add bug fix: ${error.message}`;
            vscode.window.showErrorMessage(errorMessage);
        }
    });

    // 注册创建新版本命令
    let createVersionDisposable = vscode.commands.registerCommand('version-tracker.createNewVersion', async () => {
        try {
            const version = await vscode.window.showInputBox({
                title: vscode.env.language === 'zh-cn' ? "创建新版本" : "Create New Version",
                prompt: vscode.env.language === 'zh-cn' ? 
                    "请输入新版本号" : "Enter new version number",
                placeHolder: vscode.env.language === 'zh-cn' ? 
                    "例如：1.0.0" : "e.g., 1.0.0",
                validateInput: (value: string) => {
                    const message = vscode.env.language === 'zh-cn' ? 
                        "请输入有效的版本号 (x.y.z)" : 
                        "Please enter a valid version number (x.y.z)";
                    return /^\d+\.\d+\.\d+$/.test(value) ? null : message;
                }
            });

            if (version) {
                await changelogManager.createNewVersion(version);
                const message = vscode.env.language === 'zh-cn' ? 
                    `版本 ${version} 已创建` : 
                    `Version ${version} created`;
                vscode.window.showInformationMessage(message);
            }
        } catch (error: any) {
            const errorMessage = vscode.env.language === 'zh-cn' ? 
                `创建新版本失败: ${error.message}` : 
                `Failed to create version: ${error.message}`;
            vscode.window.showErrorMessage(errorMessage);
        }
    });

    context.subscriptions.push(addFeatureDisposable);
    context.subscriptions.push(addBugfixDisposable);
    context.subscriptions.push(createVersionDisposable);
}

export function deactivate() {} 