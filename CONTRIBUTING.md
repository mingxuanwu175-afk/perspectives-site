# 怎么一起改这个网站

## 本地跑起来

需要 Node.js 20 或更新版本。

```
git clone https://github.com/mingxuanwu175-afk/perspectives-site.git
cd perspectives-site
node dev/server.mjs
```

打开 http://127.0.0.1:8765 。

- 页面、报名、加入表单、后台（`#/admin`，密码 `local`）在本地都能用。
- 本地用的是内存里的测试数据库（`dev/mock-redis.js`），关掉服务器就清空，碰不到真实数据。
- `api/` 里用到新的数据库命令时，在 `dev/mock-redis.js` 里补上。
- 只看页面的话，`python serve.py` 也可以，但它不跑 `api/`。

## 改动怎么上线

1. 每件事新开一个分支：`git checkout -b 分支名`
2. 改好、本地测过后推上去：`git push -u origin 分支名`
3. 在 GitHub 上开 Pull Request，写清楚改了什么、为什么改。
4. Steve 批准（Approve）并点 Merge 以后，Vercel 自动把 `main` 发布到 https://perspectives-xwa.vercel.app 。

`main` 已锁：只能通过 Pull Request 合并，并且要 Steve 批准。`main` 上的每一次提交都会直接上线。

## 不碰的东西

- 真实数据库和后台密码只在 Vercel 的正式环境里，仓库里没有，也不要往仓库里写任何钥匙或密码。
- `.env*` 文件不提交（`.gitignore` 已经排除）。
- 预览部署（分支和 Pull Request 的预览网址）不连数据库，报名和后台在那里会报"数据库未连接"，这是正常的。要测这些功能请用本地服务器。
- 网站上不放学生的私人信息。

## 内容在哪改

见 `README.md`：活动和赛程在 `js/data.js`，界面文字在 `js/strings.js`（四种语言一起改）。
