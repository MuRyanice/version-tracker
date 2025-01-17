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
                prompt: '请输入新功能描述',
                placeHolder: '例如：添加用户登录界面'
            });

            if (description) {
                await changelogManager.addFeature(description);
                vscode.window.showInformationMessage('新功能记录已添加');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`添加功能记录失败: ${error.message}`);
        }
    });

    // 注册添加Bug修复记录命令
    let addBugfixDisposable = vscode.commands.registerCommand('version-tracker.addBugfix', async () => {
        try {
            const description = await vscode.window.showInputBox({
                prompt: '请输入Bug修复描述',
                placeHolder: '例如：修复移动端显示异常'
            });

            if (description) {
                await changelogManager.addBugfix(description);
                vscode.window.showInformationMessage('Bug修复记录已添加');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`添加Bug修复记录失败: ${error.message}`);
        }
    });

    // 注册创建新版本命令
    let createVersionDisposable = vscode.commands.registerCommand('version-tracker.createNewVersion', async () => {
        try {
            const version = await vscode.window.showInputBox({
                prompt: '请输入新版本号',
                placeHolder: '例如：1.0.0'
            });

            if (version) {
                await changelogManager.createNewVersion(version);
                vscode.window.showInformationMessage(`版本 ${version} 已创建`);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`创建新版本失败: ${error.message}`);
        }
    });

    context.subscriptions.push(addFeatureDisposable);
    context.subscriptions.push(addBugfixDisposable);
    context.subscriptions.push(createVersionDisposable);
}

export function deactivate() {} 