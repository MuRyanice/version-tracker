import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { ChangelogManager } from './changelogManager';

export class GitManager {
    private git: SimpleGit;
    private changelogManager: ChangelogManager;

    constructor(workspacePath: string, changelogManager: ChangelogManager) {
        this.git = simpleGit(workspacePath);
        this.changelogManager = changelogManager;
    }

    public async watchGitCommits() {
        try {
            // 监听工作区的 Git 仓库变化
            const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/logs/HEAD');
            
            // 添加日志输出
            vscode.window.showInformationMessage('Git监听已启动');
            
            gitWatcher.onDidChange(async () => {
                vscode.window.showInformationMessage('检测到Git提交');
                await this.handleNewCommit();
            });

            // 立即检查最新提交
            await this.handleNewCommit();
        } catch (error: any) {
            vscode.window.showErrorMessage(`启动Git监听失败: ${error.message}`);
        }
    }

    private async handleNewCommit() {
        try {
            // 获取最新的 commit 信息
            const log = await this.git.log({ maxCount: 1 });
            if (log.latest) {
                const { message, author_name } = log.latest;
                
                // 添加日志输出
                vscode.window.showInformationMessage(`检测到提交: ${message}`);
                
                // 解析 commit 消息
                if (message.startsWith('feat:')) {
                    const description = message.substring(5).trim();
                    await this.changelogManager.addFeature(description, author_name);
                    vscode.window.showInformationMessage('已添加新功能记录');
                } else if (message.startsWith('fix:')) {
                    const description = message.substring(4).trim();
                    await this.changelogManager.addBugfix(description, author_name);
                    vscode.window.showInformationMessage('已添加Bug修复记录');
                }
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`处理Git提交失败: ${error.message}`);
        }
    }
} 