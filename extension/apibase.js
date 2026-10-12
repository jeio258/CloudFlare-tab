// 离线壳的接口基址。页面运行在 chrome-extension:// 下，相对路径 /api 会指向扩展自身，
// 因此由本脚本在应用加载前把基址指向线上部署域名（api/client.ts 读取该全局变量）。
// 换域名只改这一行，然后在 chrome://extensions 重新加载扩展即可，无需重新构建。
globalThis.__GOTAB_API_BASE__ = 'https://vab.994613.xyz';
