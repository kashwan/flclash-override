// FLClash 配置覆写脚本
// 用法：FLClash -> 配置 -> 当前配置 -> 扩展 -> 扩展脚本 -> 导入本文件
// 作用：替换 DNS、嗅探、规则集、策略组和分流规则，实现：
//   1. 防 DNS 泄露（国外域名经代理节点查 DNS）
//   2. Fake-IP + 域名嗅探
//   3. 国内外分流、AI / 流媒体 / Telegram 分流
//   4. 广告域名与广告 IP 拦截

const GROUP = {
  auto: '⚡ 自动选择',
  select: '🛰 自选节点',
  ai: '🤖 AI 分流',
  media: '🎬 流媒体',
  telegram: '📲 电报',
  adblock: '🛑 广告',
};

const TEST_URL = 'https://www.gstatic.com/generate_204';
const PROVIDER_BASE =
  'https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/';

const makeProvider = (path, behavior) => ({
  type: 'http',
  behavior,
  format: 'mrs',
  interval: 86400,
  proxy: GROUP.select,
  url: PROVIDER_BASE + path,
});

const ruleProviders = {
  private_domain: makeProvider('geosite/private.mrs', 'domain'),
  cn_domain: makeProvider('geosite/cn.mrs', 'domain'),
  ads_domain: makeProvider('geosite/category-ads-all.mrs', 'domain'),
  ads_ip: makeProvider('geoip/ad.mrs', 'ipcidr'),
  ai_domain: makeProvider('geosite/category-ai-!cn.mrs', 'domain'),
  youtube_domain: makeProvider('geosite/youtube.mrs', 'domain'),
  netflix_domain: makeProvider('geosite/netflix.mrs', 'domain'),
  tiktok_domain: makeProvider('geosite/tiktok.mrs', 'domain'),
  telegram_domain: makeProvider('geosite/telegram.mrs', 'domain'),
  private_ip: makeProvider('geoip/private.mrs', 'ipcidr'),
  cn_ip: makeProvider('geoip/cn.mrs', 'ipcidr'),
  telegram_ip: makeProvider('geoip/telegram.mrs', 'ipcidr'),
  netflix_ip: makeProvider('geoip/netflix.mrs', 'ipcidr'),
};

const dns = {
  enable: true,
  'prefer-h3': false,
  ipv6: false,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.0/16',
  'fake-ip-filter-mode': 'blacklist',
  'fake-ip-filter': [
    '+.lan',
    '+.local',
    '+.localhost',
    '+.home.arpa',
    'localhost.ptlogin2.qq.com',
    'time.*.com',
    'time.*.gov',
    'ntp.*.com',
    'pool.ntp.org',
    '+.push.apple.com',
    'mesu.apple.com',
    'swscan.apple.com',
    'captive.apple.com',
    'connectivitycheck.gstatic.com',
    'connectivitycheck.android.com',
    'www.msftconnecttest.com',
    'www.msftncsi.com',
    'rule-set:private_domain',
    'rule-set:cn_domain',
  ],
  'default-nameserver': ['223.5.5.5', '119.29.29.29'],
  'proxy-server-nameserver': [
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ],
  'direct-nameserver': [
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ],
  'nameserver-policy': {
    'rule-set:cn_domain,private_domain': [
      'https://dns.alidns.com/dns-query',
      'https://doh.pub/dns-query',
    ],
  },
  nameserver: [
    `https://8.8.8.8/dns-query#${GROUP.select}`,
    `https://1.1.1.1/dns-query#${GROUP.select}`,
  ],
  fallback: [
    `https://8.8.8.8/dns-query#${GROUP.select}`,
    `https://1.1.1.1/dns-query#${GROUP.select}`,
  ],
};

const sniffer = {
  enable: true,
  'force-dns-mapping': true,
  'parse-pure-ip': true,
  'override-destination': true,
  sniff: {
    HTTP: { ports: [80, '8080-8880'] },
    TLS: { ports: [443, 8443] },
    QUIC: { ports: [443, 8443] },
  },
  'skip-domain': ['+.push.apple.com'],
};

const proxyGroups = [
  {
    name: GROUP.auto,
    type: 'url-test',
    'include-all': true,
    url: TEST_URL,
    interval: 300,
    timeout: 5000,
    tolerance: 50,
    lazy: true,
    'max-failed-times': 3,
    'expected-status': 204,
  },
  {
    name: GROUP.select,
    type: 'select',
    'include-all': true,
    proxies: [GROUP.auto, 'DIRECT'],
  },
  {
    name: GROUP.ai,
    type: 'select',
    'include-all': true,
    proxies: [GROUP.select],
  },
  {
    name: GROUP.media,
    type: 'select',
    'include-all': true,
    proxies: [GROUP.select],
  },
  {
    name: GROUP.telegram,
    type: 'select',
    'include-all': true,
    proxies: [GROUP.select],
  },
  {
    name: GROUP.adblock,
    type: 'select',
    proxies: ['REJECT', 'DIRECT'],
  },
];

const rules = [
  'RULE-SET,private_domain,DIRECT',
  'RULE-SET,private_ip,DIRECT,no-resolve',
  `RULE-SET,ads_domain,${GROUP.adblock}`,
  `RULE-SET,ads_ip,${GROUP.adblock},no-resolve`,
  `RULE-SET,ai_domain,${GROUP.ai}`,
  `RULE-SET,youtube_domain,${GROUP.media}`,
  `RULE-SET,netflix_domain,${GROUP.media}`,
  `RULE-SET,tiktok_domain,${GROUP.media}`,
  `RULE-SET,telegram_domain,${GROUP.telegram}`,
  `RULE-SET,telegram_ip,${GROUP.telegram},no-resolve`,
  `RULE-SET,netflix_ip,${GROUP.media},no-resolve`,
  'RULE-SET,cn_domain,DIRECT',
  'RULE-SET,cn_ip,DIRECT,no-resolve',
  `MATCH,${GROUP.select}`,
];

const main = (config) => {
  if (!config || typeof config !== 'object') {
    throw new Error('profile is not an object');
  }

  const oldDns = config.dns && typeof config.dns === 'object' ? config.dns : {};
  const oldRuleProviders =
    config['rule-providers'] && typeof config['rule-providers'] === 'object'
      ? config['rule-providers']
      : {};

  return {
    ...config,
    dns: {
      ...oldDns,
      ...dns,
      'nameserver-policy': {
        ...(oldDns['nameserver-policy'] || {}),
        ...dns['nameserver-policy'],
      },
    },
    sniffer,
    'rule-providers': {
      ...oldRuleProviders,
      ...ruleProviders,
    },
    'proxy-groups': proxyGroups,
    rules,
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { main };
}
