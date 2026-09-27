const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = join(__dirname, '..');
const source = readFileSync(join(root, 'archivo.js'), 'utf8');
const languages = ['es', 'en', 'de', 'fi', 'fr', 'it', 'ja', 'zh'];
for (const language of languages) {
    const nodes = new Map();
    const handlers = {};
    const parent = {postMessage() {}};
    const context = vm.createContext({
        navigator: {languages: [language]},
        document: {
            documentElement: {},
            getElementById(id) {
                if (!nodes.has(id)) nodes.set(id, {textContent: '', addEventListener() {}});
                return nodes.get(id);
            }
        },
        window: {
            parent, location: {origin: 'https://radio.test'},
            addEventListener(type, handler) {handlers[type] = handler;}
        }
    });
    // Exercise the actual message listener without starting catalog network requests.
    vm.runInContext(source.replace(/\ncargarCatalogo\(\);\s*$/, '\n'), context);
    const translations = vm.runInContext('copia', context);
    for (const key of ['listen', 'pause', 'resume', 'restart', 'loading', 'empty', 'error']) {
        assert.equal(typeof translations[key], 'string', `${language}: ${key}`);
        assert.ok(translations[key].trim(), `${language}: empty ${key}`);
    }
    const status = nodes.get('archive-status');
    status.textContent = 'unchanged';
    handlers.message({origin: 'https://other.test', source: parent, data: {type: 'ugju-archive-error'}});
    assert.equal(status.textContent, 'unchanged');
    handlers.message({origin: 'https://radio.test', source: parent, data: {type: 'ugju-archive-error'}});
    assert.equal(status.textContent, translations.error);
    const main = JSON.parse(readFileSync(join(root, 'lang', `${language}.json`), 'utf8'));
    for (const key of ['live_play', 'live_pause', 'live_go', 'live_return', 'live_on_air', 'live_in_clouds', 'live_reconnecting', 'live_connecting', 'archive', 'archive_playing', 'archive_pause', 'archive_resume']) {
        assert.ok(typeof main[key] === 'string' && main[key].trim(), `${language}: ${key}`);
    }
}
console.log(`Archive error rendering and LIVE/ARCHIVE translation coverage passed: ${languages.join(', ')}`);
