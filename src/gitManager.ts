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
            vscode.window.showInformationMessage('Git监听已启动 | Git monitoring started');
            
            gitWatcher.onDidChange(async () => {
                vscode.window.showInformationMessage('检测到Git提交 | Git commit detected');
                await this.handleNewCommit();
            });

            // 立即检查最新提交
            await this.handleNewCommit();
        } catch (error: any) {
            vscode.window.showErrorMessage(`启动Git监听失败 | Failed to start Git monitoring: ${error.message}`);
        }
    }

    private async handleNewCommit() {
        try {
            // 获取最新的 commit 信息
            const log = await this.git.log({ maxCount: 1 });
            if (log.latest) {
                const { message, author_name, hash } = log.latest;
                
                // 获取本次提交的代码变更
                const diff = await this.git.diff([`${hash}^`, hash]);
                
                // 调用 Cursor API 进行代码总结
                const summary = await this.getCodeSummary(diff);
                
                // 添加日志输出
                vscode.window.showInformationMessage(`检测到提交 | Commit detected: ${message}`);
                
                // 解析 commit 消息并添加总结
                if (message.startsWith('feat:')) {
                    const description = message.substring(5).trim();
                    await this.changelogManager.addFeature(`${description}\n   总结: ${summary}`, author_name);
                    vscode.window.showInformationMessage('已添加新功能记录 | New feature record added');
                } else if (message.startsWith('fix:')) {
                    const description = message.substring(4).trim();
                    await this.changelogManager.addBugfix(`${description}\n   总结: ${summary}`, author_name);
                    vscode.window.showInformationMessage('已添加Bug修复记录 | Bug fix record added');
                }
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`处理Git提交失败 | Failed to process Git commit: ${error.message}`);
        }
    }

    private async getCodeSummary(diff: string): Promise<string> {
        try {
            // 检查是否在 Cursor 环境中
            const isCursor = vscode.env.appName.toLowerCase().includes('cursor');
            console.log('当前环境:', vscode.env.appName);
            console.log('是否在Cursor中:', isCursor);
            
            if (!isCursor) {
                return '(代码总结功能仅在 Cursor 中可用)';
            }

            // 调用 Cursor API 进行代码总结
            const cursorApi = (vscode as any).workspace;
            console.log('Cursor API 状态:', cursorApi ? '可用' : '不可用');
            console.log('summarizeChanges API 状态:', cursorApi?.summarizeChanges ? '可用' : '不可用');
            
            if (!cursorApi || !cursorApi.summarizeChanges) {
                return '(Cursor API 不可用)';
            }

            // 使用 Cursor 的 summarizeChanges API
            console.log('开始调用代码总结API...');
            const summary = await cursorApi.summarizeChanges(diff);
            console.log('代码总结结果:', summary);
            
            if (typeof summary === 'string') {
                return summary;
            }
            return summary?.summary || '(无代码变更总结)';
        } catch (error: any) {
            console.error('代码总结失败:', error);
            return '(代码总结失败)';
        }
    }
} 