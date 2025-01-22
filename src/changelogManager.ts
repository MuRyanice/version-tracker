import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ChangelogManager {
    private changelogPath: string = '';

    constructor() {
        this.initializeChangelog();
    }
//测试是否日志更新
    private async initializeChangelog() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('没有打开的工作区');
        }
        this.changelogPath = path.join(workspaceFolders[0].uri.fsPath, 'CHANGELOG.md');
        if (!fs.existsSync(this.changelogPath)) {
            await this.createChangelogFile();
        }
    }

    private async createChangelogFile() {
        const initialContent = `# 更新日志\n\n## [未发布]\n### 新功能 🎉\n\n### Bug 修复 🐛\n`;
        await fs.promises.writeFile(this.changelogPath, initialContent, 'utf8');
    }

    private async getCurrentUser(): Promise<string> {
        // 这里可以集成 Git 配置获取用户名，暂时返回默认值
        return 'unknown';
    }

    public async addFeature(description: string, author?: string) {
        try {
            const user = author || await this.getCurrentUser();
            const content = await fs.promises.readFile(this.changelogPath, 'utf8');
            const lines = content.split('\n');
            
            let featureIndex = lines.findIndex((line: string) => line.includes('新功能 🎉'));
            if (featureIndex !== -1) {
                lines.splice(featureIndex + 1, 0, `- ${description} (@${user})`);
                await fs.promises.writeFile(this.changelogPath, lines.join('\n'), 'utf8');
            } else {
                throw new Error('未找到新功能标记位置');
            }
        } catch (error: any) {
            throw new Error(`添加功能记录失败: ${error.message}`);
        }
    }

    public async addBugfix(description: string, author?: string) {
        try {
            const user = author || await this.getCurrentUser();
            const content = await fs.promises.readFile(this.changelogPath, 'utf8');
            const lines = content.split('\n');
            
            let bugfixIndex = lines.findIndex((line: string) => line.includes('Bug 修复 🐛'));
            if (bugfixIndex !== -1) {
                lines.splice(bugfixIndex + 1, 0, `- ${description} (@${user})`);
                await fs.promises.writeFile(this.changelogPath, lines.join('\n'), 'utf8');
            } else {
                throw new Error('未找到Bug修复标记位置');
            }
        } catch (error: any) {
            throw new Error(`添加Bug修复记录失败: ${error.message}`);
        }
    }

    public async createNewVersion(version: string) {
        try {
            const content = await fs.promises.readFile(this.changelogPath, 'utf8');
            const date = new Date().toISOString().split('T')[0];
            const newVersionHeader = `\n## [v${version}] - ${date}\n`;
            
            const unreleasedRegex = /## \[未发布\]\n([\s\S]*?)(?=\n## |$)/;
            const match = content.match(unreleasedRegex);
            
            if (match) {
                const unreleasedContent = match[1];
                const newContent = content.replace(unreleasedRegex, 
                    `## [未发布]\n### 新功能 🎉\n\n### Bug 修复 🐛\n${newVersionHeader}${unreleasedContent}`);
                
                await fs.promises.writeFile(this.changelogPath, newContent, 'utf8');
            } else {
                throw new Error('未找到未发布内容区域');
            }
        } catch (error: any) {
            throw new Error(`创建新版本失败: ${error.message}`);
        }
    }
} 