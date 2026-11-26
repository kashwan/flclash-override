# flclash-override

适配 [FLClash](https://github.com/chen08209/FlClash) 的配置扩展脚本，从
[`clash-verge-rev-override`](https://github.com/kashwan/clash-verge-rev-override)
迁移而来。它是脚本，不是订阅链接；订阅更新后会自动重新应用到该配置。

功能：防 DNS 泄露、Fake-IP、域名嗅探、国内外分流、AI / 流媒体 / Telegram 分流、广告拦截。

## 使用方法

1. 打开 FLClash，进入 `配置`，选择要套用的订阅配置。
2. 进入该配置的 `扩展` → `扩展脚本`，选择 `前往配置脚本`。
3. 新增脚本并导入 `flclash-override.js`，或直接粘贴全部内容；保存后返回选择它。
4. 回到配置页，切换一次配置或手动重载，脚本结果才会生效。

## 使用前提

FLClash 的应用级 DNS 覆写优先级高于脚本生成的配置，因此不要重复添加冲突项：

- `配置` → `覆写` → `DNS`：不要添加 `Nameserver`、`Fake-IP 范围`、`Nameserver Policy` 等项，保持为空。
- 当前配置自己的 DNS 设置：同样保持默认，不要另设 DNS 或 Fake-IP。
- `配置` → `覆写` → 常规/核心：建议关闭 `IPv6`，避免出现 IPv6 出口。

## 验证

脚本生效后，在连接/日志里确认：

- 国外域名解析为 `198.18.x.x`，`baidu.com`、`time.windows.com` 等返回真实 IP。
- `nameserver` 包含 `https://8.8.8.8/dns-query#🛰 自选节点`。
- 打开 `ipleak.net`、`dnsleaktest.com`，确认没有出现本地运营商 DNS。

## 策略组与规则

脚本会整体替换订阅自带的 `proxy-groups` 和 `rules`，节点通过 `include-all`
自动吸收，不写死节点名。规则顺序：私有地址 → 广告 → AI → 流媒体 → Telegram →
国内域名/IP → `MATCH` 走 `🛰 自选节点`。

## 说明

- 规则集来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)。
- 规则集默认通过 `🛰 自选节点` 下载；若 GitHub 下载失败，请先确认已选中可用节点。
- 原始 YAML 覆写版见 [clash-verge-rev-override](https://github.com/kashwan/clash-verge-rev-override)。
