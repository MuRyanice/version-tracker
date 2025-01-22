import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

// 自定义错误类
class ChangelogError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ChangelogError';
    }
}

export class ChangelogManager {
    private readonly CHANGELOG_FILENAME = 'CHANGELOG.md';
    private readonly SECTIONS = {
        UNRELEASED: '## [未发布]',
        FEATURES: '### 新功能 🎉',
        BUGFIXES: '### Bug 修复 🐛'
    };
    private changelogPath: string = '';
    private backupPath: string = '';

    constructor() {
        this.initializeChangelog();
    }

    private async initializeChangelog() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new ChangelogError('没有打开的工作区');
            }
            
            const workspacePath = workspaceFolders[0].uri.fsPath;
            this.changelogPath = path.join(workspacePath, this.CHANGELOG_FILENAME);
            this.backupPath = path.join(workspacePath, '.changelog.backup.md');

            if (!fs.existsSync(this.changelogPath)) {
                await this.createChangelogFile();
            }
            
            // 验证文件内容格式
            await this.validateChangelogFormat();
        } catch (error) {
            throw new ChangelogError(`初始化更新日志失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    private async validateChangelogFormat() {
        const content = await fs.promises.readFile(this.changelogPath, 'utf8');
        if (!content.includes(this.SECTIONS.UNRELEASED)) {
            throw new ChangelogError('更新日志格式无效：缺少未发布部分');
        }
    }

    private async createChangelogFile() {
        const initialContent = `# 更新日志\n\n${this.SECTIONS.UNRELEASED}\n${this.SECTIONS.FEATURES}\n\n${this.SECTIONS.BUGFIXES}\n`;
        await fs.promises.writeFile(this.changelogPath, initialContent, 'utf8');
    }

    private async backupChangelog() {
        const content = await fs.promises.readFile(this.changelogPath, 'utf8');
        await fs.promises.writeFile(this.backupPath, content, 'utf8');
    }

    private async getCurrentUser(): Promise<string> {
        try {
            const gitUser = await new Promise<string>((resolve, reject) => {
                cp.exec('git config user.name', (error, stdout) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(stdout.trim());
                });
            });
            return gitUser || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    private validateVersion(version: string): boolean {
        const versionRegex = /^\d+\.\d+\.\d+$/;
        return versionRegex.test(version);
    }

    public async addFeature(description: string, author?: string) {
        try {
            await this.backupChangelog();
            const user = author || await this.getCurrentUser();
            const content = await fs.promises.readFile(this.changelogPath, 'utf8');
            const lines = content.split('\n');
            
            let featureIndex = lines.findIndex((line: string) => line.includes(this.SECTIONS.FEATURES));
            if (featureIndex !== -1) {
                const formattedDescription = description.trim();
                lines.splice(featureIndex + 1, 0, `- ${formattedDescription} (@${user})`);
                await fs.promises.writeFile(this.changelogPath, lines.join('\n'), 'utf8');
            } else {
                throw new ChangelogError('未找到新功能标记位置');
            }
        } catch (error: any) {
            throw new ChangelogError(`添加功能记录失败: ${error.message}`);
        }
    }

    public async addBugfix(description: string, author?: string) {
        try {
            await this.backupChangelog();
            const user = author || await this.getCurrentUser();
            const content = await fs.promises.readFile(this.changelogPath, 'utf8');
            const lines = content.split('\n');
            
            let bugfixIndex = lines.findIndex((line: string) => line.includes(this.SECTIONS.BUGFIXES));
            if (bugfixIndex !== -1) {
                const formattedDescription = description.trim();
                lines.splice(bugfixIndex + 1, 0, `- ${formattedDescription} (@${user})`);
                await fs.promises.writeFile(this.changelogPath, lines.join('\n'), 'utf8');
            } else {
                throw new ChangelogError('未找到Bug修复标记位置');
            }
        } catch (error: any) {
            throw new ChangelogError(`添加Bug修复记录失败: ${error.message}`);
        }
    }

    public async createNewVersion(version: string) {
        try {
            if (!this.validateVersion(version)) {
                throw new ChangelogError('版本号格式无效，请使用 x.y.z 格式');
            }

            await this.backupChangelog();
            const content = await fs.promises.readFile(this.changelogPath, 'utf8');
            const date = new Date().toISOString().split('T')[0];
            const newVersionHeader = `\n## [v${version}] - ${date}\n`;
            
            const unreleasedRegex = new RegExp(`${this.SECTIONS.UNRELEASED}\\n([\\s\\S]*?)(?=\\n## |$)`);
            const match = content.match(unreleasedRegex);
            
            if (match) {
                const unreleasedContent = match[1];
                if (!unreleasedContent.trim()) {
                    throw new ChangelogError('未发布区域没有内容，无法创建新版本');
                }
                
                const newContent = content.replace(unreleasedRegex, 
                    `${this.SECTIONS.UNRELEASED}\n${this.SECTIONS.FEATURES}\n\n${this.SECTIONS.BUGFIXES}\n${newVersionHeader}${unreleasedContent}`);
                
                await fs.promises.writeFile(this.changelogPath, newContent, 'utf8');
            } else {
                throw new ChangelogError('未找到未发布内容区域');
            }
        } catch (error: any) {
            throw new ChangelogError(`创建新版本失败: ${error.message}`);
        }
    }
} 