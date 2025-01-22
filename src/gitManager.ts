import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { ChangelogManager } from './changelogManager';

export class GitManager {
    private git: SimpleGit;
    private changelogManager: ChangelogManager;
    private outputChannel: vscode.OutputChannel;

    constructor(workspacePath: string, changelogManager: ChangelogManager) {
        this.git = simpleGit(workspacePath);
        this.changelogManager = changelogManager;
        this.outputChannel = vscode.window.createOutputChannel('Version AI Tracker');
    }

    private log(message: string) {
        this.outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }

    public async watchGitCommits() {
        try {
            // 监听工作区的 Git 仓库变化
            const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/logs/HEAD');
            
            // 添加日志输出
            this.log('Git监听已启动 | Git monitoring started');
            vscode.window.showInformationMessage('Git监听已启动 | Git monitoring started');
            
            gitWatcher.onDidChange(async () => {
                this.log('检测到Git提交 | Git commit detected');
                vscode.window.showInformationMessage('检测到Git提交 | Git commit detected');
                await this.handleNewCommit();
            });

            // 立即检查最新提交
            await this.handleNewCommit();
        } catch (error: any) {
            this.log(`启动Git监听失败: ${error.message}`);
            vscode.window.showErrorMessage(`启动Git监听失败 | Failed to start Git monitoring: ${error.message}`);
        }
    }

    private async handleNewCommit() {
        try {
            // 获取最新的 commit 信息
            const log = await this.git.log({ maxCount: 1 });
            if (log.latest) {
                const { message, author_name, hash } = log.latest;
                this.log(`处理新提交: ${message}`);
                
                // 获取本次提交的代码变更
                const diff = await this.git.diff([`${hash}^`, hash]);
                this.log('获取到代码变更');
                
                // 调用 Cursor API 进行代码总结
                const summary = await this.getCodeSummary(diff);
                this.log(`代码总结结果: ${summary}`);
                
                // 添加日志输出
                vscode.window.showInformationMessage(`检测到提交 | Commit detected: ${message}`);
                
                // 解析 commit 消息并添加总结
                if (message.startsWith('feat:')) {
                    const description = message.substring(5).trim();
                    await this.changelogManager.addFeature(`${description}\n   总结: ${summary}`, author_name);
                    this.log('已添加新功能记录');
                    vscode.window.showInformationMessage('已添加新功能记录 | New feature record added');
                } else if (message.startsWith('fix:')) {
                    const description = message.substring(4).trim();
                    await this.changelogManager.addBugfix(`${description}\n   总结: ${summary}`, author_name);
                    this.log('已添加Bug修复记录');
                    vscode.window.showInformationMessage('已添加Bug修复记录 | Bug fix record added');
                }
            }
        } catch (error: any) {
            this.log(`处理Git提交失败: ${error.message}`);
            vscode.window.showErrorMessage(`处理Git提交失败 | Failed to process Git commit: ${error.message}`);
        }
    }

    private async getCodeSummary(diff: string): Promise<string> {
        try {
            // 检查是否在 Cursor 环境中
            const isCursor = vscode.env.appName.toLowerCase().includes('cursor');
            this.log(`当前环境: ${vscode.env.appName}`);
            this.log(`是否在Cursor中: ${isCursor}`);
            
            if (!isCursor) {
                return '(代码总结功能仅在 Cursor 中可用)';
            }

            // 尝试不同的 Cursor API 路径
            const cursorApi = (vscode as any).cursor || (vscode as any).workspace?.cursor;
            this.log(`Cursor API 状态: ${cursorApi ? '可用' : '不可用'}`);
            
            // 检查所有可能的API方法
            const availableMethods = cursorApi ? Object.keys(cursorApi) : [];
            this.log(`可用的API方法: ${JSON.stringify(availableMethods)}`);
            
            const summarizeMethod = cursorApi?.summarizeChanges || cursorApi?.summarize || cursorApi?.summarizeCode;
            this.log(`找到的总结方法: ${summarizeMethod ? '是' : '否'}`);
            
            if (!cursorApi || !summarizeMethod) {
                return '(Cursor API 不可用)';
            }

            // 使用找到的总结方法
            this.log('开始调用代码总结API...');
            const summary = await summarizeMethod.call(cursorApi, diff);
            this.log(`代码总结结果: ${JSON.stringify(summary)}`);
            
            if (typeof summary === 'string') {
                return summary;
            }
            return summary?.summary || '(无代码变更总结)';
        } catch (error: any) {
            this.log(`代码总结失败: ${error.message}`);
            return '(代码总结失败)';
        }
    }
} 