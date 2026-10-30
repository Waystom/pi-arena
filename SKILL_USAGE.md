# Pi Arena Skill 使用说明

Pi Arena 把一次普通的 Pi 编程任务变成一场可复现的 Agent 比赛：每个选手从同一份项目副本开始，接受相同任务，最后由评测程序检查结果，并生成一个可以在浏览器中播放的回放页面。

## 1. 安装

需要 Node.js 22 或更高版本。安装本地 Pi 包：

```bash
source "$HOME/.nvm/nvm.sh"
pi install /home/wei/Documents/Codex/2026-10-30/files-pasted-by-the-user-base/outputs/pi-arena
```

在 Pi 中输入 `/arena` 可以查看扩展提示，输入 `/skill:arena` 可以显式加载公平比赛规则。

## 2. 先运行不需要 API 的演示

```bash
cd /home/wei/Documents/Codex/2026-10-30/files-pasted-by-the-user-base/outputs/pi-arena
npm test
npm run demo
xdg-open arena-demo/index.html
```

演示包含三个本地确定性选手，因此不会消耗 API 额度。点击 **Replay race** 后可以观看赛道动画，选择选手查看操作时间线，点击某一步查看它的操作和测试结果。

## 3. 用真实 Pi 和 DeepSeek 比赛

先确认 Pi 可以单独使用 DeepSeek：

```bash
export DEEPSEEK_API_KEY="你的 DeepSeek API Key"
pi --model deepseek/deepseek-flash
```

退出 Pi 后，准备任务文件 `task.md`：

```markdown
修复当前项目中的价格计算逻辑。

要求：
1. 满 100 元才打九折；
2. 低于 100 元保持原价；
3. 负数金额必须报错；
4. 不要修改测试文件。
```

再准备一个评测模块 `evaluation.mjs`。它必须导出 `evaluate({ workspace, task })`，并返回 `score`、`passed`、`total` 和 `checks`：

```javascript
import { pathToFileURL } from "node:url";

export async function evaluate({ workspace }) {
  const url = pathToFileURL(`${workspace}/src/pricing.js`).href + `?run=${Date.now()}`;
  const { finalPrice } = await import(url);
  const checks = [
    { name: "100 元打九折", pass: finalPrice(100) === 90 },
    { name: "99 元不打折", pass: finalPrice(99) === 99 },
    { name: "0 元保持为 0", pass: finalPrice(0) === 0 },
  ];
  const passed = checks.filter((item) => item.pass).length;
  return { checks, passed, total: checks.length, score: passed / checks.length };
}
```

运行一位选手：

```bash
pi-arena run \
  --workspace /home/wei/your-project \
  --task /home/wei/task.md \
  --evaluation /home/wei/evaluation.mjs \
  --models deepseek/deepseek-flash \
  --output /home/wei/arena.json \
  --html /home/wei/arena.html
```

比较多个模型：

```bash
pi-arena run \
  --workspace /home/wei/your-project \
  --task /home/wei/task.md \
  --evaluation /home/wei/evaluation.mjs \
  --models deepseek/deepseek-flash,deepseek/deepseek-v4-pro
```

当前 Pi 进程通过 JSONL RPC 启动。每位选手在临时独立目录中运行，API Key 由自己的 Pi 配置读取，不会写进报告。

## 4. 如何阅读结果

`arena.json` 是机器可读报告，`arena.html` 是可分享的浏览器回放。

当前原型评分为：

- **70% 正确性**：评测模块通过的检查比例；
- **20% 效率**：记录到的动作数量；
- **10% 范围控制**：修改测试文件会失去这部分分数。

测试是硬证据，模型生成的评价只能作为补充。评测文件、任务描述和起始代码版本应一起保存，才能让不同比赛真正可比较。

## 5. 适合的评测任务

优先选择有明确验收标准的任务，例如：修复一个 Bug、实现一个小函数、补齐 API 行为、修复类型错误或完成一个数据转换。不要用“代码看起来更漂亮”作为唯一评测标准。

## 6. 当前边界

第一版使用临时目录复制来隔离选手，Git worktree、盲审匿名化、LLM 评委和 GitHub Action 属于后续版本。运行真实项目时，请先确认工作区没有不想被复制或读取的密钥文件，并为 Agent 设置适合的工具权限。
