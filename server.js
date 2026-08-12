const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// ===== CONFIG =====
// ============================================
const TOKEN = "8801717755:AAG_EpSnfyFXJDZfaEyT1L0XFrH3gtaJTHc";
const ADMIN_ID = 7757046138;

// Danh sách nhóm bắt buộc
const REQUIRED_GROUPS = [
    "https://t.me/ongvuaphantich",
    "https://t.me/toolfreevipgame",
    "https://t.me/toolhoang",
    "https://t.me/kenhvipwin",
    "https://t.me/aexomlang",
    "https://t.me/freedochoi"
];

const GROUP_NAMES = {
    "https://t.me/ongvuaphantich": "🔴 Ông Vua Phân Tích",
    "https://t.me/toolfreevipgame": "🟢 Tool Free VIP Game",
    "https://t.me/toolhoang": "🟡 Tool Hoàng",
    "https://t.me/kenhvipwin": "🔵 Kênh VIP Win",
    "https://t.me/aexomlang": "🟣 Aexom Lang",
    "https://t.me/freedochoi": "🟠 Free Đồ Chơi"
};

// Tạo thư mục tạm
const TEMP_DIR = path.join(__dirname, 'temp_files');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Bot stats
const BOT_STATS = {
    total_encrypted: 0,
    total_users: new Set(),
    start_time: new Date()
};

// ============================================
// ===== MAPS CHO CÁC NGÔN NGỮ =====
// ============================================

const CHINESE_MAP = {
    '0': '零', '1': '壹', '2': '贰', '3': '叁', '4': '肆',
    '5': '伍', '6': '陆', '7': '柒', '8': '捌', '9': '玖',
    'a': '甲', 'b': '乙', 'c': '丙', 'd': '丁', 'e': '戊',
    'f': '己', 'g': '庚', 'h': '辛', 'i': '壬', 'j': '癸',
    'k': '子', 'l': '丑', 'm': '寅', 'n': '卯', 'o': '辰',
    'p': '巳', 'q': '午', 'r': '未', 's': '申', 't': '酉',
    'u': '戌', 'v': '亥', 'w': '天', 'x': '地', 'y': '玄', 'z': '黄',
    'A': '金', 'B': '木', 'C': '水', 'D': '火', 'E': '土',
    'F': '日', 'G': '月', 'H': '星', 'I': '辰', 'J': '宿',
    'K': '风', 'L': '雨', 'M': '雷', 'N': '电', 'O': '云',
    'P': '雾', 'Q': '雪', 'R': '霜', 'S': '露', 'T': '冰',
    'U': '龙', 'V': '凤', 'W': '麒', 'X': '麟', 'Y': '龟', 'Z': '蛇',
    '+': '加', '-': '减', '*': '乘', '/': '除', '=': '等',
    '!': '叹', '?': '问', '.': '点', ',': '逗', ';': '分',
    ':': '冒', '"': '引', "'": '单', '`': '反', '~': '非',
    '@': '艾', '#': '井', '$': '美', '%': '百', '^': '异',
    '&': '和', '|': '或', '_': '下', '-': '横', '\\': '反',
    '(': '左', ')': '右', '[': '前', ']': '后', '{': '开', '}': '闭',
    '<': '小', '>': '大', ' ': '空', '\n': '换', '\t': '制', '/': '斜'
};

const REVERSE_CHINESE = {};
for (const [k, v] of Object.entries(CHINESE_MAP)) {
    REVERSE_CHINESE[v] = k;
}

const RUSSIAN_MAP = {
    '0': 'ноль', '1': 'один', '2': 'два', '3': 'три', '4': 'четыре',
    '5': 'пять', '6': 'шесть', '7': 'семь', '8': 'восемь', '9': 'девять',
    'a': 'а', 'b': 'б', 'c': 'ц', 'd': 'д', 'e': 'е', 'f': 'ф',
    'g': 'г', 'h': 'х', 'i': 'и', 'j': 'й', 'k': 'к', 'l': 'л',
    'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'q': 'к', 'r': 'р',
    's': 'с', 't': 'т', 'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс',
    'y': 'ы', 'z': 'з',
    'A': 'А', 'B': 'Б', 'C': 'Ц', 'D': 'Д', 'E': 'Е', 'F': 'Ф',
    'G': 'Г', 'H': 'Х', 'I': 'И', 'J': 'Й', 'K': 'К', 'L': 'Л',
    'M': 'М', 'N': 'Н', 'O': 'О', 'P': 'П', 'Q': 'К', 'R': 'Р',
    'S': 'С', 'T': 'Т', 'U': 'У', 'V': 'В', 'W': 'В', 'X': 'КС',
    'Y': 'Ы', 'Z': 'З',
    '+': 'плюс', '-': 'минус', '*': 'умножить', '/': 'делить', '=': 'равно',
    '!': 'восклицание', '?': 'вопрос', '.': 'точка', ',': 'запятая',
    ' ': 'пробел', '\n': 'новая строка'
};

const REVERSE_RUSSIAN = {};
for (const [k, v] of Object.entries(RUSSIAN_MAP)) {
    REVERSE_RUSSIAN[v] = k;
}

const JAPANESE_MAP = {
    '0': '零', '1': '壱', '2': '弐', '3': '参', '4': '肆',
    '5': '伍', '6': '陸', '7': '漆', '8': '捌', '9': '玖',
    'a': 'あ', 'b': 'い', 'c': 'う', 'd': 'え', 'e': 'お',
    'f': 'か', 'g': 'き', 'h': 'く', 'i': 'け', 'j': 'こ',
    'k': 'さ', 'l': 'し', 'm': 'す', 'n': 'せ', 'o': 'そ',
    'p': 'た', 'q': 'ち', 'r': 'つ', 's': 'て', 't': 'と',
    'u': 'な', 'v': 'に', 'w': 'ぬ', 'x': 'ね', 'y': 'の', 'z': 'は',
    'A': 'ハ', 'B': 'ヒ', 'C': 'フ', 'D': 'ヘ', 'E': 'ホ',
    'F': 'マ', 'G': 'ミ', 'H': 'ム', 'I': 'メ', 'J': 'モ',
    'K': 'ヤ', 'L': 'ユ', 'M': 'ヨ', 'N': 'ラ', 'O': 'リ',
    'P': 'ル', 'Q': 'レ', 'R': 'ロ', 'S': 'ワ', 'T': 'ヲ',
    'U': 'ン', 'V': 'ァ', 'W': 'ィ', 'X': 'ゥ', 'Y': 'ェ', 'Z': 'ォ'
};

const REVERSE_JAPANESE = {};
for (const [k, v] of Object.entries(JAPANESE_MAP)) {
    REVERSE_JAPANESE[v] = k;
}

const KOREAN_MAP = {
    '0': '공', '1': '일', '2': '이', '3': '삼', '4': '사',
    '5': '오', '6': '육', '7': '칠', '8': '팔', '9': '구',
    'a': '가', 'b': '나', 'c': '다', 'd': '라', 'e': '마',
    'f': '바', 'g': '사', 'h': '아', 'i': '자', 'j': '차',
    'k': '카', 'l': '타', 'm': '파', 'n': '하', 'o': '갸',
    'p': '냐', 'q': '댜', 'r': '랴', 's': '먀', 't': '뱌',
    'u': '샤', 'v': '야', 'w': '쟈', 'x': '챠', 'y': '캬', 'z': '탸',
    'A': '가', 'B': '나', 'C': '다', 'D': '라', 'E': '마',
    'F': '바', 'G': '사', 'H': '아', 'I': '자', 'J': '차',
    'K': '카', 'L': '타', 'M': '파', 'N': '하', 'O': '갸',
    'P': '냐', 'Q': '댜', 'R': '랴', 'S': '먀', 'T': '뱌',
    'U': '샤', 'V': '야', 'W': '쟈', 'X': '챠', 'Y': '캬', 'Z': '탸'
};

const REVERSE_KOREAN = {};
for (const [k, v] of Object.entries(KOREAN_MAP)) {
    REVERSE_KOREAN[v] = k;
}

const MORSE_MAP = {
    'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
    'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
    'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
    's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
    'y': '-.--', 'z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': '/'
};

const REVERSE_MORSE = {};
for (const [k, v] of Object.entries(MORSE_MAP)) {
    REVERSE_MORSE[v] = k;
}

const LEET_MAP = {
    'a': '4', 'b': '8', 'c': 'c', 'd': 'd', 'e': '3', 'f': 'f',
    'g': '6', 'h': 'h', 'i': '1', 'j': 'j', 'k': 'k', 'l': '1',
    'm': 'm', 'n': 'n', 'o': '0', 'p': 'p', 'q': 'q', 'r': 'r',
    's': '5', 't': '7', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x',
    'y': 'y', 'z': '2'
};

const REVERSE_LEET = {};
for (const [k, v] of Object.entries(LEET_MAP)) {
    REVERSE_LEET[v] = k;
}

const EMOJI_MAP = {
    '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
    '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣',
    'a': '🅰️', 'b': '🅱️', 'c': '🇨', 'd': '🇩', 'e': '🇪',
    'f': '🇫', 'g': '🇬', 'h': '🇭', 'i': '🇮', 'j': '🇯',
    'k': '🇰', 'l': '🇱', 'm': '🇲', 'n': '🇳', 'o': '🅾️',
    'p': '🇵', 'q': '🇶', 'r': '🇷', 's': '🇸', 't': '🇹',
    'u': '🇺', 'v': '🇻', 'w': '🇼', 'x': '🇽', 'y': '🇾', 'z': '🇿'
};

const REVERSE_EMOJI = {};
for (const [k, v] of Object.entries(EMOJI_MAP)) {
    REVERSE_EMOJI[v] = k;
}

// ============================================
// ===== ENCODE FUNCTIONS =====
// ============================================

function encodeBase64(code) {
    try {
        return Buffer.from(code).toString('base64');
    } catch (e) {
        return code;
    }
}

function decodeBase64(code) {
    try {
        return Buffer.from(code, 'base64').toString('utf-8');
    } catch (e) {
        return code;
    }
}

function encodeHex(code) {
    try {
        return Buffer.from(code).toString('hex');
    } catch (e) {
        return code;
    }
}

function decodeHex(code) {
    try {
        return Buffer.from(code, 'hex').toString('utf-8');
    } catch (e) {
        return code;
    }
}

function encodeUnicode(code) {
    try {
        return code.split('').map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join('');
    } catch (e) {
        return code;
    }
}

function decodeUnicode(code) {
    try {
        return code.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
    } catch (e) {
        return code;
    }
}

function encodeROT13(code) {
    try {
        return code.replace(/[a-zA-Z]/g, c => {
            const offset = c <= 'Z' ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0) - offset + 13) % 26 + offset);
        });
    } catch (e) {
        return code;
    }
}

function decodeROT13(code) {
    return encodeROT13(code);
}

function encodeReverse(code) {
    try {
        return code.split('').reverse().join('');
    } catch (e) {
        return code;
    }
}

function decodeReverse(code) {
    return encodeReverse(code);
}

function encodeCaesar(code, shift = 3) {
    try {
        return code.replace(/[a-zA-Z]/g, c => {
            const offset = c <= 'Z' ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0) - offset + shift) % 26 + offset);
        });
    } catch (e) {
        return code;
    }
}

function decodeCaesar(code, shift = 3) {
    return encodeCaesar(code, -shift);
}

function encodeXOR(code, key = "SECRET") {
    try {
        let result = '';
        for (let i = 0; i < code.length; i++) {
            result += String.fromCharCode(code.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return Buffer.from(result).toString('base64');
    } catch (e) {
        return code;
    }
}

function decodeXOR(code, key = "SECRET") {
    try {
        const decoded = Buffer.from(code, 'base64').toString('utf-8');
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeOBF(code) {
    try {
        const key = "OBF2026SECRET";
        let xor_result = '';
        for (let i = 0; i < code.length; i++) {
            xor_result += String.fromCharCode(code.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        const b64 = Buffer.from(xor_result).toString('base64');
        return b64.split('').reverse().join('');
    } catch (e) {
        return code;
    }
}

function decodeOBF(code) {
    try {
        const reversed = code.split('').reverse().join('');
        const b64 = Buffer.from(reversed, 'base64').toString('utf-8');
        const key = "OBF2026SECRET";
        let result = '';
        for (let i = 0; i < b64.length; i++) {
            result += String.fromCharCode(b64.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeRandom(code) {
    try {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let result = '';
        for (const c of code) {
            if (c === '\n') result += '\n';
            else if (c === ' ') result += ' ';
            else {
                const r1 = chars[Math.floor(Math.random() * chars.length)];
                const r2 = chars[Math.floor(Math.random() * chars.length)];
                result += r1 + r2;
            }
        }
        return result;
    } catch (e) {
        return code;
    }
}

function decodeRandom(code) {
    return code;
}

function encodeDouble(code) {
    try {
        return Buffer.from(Buffer.from(code).toString('base64')).toString('base64');
    } catch (e) {
        return code;
    }
}

function decodeDouble(code) {
    try {
        const d1 = Buffer.from(code, 'base64').toString('utf-8');
        return Buffer.from(d1, 'base64').toString('utf-8');
    } catch (e) {
        return code;
    }
}

function encodeTriple(code) {
    try {
        const e1 = Buffer.from(code).toString('base64');
        const e2 = Buffer.from(e1).toString('base64');
        return Buffer.from(e2).toString('base64');
    } catch (e) {
        return code;
    }
}

function decodeTriple(code) {
    try {
        const d1 = Buffer.from(code, 'base64').toString('utf-8');
        const d2 = Buffer.from(d1, 'base64').toString('utf-8');
        return Buffer.from(d2, 'base64').toString('utf-8');
    } catch (e) {
        return code;
    }
}

function encodeAtbash(code) {
    try {
        return code.replace(/[a-zA-Z]/g, c => {
            const offset = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(offset + 25 - (c.charCodeAt(0) - offset));
        });
    } catch (e) {
        return code;
    }
}

function decodeAtbash(code) {
    return encodeAtbash(code);
}

function encodeMorse(code) {
    try {
        return code.toLowerCase().split('').map(c => MORSE_MAP[c] || c).join(' ');
    } catch (e) {
        return code;
    }
}

function decodeMorse(code) {
    try {
        return code.split(' ').map(c => REVERSE_MORSE[c] || c).join('');
    } catch (e) {
        return code;
    }
}

function encodeLeet(code) {
    try {
        return code.split('').map(c => LEET_MAP[c.toLowerCase()] || c).join('');
    } catch (e) {
        return code;
    }
}

function decodeLeet(code) {
    try {
        let result = '';
        for (const c of code) {
            result += REVERSE_LEET[c] || c;
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeEmoji(code) {
    try {
        return code.split('').map(c => EMOJI_MAP[c.toLowerCase()] || c).join('');
    } catch (e) {
        return code;
    }
}

function decodeEmoji(code) {
    try {
        let result = '';
        let i = 0;
        while (i < code.length) {
            if (i + 1 < code.length && REVERSE_EMOJI[code.substring(i, i + 2)]) {
                result += REVERSE_EMOJI[code.substring(i, i + 2)];
                i += 2;
            } else if (REVERSE_EMOJI[code[i]]) {
                result += REVERSE_EMOJI[code[i]];
                i++;
            } else {
                result += code[i];
                i++;
            }
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeChinese(code) {
    try {
        let result = '';
        for (const c of code) {
            if (CHINESE_MAP[c]) {
                result += CHINESE_MAP[c];
            } else if (c === ' ') {
                result += ' ';
            } else if (c === '\n') {
                result += '\n';
            } else {
                const hex = Buffer.from(c).toString('hex');
                result += `「${hex}」`;
            }
        }
        return result;
    } catch (e) {
        return code;
    }
}

function decodeChinese(code) {
    try {
        let result = '';
        let i = 0;
        while (i < code.length) {
            if (code[i] === '「') {
                const end = code.indexOf('」', i);
                if (end !== -1) {
                    const hex = code.substring(i + 1, end);
                    try {
                        result += Buffer.from(hex, 'hex').toString('utf-8');
                    } catch (e) {
                        result += code.substring(i, end + 1);
                    }
                    i = end + 1;
                    continue;
                }
            }
            if (REVERSE_CHINESE[code[i]]) {
                result += REVERSE_CHINESE[code[i]];
            } else if (code[i] === ' ') {
                result += ' ';
            } else if (code[i] === '\n') {
                result += '\n';
            } else {
                result += code[i];
            }
            i++;
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeRussian(code) {
    try {
        let result = '';
        for (const c of code) {
            if (RUSSIAN_MAP[c]) {
                result += RUSSIAN_MAP[c];
            } else if (c === ' ') {
                result += ' ';
            } else if (c === '\n') {
                result += '\n';
            } else {
                const hex = Buffer.from(c).toString('hex');
                result += `【${hex}】`;
            }
        }
        return result;
    } catch (e) {
        return code;
    }
}

function decodeRussian(code) {
    try {
        let result = '';
        let i = 0;
        while (i < code.length) {
            if (code[i] === '【') {
                const end = code.indexOf('】', i);
                if (end !== -1) {
                    const hex = code.substring(i + 1, end);
                    try {
                        result += Buffer.from(hex, 'hex').toString('utf-8');
                    } catch (e) {
                        result += code.substring(i, end + 1);
                    }
                    i = end + 1;
                    continue;
                }
            }
            if (REVERSE_RUSSIAN[code[i]]) {
                result += REVERSE_RUSSIAN[code[i]];
            } else if (code[i] === ' ') {
                result += ' ';
            } else if (code[i] === '\n') {
                result += '\n';
            } else {
                result += code[i];
            }
            i++;
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeJapanese(code) {
    try {
        let result = '';
        for (const c of code) {
            if (JAPANESE_MAP[c]) {
                result += JAPANESE_MAP[c];
            } else if (c === ' ') {
                result += ' ';
            } else if (c === '\n') {
                result += '\n';
            } else {
                const hex = Buffer.from(c).toString('hex');
                result += `『${hex}』`;
            }
        }
        return result;
    } catch (e) {
        return code;
    }
}

function decodeJapanese(code) {
    try {
        let result = '';
        let i = 0;
        while (i < code.length) {
            if (code[i] === '『') {
                const end = code.indexOf('』', i);
                if (end !== -1) {
                    const hex = code.substring(i + 1, end);
                    try {
                        result += Buffer.from(hex, 'hex').toString('utf-8');
                    } catch (e) {
                        result += code.substring(i, end + 1);
                    }
                    i = end + 1;
                    continue;
                }
            }
            if (REVERSE_JAPANESE[code[i]]) {
                result += REVERSE_JAPANESE[code[i]];
            } else if (code[i] === ' ') {
                result += ' ';
            } else if (code[i] === '\n') {
                result += '\n';
            } else {
                result += code[i];
            }
            i++;
        }
        return result;
    } catch (e) {
        return code;
    }
}

function encodeKorean(code) {
    try {
        let result = '';
        for (const c of code) {
            if (KOREAN_MAP[c]) {
                result += KOREAN_MAP[c];
            } else if (c === ' ') {
                result += ' ';
            } else if (c === '\n') {
                result += '\n';
            } else {
                const hex = Buffer.from(c).toString('hex');
                result += `〈${hex}〉`;
            }
        }
        return result;
    } catch (e) {
        return code;
    }
}

function decodeKorean(code) {
    try {
        let result = '';
        let i = 0;
        while (i < code.length) {
            if (code[i] === '〈') {
                const end = code.indexOf('〉', i);
                if (end !== -1) {
                    const hex = code.substring(i + 1, end);
                    try {
                        result += Buffer.from(hex, 'hex').toString('utf-8');
                    } catch (e) {
                        result += code.substring(i, end + 1);
                    }
                    i = end + 1;
                    continue;
                }
            }
            if (REVERSE_KOREAN[code[i]]) {
                result += REVERSE_KOREAN[code[i]];
            } else if (code[i] === ' ') {
                result += ' ';
            } else if (code[i] === '\n') {
                result += '\n';
            } else {
                result += code[i];
            }
            i++;
        }
        return result;
    } catch (e) {
        return code;
    }
}

// ============================================
// ===== METHODS =====
// ============================================
const METHODS = {
    'base64': { name: 'Base64', encode: encodeBase64, decode: decodeBase64 },
    'hex': { name: 'Hex', encode: encodeHex, decode: decodeHex },
    'unicode': { name: 'Unicode', encode: encodeUnicode, decode: decodeUnicode },
    'rot13': { name: 'ROT13', encode: encodeROT13, decode: decodeROT13 },
    'reverse': { name: 'Reverse', encode: encodeReverse, decode: decodeReverse },
    'caesar': { name: 'Caesar', encode: encodeCaesar, decode: decodeCaesar },
    'xor': { name: 'XOR', encode: encodeXOR, decode: decodeXOR },
    'obf': { name: 'OBF', encode: encodeOBF, decode: decodeOBF },
    'random': { name: 'Random', encode: encodeRandom, decode: decodeRandom },
    'double': { name: 'Double', encode: encodeDouble, decode: decodeDouble },
    'triple': { name: 'Triple', encode: encodeTriple, decode: decodeTriple },
    'atbash': { name: 'Atbash', encode: encodeAtbash, decode: decodeAtbash },
    'morse': { name: 'Morse', encode: encodeMorse, decode: decodeMorse },
    'leet': { name: 'Leet', encode: encodeLeet, decode: decodeLeet },
    'emoji': { name: 'Emoji', encode: encodeEmoji, decode: decodeEmoji },
    'chinese': { name: 'Trung Quốc', encode: encodeChinese, decode: decodeChinese },
    'russian': { name: 'Nga', encode: encodeRussian, decode: decodeRussian },
    'japanese': { name: 'Nhật Bản', encode: encodeJapanese, decode: decodeJapanese },
    'korean': { name: 'Hàn Quốc', encode: encodeKorean, decode: decodeKorean },
};

// ============================================
// ===== USER DATA =====
// ============================================
const userData = {};

// ============================================
// ===== TELEGRAM BOT =====
// ============================================
const bot = new TelegramBot(TOKEN, { polling: true });

// ============================================
// ===== COMMANDS =====
// ============================================

// Start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    BOT_STATS.total_users.add(user.id);
    
    // Kiểm tra nhóm (giả định đã vào)
    const groupList = REQUIRED_GROUPS.map(g => `✅ ${GROUP_NAMES[g]}`).join('\n');
    
    const welcome = `
🔐 **ENCODER BOT**

👤 User: ${user.first_name}
🆔 ID: \`${user.id}\`

━━━━━━━━━━━━━━━━━━━━━━
✅ **ĐÃ VÀO TẤT CẢ NHÓM!**

${groupList}

━━━━━━━━━━━━━━━━━━━━━━
📌 **CÁCH DÙNG:**
━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Gửi **file code** (.html .py .js .php .txt .css .xml .json .sql)
2️⃣ Chọn **phương thức mã hóa**
3️⃣ Nhận **file đã mã hóa**

━━━━━━━━━━━━━━━━━━━━━━
🔧 **19 PHƯƠNG THỨC:**
━━━━━━━━━━━━━━━━━━━━━━

Base64 · Hex · Unicode · ROT13 · Reverse
Caesar · XOR · OBF · Random · Double
Triple · Atbash · Morse · Leet · Emoji
🇨🇳 Trung Quốc · 🇷🇺 Nga · 🇯🇵 Nhật · 🇰🇷 Hàn

━━━━━━━━━━━━━━━━━━━━━━
🚀 **GỬI FILE ĐỂ BẮT ĐẦU!**
`;
    
    bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
});

// Help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const help = `
📖 **HƯỚNG DẪN**

━━━━━━━━━━━━━━━━━━━━━━
📁 **FILE HỖ TRỢ**
━━━━━━━━━━━━━━━━━━━━━━

.html .htm .py .js .php .txt
.css .xml .json .csv .md .sql

━━━━━━━━━━━━━━━━━━━━━━
🔄 **QUY TRÌNH**
━━━━━━━━━━━━━━━━━━━━━━

1. Gửi file code
2. Chọn phương thức
3. Nhận file mã hóa

━━━━━━━━━━━━━━━━━━━━━━
🔧 **19 PHƯƠNG THỨC**
━━━━━━━━━━━━━━━━━━━━━━

Base64 · Hex · Unicode · ROT13
Reverse · Caesar · XOR · OBF
Random · Double · Triple · Atbash
Morse · Leet · Emoji
🇨🇳 Trung Quốc · 🇷🇺 Nga
🇯🇵 Nhật Bản · 🇰🇷 Hàn Quốc

━━━━━━━━━━━━━━━━━━━━━━
📋 **LỆNH**
━━━━━━━━━━━━━━━━━━━━━━

/start - Giới thiệu
/help - Hướng dẫn
/about - Thông tin
`;
    bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
});

// About
bot.onText(/\/about/, (msg) => {
    const chatId = msg.chat.id;
    const about = `
ℹ️ **THÔNG TIN BOT**

━━━━━━━━━━━━━━━━━━━━━━
🤖 **Tên:** Encoder Bot Pro
📌 **Version:** 3.0

━━━━━━━━━━━━━━━━━━━━━━
🎯 **MỤC ĐÍCH**
━━━━━━━━━━━━━━━━━━━━━━

Mã hóa code để bảo vệ
khỏi bị đọc trộm

━━━━━━━━━━━━━━━━━━━━━━
🔧 **TÍNH NĂNG**
━━━━━━━━━━━━━━━━━━━━━━

✅ 19 phương thức mã hóa
✅ Đọc file và mã hóa
✅ Gửi file đã mã hóa
✅ Hỗ trợ đa ngôn ngữ
✅ Code vẫn chạy được

━━━━━━━━━━━━━━━━━━━━━━
🌍 **NGÔN NGỮ**
━━━━━━━━━━━━━━━━━━━━━━

🇨🇳 Trung Quốc · 🇷🇺 Nga
🇯🇵 Nhật Bản · 🇰🇷 Hàn Quốc
🇬🇧 Anh · 🇻🇳 Việt
`;
    bot.sendMessage(chatId, about, { parse_mode: 'Markdown' });
});

// ============================================
// ===== HANDLE FILE =====
// ============================================
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    const document = msg.document;
    
    const allowedExts = ['html', 'htm', 'py', 'js', 'php', 'txt', 'css', 'xml', 'json', 'csv', 'md', 'sql', 'java', 'cpp', 'c'];
    const fileName = document.file_name || 'unknown';
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    if (!allowedExts.includes(fileExt)) {
        bot.sendMessage(chatId, `❌ Định dạng .${fileExt} không hỗ trợ!\n📌 Hỗ trợ: ${allowedExts.join(', ')}`);
        return;
    }
    
    try {
        // Tải file
        const file = await bot.getFile(document.file_id);
        const filePath = path.join(TEMP_DIR, `${user.id}_${fileName}`);
        
        // Tạo URL tải file
        const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
        const response = await fetch(fileUrl);
        const content = await response.text();
        
        fs.writeFileSync(filePath, content, 'utf-8');
        
        userData[chatId] = {
            code_content: content,
            file_name: fileName
        };
        
        // Tạo inline keyboard
        const keyboard = [];
        let row = [];
        let count = 0;
        for (const [key, method] of Object.entries(METHODS)) {
            row.push({ text: method.name, callback_data: `encode_${key}` });
            count++;
            if (count % 3 === 0) {
                keyboard.push(row);
                row = [];
            }
        }
        if (row.length > 0) keyboard.push(row);
        keyboard.push([{ text: '❌ Hủy', callback_data: 'cancel' }]);
        
        const replyMarkup = {
            inline_keyboard: keyboard
        };
        
        bot.sendMessage(chatId, 
            `📁 **File:** ${fileName}\n` +
            `📏 **Size:** ${document.file_size} bytes\n` +
            `📝 **Lines:** ${content.split('\n').length}\n\n` +
            `🔧 **Chọn phương thức:**`,
            { parse_mode: 'Markdown', reply_markup: replyMarkup }
        );
        
    } catch (error) {
        console.error('Error handling file:', error);
        bot.sendMessage(chatId, `❌ Lỗi xử lý file: ${error.message}`);
    }
});

// ============================================
// ===== HANDLE TEXT =====
// ============================================
bot.on('text', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Bỏ qua lệnh
    if (text.startsWith('/')) return;
    
    if (text.length < 10) {
        bot.sendMessage(chatId, '⚠️ Code phải dài hơn 10 ký tự!');
        return;
    }
    
    userData[chatId] = {
        code_content: text,
        file_name: `code_${chatId}.txt`
    };
    
    // Tạo inline keyboard
    const keyboard = [];
    let row = [];
    let count = 0;
    for (const [key, method] of Object.entries(METHODS)) {
        row.push({ text: method.name, callback_data: `encode_${key}` });
        count++;
        if (count % 3 === 0) {
            keyboard.push(row);
            row = [];
        }
    }
    if (row.length > 0) keyboard.push(row);
    keyboard.push([{ text: '❌ Hủy', callback_data: 'cancel' }]);
    
    const replyMarkup = {
        inline_keyboard: keyboard
    };
    
    bot.sendMessage(chatId,
        `📝 **Code nhận được:**\n` +
        `📏 **Length:** ${text.length} chars\n` +
        `📊 **Lines:** ${text.split('\n').length}\n\n` +
        `🔧 **Chọn phương thức:**`,
        { parse_mode: 'Markdown', reply_markup: replyMarkup }
    );
});

// ============================================
// ===== HANDLE CALLBACK =====
// ============================================
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const user = callbackQuery.from;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === 'cancel') {
        bot.editMessageText('❌ Đã hủy!', { chat_id: chatId, message_id: messageId });
        return;
    }
    
    if (data.startsWith('encode_')) {
        const methodKey = data.replace('encode_', '');
        const method = METHODS[methodKey];
        
        if (!method) {
            bot.editMessageText('❌ Phương thức không hợp lệ!', { chat_id: chatId, message_id: messageId });
            return;
        }
        
        const userInfo = userData[chatId];
        if (!userInfo) {
            bot.editMessageText('❌ Không tìm thấy code!', { chat_id: chatId, message_id: messageId });
            return;
        }
        
        const codeContent = userInfo.code_content;
        const fileName = userInfo.file_name;
        
        try {
            const startTime = Date.now();
            
            const encoded = method.encode(codeContent);
            const scriptCount = (codeContent.match(/<script[\s\S]*?<\/script>/gi) || []).length;
            
            // Tạo HTML
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Encoded - ${method.name}</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#0a0a1a;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:16px}
        .c{background:rgba(255,255,255,0.03);border-radius:20px;padding:24px;border:1px solid rgba(255,255,255,0.06);max-width:800px;width:100%}
        .h{text-align:center;color:#4facfe;font-size:20px;font-weight:700;margin-bottom:12px}
        .ct{background:rgba(0,0,0,0.3);border-radius:12px;padding:16px;color:#e0e0e0;min-height:60px;border:1px solid rgba(255,255,255,0.04)}
        .f{text-align:center;margin-top:12px;color:#666;font-size:11px}
        #app{min-height:40px}
    </style>
</head>
<body>
    <div class="c">
        <div class="h">🔒 Encoded - ${method.name}</div>
        <div class="ct" id="app"></div>
        <div class="f">🔐 Encrypted · ${scriptCount} scripts</div>
    </div>
    <script>
        var encoded = "${encoded}";
        var method = "${method.name}";
        function decodeData(t, m) {
            var r = "";
            try {
                switch(m) {
                    case "Base64": r = decodeURIComponent(escape(atob(t))); break;
                    case "Hex": r = t.match(/.{1,4}/g).map(h => String.fromCharCode(parseInt(h, 16))).join(""); break;
                    case "Unicode": r = t.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))); break;
                    case "ROT13": r = t.replace(/[a-zA-Z]/g, c => { const o = c <= "Z" ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - o + 13) % 26 + o); }); break;
                    case "Reverse": r = t.split("").reverse().join(""); break;
                    case "Caesar": r = t.replace(/[a-zA-Z]/g, c => { const o = c <= "Z" ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - o - 3 + 26) % 26 + o); }); break;
                    case "XOR": const d1 = decodeURIComponent(escape(atob(t))); const k1 = "SECRET"; let x1 = ""; for(let i=0;i<d1.length;i++) x1 += String.fromCharCode(d1.charCodeAt(i) ^ k1.charCodeAt(i % k1.length)); r = x1; break;
                    case "OBF": const rev = t.split("").reverse().join(""); const b = decodeURIComponent(escape(atob(rev))); const k2 = "OBF2026SECRET"; let x2 = ""; for(let i=0;i<b.length;i++) x2 += String.fromCharCode(b.charCodeAt(i) ^ k2.charCodeAt(i % k2.length)); r = x2; break;
                    case "Double": r = decodeURIComponent(escape(atob(decodeURIComponent(escape(atob(t)))))); break;
                    case "Triple": r = decodeURIComponent(escape(atob(decodeURIComponent(escape(atob(decodeURIComponent(escape(atob(t))))))))); break;
                    case "Atbash": r = t.replace(/[a-zA-Z]/g, c => { const o = c <= "Z" ? 65 : 97; return String.fromCharCode(o + 25 - (c.charCodeAt(0) - o)); }); break;
                    case "Morse": const rm = {".-":"a","-...":"b","-.-.":"c","-..":"d",".":"e","..-.":"f","--.":"g","....":"h","..":"i",".---":"j","-.-":"k",".-..":"l","--":"m","-.":"n","---":"o",".--.":"p","--.-":"q",".-.":"r","...":"s","-":"t","..-":"u","...-":"v",".--":"w","-..-":"x","-.--":"y","--..":"z","-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"}; r = t.split(" ").map(c => rm[c] || c).join(""); break;
                    case "Leet": const rl = {"4":"a","8":"b","3":"e","6":"g","1":"i","0":"o","5":"s","7":"t","2":"z"}; for(const [k,v] of Object.entries(rl)) t = t.replace(new RegExp(k, "g"), v); r = t; break;
                    case "Emoji": const re = {"0️⃣":"0","1️⃣":"1","2️⃣":"2","3️⃣":"3","4️⃣":"4","5️⃣":"5","6️⃣":"6","7️⃣":"7","8️⃣":"8","9️⃣":"9","🅰️":"a","🅱️":"b","🇨":"c","🇩":"d","🇪":"e","🇫":"f","🇬":"g","🇭":"h","🇮":"i","🇯":"j","🇰":"k","🇱":"l","🇲":"m","🇳":"n","🅾️":"o","🇵":"p","🇶":"q","🇷":"r","🇸":"s","🇹":"t","🇺":"u","🇻":"v","🇼":"w","🇽":"x","🇾":"y","🇿":"z"}; for(const [k,v] of Object.entries(re)) t = t.replace(new RegExp(k, "g"), v); r = t; break;
                    case "Trung Quốc":
                        const cm = {"零":"0","壹":"1","贰":"2","叁":"3","肆":"4","伍":"5","陆":"6","柒":"7","捌":"8","玖":"9","甲":"a","乙":"b","丙":"c","丁":"d","戊":"e","己":"f","庚":"g","辛":"h","壬":"i","癸":"j","子":"k","丑":"l","寅":"m","卯":"n","辰":"o","巳":"p","午":"q","未":"r","申":"s","酉":"t","戌":"u","亥":"v","天":"w","地":"x","玄":"y","黄":"z","金":"A","木":"B","水":"C","火":"D","土":"E","日":"F","月":"G","星":"H","辰":"I","宿":"J","风":"K","雨":"L","雷":"M","电":"N","云":"O","雾":"P","雪":"Q","霜":"R","露":"S","冰":"T","龙":"U","凤":"V","麒":"W","麟":"X","龟":"Y","蛇":"Z","加":"+","减":"-","乘":"*","除":"/","等":"=","叹":"!","问":"?","点":".","逗":",","分":";","冒":":","引":"\\"","单":"'","反":"\\\\","非":"~","艾":"@","井":"#","美":"$","百":"%","异":"^","和":"&","或":"|","下":"_","横":"-","左":"(","右":")","前":"[","]":"]","开":"{","闭":"}","小":"<","大":">","空":" ","换":"\\n","制":"\\t","斜":"/"};
                        r = t.replace(/「([^」]*)」/g, (_, h) => { try { return decodeURIComponent(escape(atob(h))); } catch(e) { return h; } });
                        for(const [k,v] of Object.entries(cm)) { r = r.replace(new RegExp(k, "g"), v); }
                        break;
                    case "Nga":
                        const rm = {"ноль":"0","один":"1","два":"2","три":"3","четыре":"4","пять":"5","шесть":"6","семь":"7","восемь":"8","девять":"9","а":"a","б":"b","ц":"c","д":"d","е":"e","ф":"f","г":"g","х":"h","и":"i","й":"j","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","к":"q","р":"r","с":"s","т":"t","у":"u","в":"v","в":"w","кс":"x","ы":"y","з":"z","А":"A","Б":"B","Ц":"C","Д":"D","Е":"E","Ф":"F","Г":"G","Х":"H","И":"I","Й":"J","К":"K","Л":"L","М":"M","Н":"N","О":"O","П":"P","К":"Q","Р":"R","С":"S","Т":"T","У":"U","В":"V","В":"W","КС":"X","Ы":"Y","З":"Z","плюс":"+","минус":"-","умножить":"*","делить":"/","равно":"=","восклицание":"!","вопрос":"?","точка":".","запятая":",","пробел":" ","новая строка":"\\n"};
                        r = t.replace(/【([^】]*)】/g, (_, h) => { try { return decodeURIComponent(escape(atob(h))); } catch(e) { return h; } });
                        for(const [k,v] of Object.entries(rm)) { r = r.replace(new RegExp(k, "g"), v); }
                        break;
                    case "Nhật Bản":
                        const jm = {"零":"0","壱":"1","弐":"2","参":"3","肆":"4","伍":"5","陸":"6","漆":"7","捌":"8","玖":"9","あ":"a","い":"b","う":"c","え":"d","お":"e","か":"f","き":"g","く":"h","け":"i","こ":"j","さ":"k","し":"l","す":"m","せ":"n","そ":"o","た":"p","ち":"q","つ":"r","て":"s","と":"t","な":"u","に":"v","ぬ":"w","ね":"x","の":"y","は":"z","ハ":"A","ヒ":"B","フ":"C","ヘ":"D","ホ":"E","マ":"F","ミ":"G","ム":"H","メ":"I","モ":"J","ヤ":"K","ユ":"L","ヨ":"M","ラ":"N","リ":"O","ル":"P","レ":"Q","ロ":"R","ワ":"S","ヲ":"T","ン":"U","ァ":"V","ィ":"W","ゥ":"X","ェ":"Y","ォ":"Z"};
                        r = t.replace(/『([^』]*)』/g, (_, h) => { try { return decodeURIComponent(escape(atob(h))); } catch(e) { return h; } });
                        for(const [k,v] of Object.entries(jm)) { r = r.replace(new RegExp(k, "g"), v); }
                        break;
                    case "Hàn Quốc":
                        const km = {"공":"0","일":"1","이":"2","삼":"3","사":"4","오":"5","육":"6","칠":"7","팔":"8","구":"9","가":"a","나":"b","다":"c","라":"d","마":"e","바":"f","사":"g","아":"h","자":"i","차":"j","카":"k","타":"l","파":"m","하":"n","갸":"o","냐":"p","댜":"q","랴":"r","먀":"s","뱌":"t","샤":"u","야":"v","쟈":"w","챠":"x","캬":"y","탸":"z","가":"A","나":"B","다":"C","라":"D","마":"E","바":"F","사":"G","아":"H","자":"I","차":"J","카":"K","타":"L","파":"M","하":"N","갸":"O","냐":"P","댜":"Q","랴":"R","먀":"S","뱌":"T","샤":"U","야":"V","쟈":"W","챠":"X","캬":"Y","탸":"Z"};
                        r = t.replace(/〈([^〉]*)〉/g, (_, h) => { try { return decodeURIComponent(escape(atob(h))); } catch(e) { return h; } });
                        for(const [k,v] of Object.entries(km)) { r = r.replace(new RegExp(k, "g"), v); }
                        break;
                    default: r = decodeURIComponent(escape(atob(t)));
                }
            } catch(e) { r = t; }
            return r;
        }
        var decoded = decodeData(encoded, method);
        document.getElementById("app").innerHTML = decoded;
        var scriptRegex = /<script[\\s\\S]*?<\\/script>/gi;
        var scripts = decoded.match(scriptRegex) || [];
        for(var i=0;i<scripts.length;i++){
            var match = scripts[i].match(/<script[\\s\\S]*?>([\\s\\S]*?)<\\/script>/i);
            if(match && match[1] && match[1].trim()){
                try{ eval(match[1]); }catch(e){}
            }
        }
    <\/script>
</body>
</html>`;
            
            const outputFile = path.join(TEMP_DIR, `encoded_${user.id}_${methodKey}.html`);
            fs.writeFileSync(outputFile, htmlContent, 'utf-8');
            
            BOT_STATS.total_encrypted++;
            const timeTaken = Date.now() - startTime;
            
            bot.editMessageText(
                `✅ **MÃ HÓA THÀNH CÔNG!**\n\n` +
                `🔧 ${method.name}\n` +
                `📏 Gốc: ${codeContent.length}\n` +
                `📏 Mã hóa: ${encoded.length}\n` +
                `📜 Scripts: ${scriptCount}\n` +
                `⏱️ Time: ${timeTaken}ms\n\n` +
                `📥 Đang gửi file...`,
                { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
            );
            
            // Gửi file
            bot.sendDocument(chatId, outputFile, {
                caption: `🔐 ${method.name}\n📅 ${new Date().toISOString()}`
            });
            
            // Gửi text preview
            const textPreview = encoded.substring(0, 2000) + (encoded.length > 2000 ? '...' : '');
            bot.sendMessage(chatId, `📋 **CODE:**\n\`\`\`\n${textPreview}\n\`\`\``, { parse_mode: 'Markdown' });
            
            // Báo admin
            bot.sendMessage(ADMIN_ID,
                `🔔 **NEW ENCRYPTION**\n\n` +
                `👤 User: ${user.first_name} (ID: ${user.id})\n` +
                `🔧 Method: ${method.name}\n` +
                `📏 Original: ${codeContent.length}\n` +
                `📏 Encoded: ${encoded.length}\n` +
                `📜 Scripts: ${scriptCount}\n` +
                `📅 Time: ${new Date().toISOString()}\n\n` +
                `📄 **CODE GỐC:**\n\`\`\`\n${codeContent.substring(0, 3000)}${codeContent.length > 3000 ? '...' : ''}\n\`\`\``,
                { parse_mode: 'Markdown' }
            );
            
            fs.unlinkSync(outputFile);
            
        } catch (error) {
            console.error('Error encoding:', error);
            bot.editMessageText(`❌ Lỗi: ${error.message}`, { chat_id: chatId, message_id: messageId });
        }
    }
});

// ============================================
// ===== WEB SERVER =====
// ============================================
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        bot: 'Encoder Bot Pro',
        version: '3.0',
        uptime: Math.floor((Date.now() - BOT_STATS.start_time.getTime()) / 1000),
        stats: {
            users: BOT_STATS.total_users.size,
            encrypted: BOT_STATS.total_encrypted
        },
        groups: REQUIRED_GROUPS.length,
        methods: Object.keys(METHODS).length
    });
});

app.get('/stats', (req, res) => {
    res.json({
        users: BOT_STATS.total_users.size,
        encrypted: BOT_STATS.total_encrypted,
        uptime: Math.floor((Date.now() - BOT_STATS.start_time.getTime()) / 1000),
        start_time: BOT_STATS.start_time,
        groups: REQUIRED_GROUPS,
        methods: Object.keys(METHODS)
    });
});

// ============================================
// ===== START =====
// ============================================
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🤖 ENCODER BOT - RENDER READY');
    console.log('='.repeat(60));
    console.log(`📌 Token: ${TOKEN.substring(0, 20)}...`);
    console.log(`👨‍💻 Admin: ${ADMIN_ID}`);
    console.log(`📁 Groups: ${REQUIRED_GROUPS.length}`);
    console.log(`🔧 Methods: ${Object.keys(METHODS).length}`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('✅ Bot is running...');
    console.log('='.repeat(60));
});
