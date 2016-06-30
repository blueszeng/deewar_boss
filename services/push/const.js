exports.API_URL = {
    'S_MSG_REGID':'https://api.xmpush.xiaomi.com/v2/message/regid',
    'B_MSG_ALL':'https://api.xmpush.xiaomi.com/v2/message/all'

};

exports.NOTIFY_TYPE = {
    DEFAULT: -1,
    SOUND: 1 << 0,
    VIBRATE: 1 << 1,
    LIGHTS: 1 << 2
};

exports.NOTIFY_ID = {
    DEFAULT: 0,
    ID_0: 0,
    ID_1: 1,
    ID_2: 2,
    ID_3: 3,
    ID_4: 4
};

exports.NOTIFY_FOREGROUND = {
    DEFAULT: 1,
    DISCARD: 0,
    KEEP: 1
};

exports.NOTIFY_EFFECT = {
    DEFAULT: 1,
    INTENT_URI: 2,
    WEB_URI: 3
};

exports.PASS_THROUGH = {
    DEFAULT: 0,
    NO: 0,
    YES: 1
};